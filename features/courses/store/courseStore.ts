import { coursesApi } from "@/features/courses/api/coursesApi";
import { aiService } from '@/features/courses/utils/ai';
import { scheduleBookmarkMilestoneNotification } from '@/features/notifications/services/notificationService';
import { Course } from "@/shared/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { analytics } from "@/core/services/analyticsService";

interface TimelineEvent {
  id: string;
  courseId: string;
  title: string;
  action: string;
  type: 'enroll' | 'complete' | 'quiz' | 'bookmark' | 'join';
  timestamp: number;
}

interface CourseState {
  courses: Course[];
  filteredCourses: Course[];
  recommendedCourses: Course[];
  bookmarks: string[]; // Store as array of IDs for easier serialization
  enrolledCourses: string[];
  completedCourses: string[];
  quizScores: Record<string, number>;
  timeline: TimelineEvent[];
  notes: Record<string, string[]>; // courseId -> array of note strings
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  lastFetched: number | null;
  streak: number;
  lastStreakUpdate: number | null;
  aiRecommendedIds: string[];

  fetchCourses: () => Promise<void>;
  getAIRecommendations: (interests: string[]) => Promise<void>;
  setAiRecommendedIds: (ids: string[]) => void;
  searchCourses: (query: string) => void;
  toggleBookmark: (courseId: string) => Promise<void>;
  enrollCourse: (courseId: string) => Promise<void>;
  unenrollCourse: (courseId: string) => void;
  completeCourse: (courseId: string) => void;
  updateQuizScore: (courseId: string, score: number) => void;
  addNote: (courseId: string, note: string) => void;
  updateStreak: () => void;
  refreshCourses: () => Promise<void>;
  getCourseById: (id: string) => Course | undefined;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
}


const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getFriendlyErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "NO_INTERNET") {
      return "No internet connection. Showing cached content when available.";
    }

    if (error.message === "TIMEOUT") {
      return "The request took too long. Please try again.";
    }
  }

  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      return apiMessage;
    }
  }

  return "Could not load courses right now. Pull to refresh and try again.";
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses: [],
      filteredCourses: [],
      recommendedCourses: [],
      bookmarks: [],
      enrolledCourses: [],
      completedCourses: [],
      quizScores: {},
      timeline: [],
      notes: {},
      isLoading: false,
      error: null,
      searchQuery: "",
      lastFetched: null,
      streak: 0,
      lastStreakUpdate: null,
      aiRecommendedIds: [],

      addTimelineEvent: (event) => {
        const { timeline } = get();
        const newEvent: TimelineEvent = {
          ...event,
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          timestamp: Date.now(),
        };
        // Keep the latest 20 events
        set({ timeline: [newEvent, ...timeline].slice(0, 20) });
      },

      fetchCourses: async () => {

        const { courses, lastFetched } = get();
        const now = Date.now();

        // Use cache if within TTL
        if (
          courses.length > 0 &&
          lastFetched &&
          now - lastFetched < CACHE_TTL
        ) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const fetchedCourses = await coursesApi.fetchCourses();

          set({
            courses: fetchedCourses,
            filteredCourses: fetchedCourses,
            lastFetched: now,
            error: null,
            isLoading: false,
          });
        } catch (error) {
          set({ error: getFriendlyErrorMessage(error), isLoading: false });
        }
      },

      getAIRecommendations: async (interests: string[]) => {
        const { courses } = get();
        if (courses.length === 0) return;

        try {
          const recommended = await aiService.getRecommendedCourses(courses, interests);
          set({ recommendedCourses: recommended });
        } catch {
          // Silently fail — AI recommendations are non-critical
        }
      },

      setAiRecommendedIds: (ids: string[]) => {
        set({ aiRecommendedIds: ids });
      },

      searchCourses: (query: string) => {

        const { courses } = get();
        const lowerQuery = query.toLowerCase();

        if (!query.trim()) {
          set({ searchQuery: query, filteredCourses: courses });
          return;
        }

        const filtered = courses.filter(
          (c) =>
            c.title.toLowerCase().includes(lowerQuery) ||
            c.description.toLowerCase().includes(lowerQuery) ||
            c.category.toLowerCase().includes(lowerQuery) ||
            c.instructor.name.toLowerCase().includes(lowerQuery),
        );

        set({ searchQuery: query, filteredCourses: filtered });
      },

      toggleBookmark: async (courseId: string) => {
        const { bookmarks, courses, addTimelineEvent } = get();
        const isBookmarked = bookmarks.includes(courseId);

        // Optimistic update
        const newBookmarks = isBookmarked
          ? bookmarks.filter((id) => id !== courseId)
          : [...bookmarks, courseId];
        set({ bookmarks: newBookmarks });

        try {
          await coursesApi.toggleBookmark(courseId);
        } catch {
          // Rollback on failure
          set({ bookmarks });
          return;
        }

        if (!isBookmarked) {
          const course = courses.find((c) => c.id === courseId);
          if (course) {
            addTimelineEvent({
              courseId,
              title: course.title,
              action: `Bookmarked "${course.title}"`,
              type: 'bookmark',
            });
          }
          analytics.logEvent('course_bookmark', { courseId, action: 'added' });
          if (newBookmarks.length >= 5) {
            scheduleBookmarkMilestoneNotification();
          }
        } else {
          analytics.logEvent('course_bookmark', { courseId, action: 'removed' });
        }
      },

      enrollCourse: async (courseId: string) => {
        const { enrolledCourses, courses, addTimelineEvent } = get();
        if (enrolledCourses.includes(courseId)) return;

        // Optimistic update
        set({ enrolledCourses: [...enrolledCourses, courseId] });

        try {
          await coursesApi.enroll(courseId);
        } catch (err: any) {
          // 409 = already enrolled on server — keep local state
          // 402 = payment required — rollback
          if (err?.response?.status === 402) {
            set({ enrolledCourses });
            throw err;
          }
          // For other errors, keep optimistic state (offline tolerance)
        }

        const course = courses.find((c) => c.id === courseId);
        if (course) {
          addTimelineEvent({
            courseId,
            title: course.title,
            action: `Enrolled in "${course.title}"`,
            type: 'enroll',
          });
        }
        analytics.logEvent('course_enroll', { courseId });
      },

      unenrollCourse: (courseId: string) => {
        const { enrolledCourses, completedCourses } = get();
        set({
          enrolledCourses: enrolledCourses.filter(id => id !== courseId),
          completedCourses: completedCourses.filter(id => id !== courseId)
        });
      },

      completeCourse: (courseId: string) => {
        const { completedCourses, enrolledCourses, courses, addTimelineEvent } = get();

        if (completedCourses.includes(courseId)) {
          return;
        }

        if (!enrolledCourses.includes(courseId)) {
          set({
            enrolledCourses: [...enrolledCourses, courseId],
            completedCourses: [...completedCourses, courseId],
          });
        } else {
          set({ completedCourses: [...completedCourses, courseId] });
        }
        
        const course = courses.find((c) => c.id === courseId);
        if (course) {
          addTimelineEvent({
            courseId,
            title: course.title,
            action: `Completed "${course.title}"`,
            type: 'complete',
          });
        }
        // Use a generic event name or add 'course_complete' to type
        analytics.logEvent('quiz_complete', { courseId, type: 'course_finished' });
      },

      updateQuizScore: (courseId: string, score: number) => {
        const { quizScores, courses, addTimelineEvent } = get();
        const currentScore = quizScores[courseId] || 0;
        set({
          quizScores: {
            ...quizScores,
            [courseId]: Math.max(currentScore, score),
          },
        });

        // Add timeline event if it's a new high score or first time
        if (score > currentScore) {
          const course = courses.find((c) => c.id === courseId);
          if (course) {
            addTimelineEvent({
              courseId,
              title: course.title,
              action: `Scored ${score}% on "${course.title}" Quiz`,
              type: 'quiz',
            });
          }
        }
        analytics.logEvent('quiz_complete', { courseId, score });
      },

      addNote: (courseId, note) => {
        const { notes } = get();
        const courseNotes = notes[courseId] || [];
        set({
          notes: {
            ...notes,
            [courseId]: [note, ...courseNotes],
          },
        });
      },

      updateStreak: () => {
        const { streak, lastStreakUpdate } = get();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (!lastStreakUpdate) {
          set({ streak: 1, lastStreakUpdate: today });
          return;
        }

        const lastUpdate = new Date(lastStreakUpdate);
        const lastDay = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()).getTime();

        const diff = today - lastDay;
        const oneDay = 24 * 60 * 60 * 1000;

        if (diff === oneDay) {
          set({ streak: streak + 1, lastStreakUpdate: today });
        } else if (diff > oneDay) {
          set({ streak: 1, lastStreakUpdate: today });
        }
      },

      refreshCourses: async () => {
        set({ lastFetched: null, error: null });
        await get().fetchCourses();
      },

      getCourseById: (id: string) => {
        return get().courses.find((c) => c.id === id);
      },
    }),
    {
      name: "course-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        enrolledCourses: state.enrolledCourses,
        completedCourses: state.completedCourses,
        quizScores: state.quizScores,
        timeline: state.timeline,
        notes: state.notes,
        lastFetched: state.lastFetched,
        streak: state.streak,
        lastStreakUpdate: state.lastStreakUpdate,
      }),
    },
  ),
);

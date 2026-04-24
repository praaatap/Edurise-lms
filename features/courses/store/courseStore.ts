import { coursesApi } from "@/features/courses/api/coursesApi";
import { aiService } from '@/features/courses/utils/ai';
import { scheduleBookmarkMilestoneNotification } from '@/features/notifications/services/notificationService';
import { Course } from "@/shared/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  lastFetched: number | null;

  fetchCourses: () => Promise<void>;
  getAIRecommendations: (interests: string[]) => Promise<void>;
  searchCourses: (query: string) => void;
  toggleBookmark: (courseId: string) => void;
  enrollCourse: (courseId: string) => void;
  unenrollCourse: (courseId: string) => void;
  completeCourse: (courseId: string) => void;
  updateQuizScore: (courseId: string, score: number) => void;
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
      isLoading: false,
      error: null,
      searchQuery: "",
      lastFetched: null,

      addTimelineEvent: (event) => {
        const { timeline } = get();
        const newEvent: TimelineEvent = {
          ...event,
          id: Math.random().toString(36).substring(2, 11),
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
          const [instructors, products] = await Promise.all([
            coursesApi.fetchInstructors(),
            coursesApi.fetchProducts(),
          ]);

          const mergedCourses = coursesApi.mergeCourses(instructors, products);

          set({
            courses: mergedCourses,
            filteredCourses: mergedCourses,
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

      toggleBookmark: (courseId: string) => {
        const { bookmarks, courses, addTimelineEvent } = get();
        let newBookmarks;
        const isBookmarked = bookmarks.includes(courseId);

        if (isBookmarked) {
          newBookmarks = bookmarks.filter((id) => id !== courseId);
        } else {
          newBookmarks = [...bookmarks, courseId];
          const course = courses.find((c) => c.id === courseId);
          if (course) {
            addTimelineEvent({
              courseId,
              title: course.title,
              action: `Bookmarked "${course.title}"`,
              type: 'bookmark',
            });
          }
        }

        set({ bookmarks: newBookmarks });

        // Trigger notification check
        if (newBookmarks.length >= 5) {
          scheduleBookmarkMilestoneNotification();
        }
      },

      enrollCourse: (courseId: string) => {
        const { enrolledCourses, courses, addTimelineEvent } = get();
        if (!enrolledCourses.includes(courseId)) {
          set({ enrolledCourses: [...enrolledCourses, courseId] });
          const course = courses.find((c) => c.id === courseId);
          if (course) {
            addTimelineEvent({
              courseId,
              title: course.title,
              action: `Enrolled in "${course.title}"`,
              type: 'enroll',
            });
          }
        }
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
        courses: state.courses,
        bookmarks: state.bookmarks,
        enrolledCourses: state.enrolledCourses,
        completedCourses: state.completedCourses,
        quizScores: state.quizScores,
        timeline: state.timeline,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CourseProgress, LessonProgress } from '@/shared/types';
import { coursesApi } from '@/features/courses/api/coursesApi';

interface ProgressState {
  progressMap: Record<string, CourseProgress>; // key: courseId

  // Actions
  startCourse: (courseId: string, userId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string, score?: number) => void;
  setLastLesson: (courseId: string, lessonId: string) => void;
  getCourseProgress: (courseId: string) => CourseProgress | undefined;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  getOverallProgress: (courseId: string, totalLessons: number) => number;
  resetProgress: (courseId: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progressMap: {},

      startCourse: (courseId, userId) => {
        const existing = get().progressMap[courseId];
        if (!existing) {
          set((state) => ({
            progressMap: {
              ...state.progressMap,
              [courseId]: {
                courseId,
                userId,
                completedLessons: [],
                overallProgress: 0,
                startedAt: new Date().toISOString(),
              },
            },
          }));
        }
      },

          markLessonComplete: (courseId, lessonId, score) => {
        set((state) => {
          const progress = state.progressMap[courseId];
          if (!progress) return state;

          const alreadyDone = progress.completedLessons.some((l) => l.lessonId === lessonId);
          const updatedLessons: LessonProgress[] = alreadyDone
            ? progress.completedLessons.map((l) =>
                l.lessonId === lessonId
                  ? { ...l, completed: true, score, completedAt: new Date().toISOString() }
                  : l
              )
            : [
                ...progress.completedLessons,
                { lessonId, completed: true, score, completedAt: new Date().toISOString() },
              ];

          const overallProgress = Math.round((updatedLessons.filter(l => l.completed).length / Math.max(updatedLessons.length, 1)) * 100);

          // Fire-and-forget sync to backend
          const lessonNum = parseInt(lessonId.replace(/\D/g, ''), 10) || 0;
          coursesApi.updateProgress(courseId, lessonNum, true, overallProgress).catch(() => {});

          return {
            progressMap: {
              ...state.progressMap,
              [courseId]: {
                ...progress,
                completedLessons: updatedLessons,
                overallProgress,
                lastAccessedLessonId: lessonId,
              },
            },
          };
        });
      },

      setLastLesson: (courseId, lessonId) => {
        set((state) => {
          const progress = state.progressMap[courseId];
          if (!progress) return state;
          return {
            progressMap: {
              ...state.progressMap,
              [courseId]: { ...progress, lastAccessedLessonId: lessonId },
            },
          };
        });
      },

      getCourseProgress: (courseId) => get().progressMap[courseId],

      isLessonCompleted: (courseId, lessonId) => {
        const progress = get().progressMap[courseId];
        return progress?.completedLessons.some((l) => l.lessonId === lessonId && l.completed) ?? false;
      },

      getOverallProgress: (courseId, totalLessons) => {
        if (totalLessons === 0) return 0;
        const progress = get().progressMap[courseId];
        if (!progress) return 0;
        const completed = progress.completedLessons.filter((l) => l.completed).length;
        return Math.round((completed / totalLessons) * 100);
      },

      resetProgress: (courseId) => {
        set((state) => {
          const newMap = { ...state.progressMap };
          delete newMap[courseId];
          return { progressMap: newMap };
        });
      },
    }),
    {
      name: 'progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * useCoursesQuery — React Query hooks for the Courses feature.
 *
 * Strategy:
 *   • Server state  (remote data)  → React Query  (cache, background refetch, dedup)
 *   • Client state  (local data)   → Zustand       (bookmarks, enrolled, progress, notes)
 *
 * This is a clean separation that matches the AITV stack (React Query + Zustand).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/features/courses/api/coursesApi';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { Course } from '@/shared/types';

// ─── Query Keys ────────────────────────────────────────────────────────────────
// Centralise keys so invalidation is consistent across the app.
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  detail: (id: string) => [...courseKeys.all, 'detail', id] as const,
};

// ─── useCoursesQuery ───────────────────────────────────────────────────────────
/**
 * Fetches the full course catalogue from the API.
 * Caches for 5 minutes (staleTime set at QueryClient level).
 *
 * Usage:
 *   const { data, isLoading, isError, refetch } = useCoursesQuery();
 */
export function useCoursesQuery() {
  return useQuery<Course[], Error>({
    queryKey: courseKeys.lists(),
    queryFn: async () => {
      const [instructors, products] = await Promise.all([
        coursesApi.fetchInstructors(),
        coursesApi.fetchProducts(),
      ]);
      const merged = coursesApi.mergeCourses(instructors, products);

      // Keep Zustand hydrated so offline/cached reads on detail screens work
      useCourseStore.setState({
        courses: merged,
        filteredCourses: merged,
        lastFetched: Date.now(),
        error: null,
      });

      return merged;
    },
  });
}

// ─── useCourseQuery ────────────────────────────────────────────────────────────
/**
 * Returns a single course by ID from the React Query cache.
 * Falls back to Zustand store for instant renders without an extra API call.
 *
 * Usage:
 *   const { data: course, isLoading } = useCourseQuery(id);
 */
export function useCourseQuery(id: string) {
  const getCourseById = useCourseStore((s) => s.getCourseById);

  return useQuery<Course | undefined, Error>({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      // Prefer the cached list data — no separate "get by ID" endpoint needed
      return getCourseById(id);
    },
    // Seed from the already-cached list so the UI renders immediately
    initialData: () => getCourseById(id),
    // Don't refetch detail if the list cache is fresh
    staleTime: 5 * 60 * 1000,
  });
}

// ─── useEnrollMutation ─────────────────────────────────────────────────────────
/**
 * Mutation to enroll a user in a course.
 * Optimistically updates Zustand, and invalidates the course list cache.
 *
 * Usage:
 *   const { mutate: enroll, isPending } = useEnrollMutation();
 *   enroll(courseId);
 */
export function useEnrollMutation() {
  const queryClient = useQueryClient();
  const enrollCourse = useCourseStore((s) => s.enrollCourse);

  return useMutation<void, Error, string>({
    mutationFn: async (courseId: string) => {
      // Optimistic update — feels instant to the user
      enrollCourse(courseId);

      // TODO: when you have a real backend:
      // await coursesApi.enroll(courseId);
    },
    onSuccess: (_data, courseId) => {
      // Invalidate the detail cache so any fresh data is reflected
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
    onError: (_err, courseId) => {
      // Roll back optimistic update on failure
      useCourseStore.getState().unenrollCourse(courseId);
    },
  });
}

import { apiClient } from '@/core/api/client';
import { Course, CourseLevel, Instructor } from '@/shared/types';

const FALLBACK_THUMBNAILS = [
  'https://picsum.photos/seed/course1/1000/600',
  'https://picsum.photos/seed/course2/1000/600',
  'https://picsum.photos/seed/course3/1000/600',
  'https://picsum.photos/seed/course4/1000/600',
  'https://picsum.photos/seed/course5/1000/600',
];

function mapDifficulty(d?: string): CourseLevel {
  if (!d) return 'Beginner';
  const lower = d.toLowerCase();
  if (lower === 'intermediate') return 'Intermediate';
  if (lower === 'advanced') return 'Advanced';
  return 'Beginner';
}

function mapBackendCourse(raw: any, index: number): Course {
  const instructor: Instructor = {
    id: raw.instructorId ?? `inst_${raw.id}`,
    name: raw.instructorName ?? 'Instructor',
    avatar: raw.instructorAvatar ?? `https://i.pravatar.cc/400?img=${(index % 70) + 1}`,
    location: '',
    email: '',
    role: 'Instructor',
  };

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    price: typeof raw.price === 'string' ? parseFloat(raw.price) : Number(raw.price ?? 0),
    thumbnail: raw.thumbnailUrl || FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length],
    category: raw.category ?? 'General',
    rating: raw.rating ?? 4.5,
    level: mapDifficulty(raw.difficulty),
    instructor,
    isBookmarked: raw.isBookmarked ?? false,
    isEnrolled: !!raw.enrollment,
    tags: [raw.category ?? 'General', 'Technology'],
    lessonsCount: raw.totalLessons ?? 10,
    reviewsCount: raw.reviewsCount ?? 0,
    progress: raw.enrollment?.progressPercent ?? 0,
    enrolledCount: raw.enrolledCount ?? 0,
    schoolId: raw.schoolId,
    lessons: raw.lessons,
  };
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
  price: number;
  difficulty: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  isPublished?: boolean;
}

export interface ReviewPayload {
  rating: number;
  comment?: string;
}

export const coursesApi = {
  fetchCourses: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    difficulty?: string;
    schoolId?: string;
  }): Promise<Course[]> => {
    const response = await apiClient.get('/courses', { params: { limit: 50, ...params } });
    const data = response.data;
    const rawCourses: any[] = Array.isArray(data.data) ? data.data : [];
    return rawCourses.map((c, i) => mapBackendCourse(c, i));
  },

  fetchMyCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get('/courses/mine');
    const rawCourses: any[] = Array.isArray(response.data?.data) ? response.data.data : [];
    return rawCourses.map((c, i) => mapBackendCourse(c, i));
  },

  fetchCourseById: async (id: string): Promise<Course | null> => {
    const response = await apiClient.get(`/courses/${id}`);
    if (!response.data?.data) return null;
    return mapBackendCourse(response.data.data, 0);
  },

  fetchRecommended: async (): Promise<Course[]> => {
    const response = await apiClient.get('/courses/recommended');
    const rawCourses: any[] = Array.isArray(response.data?.data) ? response.data.data : [];
    return rawCourses.map((c, i) => mapBackendCourse(c, i));
  },

  createCourse: async (payload: CreateCoursePayload): Promise<Course> => {
    const response = await apiClient.post('/courses', payload);
    return mapBackendCourse(response.data.data, 0);
  },

  updateCourse: async (id: string, payload: Partial<CreateCoursePayload>): Promise<Course> => {
    const response = await apiClient.patch(`/courses/${id}`, payload);
    return mapBackendCourse(response.data.data, 0);
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },

  // Bookmarks
  toggleBookmark: async (courseId: string): Promise<{ isBookmarked: boolean }> => {
    const response = await apiClient.post('/bookmarks', { courseId });
    return response.data.data;
  },

  fetchBookmarks: async (): Promise<Course[]> => {
    const response = await apiClient.get('/bookmarks');
    const items: any[] = Array.isArray(response.data?.data) ? response.data.data : [];
    return items.map((item, i) => mapBackendCourse(item.course ?? item, i));
  },

  // Enrollments
  enroll: async (courseId: string): Promise<void> => {
    await apiClient.post(`/enrollments/${courseId}`);
  },

  fetchMyEnrollments: async (): Promise<{ courseId: string; progressPercent: number; isCompleted: boolean }[]> => {
    const response = await apiClient.get('/enrollments');
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  updateProgress: async (courseId: string, lessonId: number, completed: boolean, progressPercent: number): Promise<void> => {
    await apiClient.patch(`/enrollments/${courseId}/progress`, { lessonId, completed, progressPercent });
  },

  // Reviews
  fetchReviews: async (courseId: string): Promise<any[]> => {
    const response = await apiClient.get(`/reviews/${courseId}`);
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  submitReview: async (courseId: string, payload: ReviewPayload): Promise<void> => {
    await apiClient.post(`/reviews/${courseId}`, payload);
  },

  // Legacy mock stubs (kept for existing tests)
  fetchInstructors: async () => [],
  fetchProducts: async () => [],
  mergeCourses: (_a: any[], _b: any[]): Course[] => [],
};

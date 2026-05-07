import { apiClient } from '@/core/api/client';

export interface CreateSchoolPayload {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  contactEmail?: string;
  website?: string;
}

export interface JoinSchoolPayload {
  joinCode: string;
}

export const schoolApi = {
  listSchools: async (params?: { search?: string; page?: number }) => {
    const res = await apiClient.get('/schools', { params });
    return res.data;
  },

  getSchoolBySlug: async (slug: string) => {
    const res = await apiClient.get(`/schools/${slug}`);
    return res.data;
  },

  createSchool: async (payload: CreateSchoolPayload) => {
    const res = await apiClient.post('/schools', payload);
    return res.data;
  },

  updateSchool: async (schoolId: string, payload: Partial<CreateSchoolPayload>) => {
    const res = await apiClient.patch(`/schools/${schoolId}`, payload);
    return res.data;
  },

  joinSchool: async (payload: JoinSchoolPayload) => {
    const res = await apiClient.post('/schools/join', payload);
    return res.data;
  },

  getLeaderboard: async (schoolId: string) => {
    const res = await apiClient.get(`/schools/${schoolId}/leaderboard`);
    return res.data;
  },

  getAnalytics: async (schoolId: string) => {
    const res = await apiClient.get(`/analytics/school-stats?schoolId=${schoolId}`);
    return res.data;
  },

  getTeachers: async (schoolId: string) => {
    const res = await apiClient.get(`/schools/${schoolId}/members?role=INSTRUCTOR`);
    return res.data;
  },

  getStudents: async (schoolId: string) => {
    const res = await apiClient.get(`/schools/${schoolId}/members?role=STUDENT`);
    return res.data;
  },

  inviteTeacher: async (schoolId: string, email: string) => {
    const res = await apiClient.post(`/schools/${schoolId}/invite`, { email });
    return res.data;
  },

  removeTeacher: async (schoolId: string, teacherId: string) => {
    const res = await apiClient.delete(`/schools/${schoolId}/members/${teacherId}`);
    return res.data;
  },

  removeStudent: async (schoolId: string, studentId: string) => {
    const res = await apiClient.delete(`/schools/${schoolId}/members/${studentId}`);
    return res.data;
  },
};

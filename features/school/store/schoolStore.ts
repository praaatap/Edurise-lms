import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/core/api/client';
import { School } from '@/shared/types';

interface SchoolState {
  schools: School[];
  activeSchool: School | null;
  isLoading: boolean;
  error: string | null;
  fetchMySchools: () => Promise<void>;
  fetchSchools: (search?: string) => Promise<void>;
  fetchSchoolBySlug: (slug: string) => Promise<School | null>;
  joinSchool: (joinCode: string) => Promise<void>;
  createSchool: (data: any) => Promise<School>;
  updateSchool: (schoolId: string, data: any) => Promise<void>;
  setActiveSchool: (school: School) => void;
}

function mapBackendSchool(raw: any): School {
  return {
    id: raw.id,
    _id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    logoUrl: raw.logoUrl,
    logo: raw.logoUrl,
    joinCode: raw.joinCode,
    ownerId: raw.ownerId,
    createdAt: raw.createdAt,
  };
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set, get) => ({
      schools: [],
      activeSchool: null,
      isLoading: false,
      error: null,

      fetchMySchools: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get('/schools/my/schools');
          if (response.data.success) {
            const schools = (response.data.data as any[]).map(mapBackendSchool);
            set({
              schools,
              activeSchool: get().activeSchool || schools[0] || null,
              isLoading: false,
            });
          }
        } catch {
          set({ error: 'Failed to fetch schools', isLoading: false });
        }
      },

      fetchSchools: async (search?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get('/schools', { params: search ? { search } : undefined });
          if (response.data.success) {
            const schools = (response.data.data as any[]).map(mapBackendSchool);
            set({ schools, isLoading: false });
          }
        } catch {
          set({ error: 'Failed to fetch schools', isLoading: false });
        }
      },

      fetchSchoolBySlug: async (slug: string) => {
        try {
          const response = await apiClient.get(`/schools/${slug}`);
          if (response.data.success) {
            return mapBackendSchool(response.data.data);
          }
          return null;
        } catch {
          return null;
        }
      },

      joinSchool: async (joinCode: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/schools/join', { joinCode });
          if (response.data.success) {
            const newSchool = mapBackendSchool(response.data.data);
            set((state) => ({
              schools: [...state.schools, newSchool],
              activeSchool: newSchool,
              isLoading: false,
            }));
          }
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Failed to join school',
            isLoading: false,
          });
          throw error;
        }
      },

      createSchool: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/schools', data);
          if (response.data.success) {
            const newSchool = mapBackendSchool(response.data.data);
            set((state) => ({
              schools: [...state.schools, newSchool],
              activeSchool: newSchool,
              isLoading: false,
            }));
            return newSchool;
          }
          throw new Error('Failed to create school');
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateSchool: async (schoolId: string, data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.patch(`/schools/${schoolId}`, data);
          if (response.data.success) {
            const updated = mapBackendSchool(response.data.data);
            set((state) => ({
              schools: state.schools.map((s) => s.id === schoolId ? updated : s),
              activeSchool: state.activeSchool?.id === schoolId ? updated : state.activeSchool,
              isLoading: false,
            }));
          }
        } catch {
          set({ isLoading: false });
        }
      },

      setActiveSchool: (school: School) => {
        set({ activeSchool: school });
      },
    }),
    {
      name: 'school-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

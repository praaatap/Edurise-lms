import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/core/api/client';

export interface Badge {
  id: string;
  type: string;
  earnedAt: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  issueDate: string;
  course: {
    title: string;
    instructorName: string;
  };
}

interface AchievementsState {
  badges: Badge[];
  certificates: Certificate[];
  isLoading: boolean;
  error: string | null;
  fetchAchievements: () => Promise<void>;
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set) => ({
      badges: [],
      certificates: [],
      isLoading: false,
      error: null,

      fetchAchievements: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get('/achievements');
          if (response.data.success) {
            set({ 
              badges: response.data.data.badges, 
              certificates: response.data.data.certificates,
              isLoading: false 
            });
          } else {
            set({ error: 'Failed to fetch achievements', isLoading: false });
          }
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error?.message || 'Error fetching achievements', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'achievements-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

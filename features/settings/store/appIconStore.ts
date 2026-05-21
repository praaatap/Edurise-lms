import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Names MUST match the plugin "name" fields exactly (PascalCase)
export type AppIconName = 'default' | 'Dark' | 'Green' | 'Blue' | 'Purple' | 'Minimal';

export const APP_ICONS: { name: AppIconName; label: string; color: string }[] = [
  { name: 'default', label: 'Default', color: '#48C78E' },
  { name: 'Dark',    label: 'Dark',    color: '#1a1a2e' },
  { name: 'Green',   label: 'Green',   color: '#22C55E' },
  { name: 'Blue',    label: 'Blue',    color: '#3B82F6' },
  { name: 'Purple',  label: 'Purple',  color: '#8B5CF6' },
  { name: 'Minimal', label: 'Minimal', color: '#64748B' },
];

interface AppIconState {
  selectedIcon: AppIconName;
  setSelectedIcon: (icon: AppIconName) => void;
}

export const useAppIconStore = create<AppIconState>()(
  persist(
    (set) => ({
      selectedIcon: 'default',
      setSelectedIcon: (icon) => set({ selectedIcon: icon }),
    }),
    {
      name: 'app-icon-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

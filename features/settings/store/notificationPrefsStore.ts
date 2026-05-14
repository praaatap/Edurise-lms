import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  cancelAllNotifications,
  scheduleReminderNotification,
  clearReminderNotification,
  clearCourseReminderNotification,
} from '@/features/notifications/services/notificationService';

interface NotificationCategories {
  reminders: boolean;
  courseUpdates: boolean;
  achievements: boolean;
  engagement: boolean;
}

interface NotificationPrefsState {
  masterEnabled: boolean;
  categories: NotificationCategories;
  setMasterEnabled: (enabled: boolean) => void;
  setCategoryEnabled: (category: keyof NotificationCategories, enabled: boolean) => void;
}

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set, get) => ({
      masterEnabled: true,
      categories: {
        reminders: true,
        courseUpdates: true,
        achievements: true,
        engagement: true,
      },
      setMasterEnabled: (enabled) => {
        set({ masterEnabled: enabled });
        if (!enabled) {
          cancelAllNotifications();
        } else {
          // Re-schedule the daily reminder when master is turned back on
          scheduleReminderNotification();
        }
      },
      setCategoryEnabled: (category, enabled) => {
        const { categories } = get();
        set({ categories: { ...categories, [category]: enabled } });
        // Cancel the relevant scheduled notification when its category is turned off
        if (!enabled) {
          if (category === 'reminders') clearReminderNotification();
          if (category === 'engagement') clearCourseReminderNotification();
        }
        // Re-schedule the daily reminder when reminders category is turned back on
        if (enabled && category === 'reminders') {
          scheduleReminderNotification();
        }
      },
    }),
    {
      name: 'notification-prefs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

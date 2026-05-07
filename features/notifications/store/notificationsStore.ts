import { create } from 'zustand';
import { apiClient } from '@/core/api/client';
import { AppNotification } from '@/shared/types';

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  registerPushToken: (token: string, deviceId: string) => Promise<void>;
}

function mapNotification(raw: any): AppNotification {
  return {
    id: raw.id,
    type: raw.type?.toLowerCase() as AppNotification['type'],
    title: raw.title,
    body: raw.body,
    isRead: raw.isRead ?? false,
    createdAt: raw.createdAt,
    data: raw.data,
  };
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/notifications');
      if (response.data.success) {
        const notifications = (response.data.data as any[]).map(mapNotification);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        set({ notifications, unreadCount, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {
      // UI already updated — silently fail
    }
  },

  markAllRead: async () => {
    const { notifications } = get();
    set({
      notifications: notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
    try {
      await Promise.all(
        notifications.filter(n => !n.isRead).map(n => apiClient.patch(`/notifications/${n.id}/read`))
      );
    } catch {
      // silently fail
    }
  },

  registerPushToken: async (token: string, deviceId: string) => {
    try {
      await apiClient.post('/notifications/token', { expoPushToken: token, deviceId });
    } catch {
      // non-critical
    }
  },
}));

'use client';

import { create } from 'zustand';
import { api } from '../api';

interface NotificationItem {
  id: string;
  recipient: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  readAt?: string | null;
}

interface NotificationState {
  notifications: NotificationItem[];
  loading: boolean;
  error: string | null;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  setNotifications: (callback: (current: NotificationItem[]) => NotificationItem[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  error: null,
  loadNotifications: async () => {
    set({ loading: true, error: null });

    try {
      const response = await api.get('/notifications');
      set({ notifications: response.data, loading: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Tidak dapat memuat notifikasi', loading: false });
    }
  },
  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, status: 'read', readAt: new Date().toISOString() } : notification,
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  },
  setNotifications: (callback: (current: NotificationItem[]) => NotificationItem[]) => {
    set((state) => ({ notifications: callback(state.notifications) }));
  },
}));

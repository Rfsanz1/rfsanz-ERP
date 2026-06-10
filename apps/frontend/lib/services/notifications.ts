import { api } from '../api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
  href?: string;
  module?: string;
}

export const notificationService = {
  getAll: () =>
    api.get<Notification[]>('/notifications').then((r) => r.data),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.put('/notifications/read-all').then((r) => r.data),

  send: (dto: { title: string; message: string; type?: string; user_ids?: string[] }) =>
    api.post('/notifications/send', dto).then((r) => r.data),
};

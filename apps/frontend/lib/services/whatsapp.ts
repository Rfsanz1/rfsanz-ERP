import { api } from '../api';

export interface WaSendResult {
  status?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export interface WaLog {
  id: string;
  recipient: string;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: string;
}

export const whatsappService = {
  sendOrderNotification: (orderId: string | number, dto: { namaCustomer: string; nomorTelepon: string; orderId?: string }) =>
    api.post<WaSendResult>(`/sales/orders/${orderId}/whatsapp`, dto).then((r) => r.data),

  sendBulk: (dto: { title: string; message: string; user_ids?: string[] }) =>
    api.post<WaSendResult>('/notifications/send', dto).then((r) => r.data),

  getLogs: () =>
    api.get<WaLog[]>('/notifications').then((r) => r.data),

  markRead: (id: string) =>
    api.put(`/notifications/${id}/read`).then((r) => r.data),
};

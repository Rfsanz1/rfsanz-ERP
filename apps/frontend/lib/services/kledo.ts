import { api } from '../api';

export interface KledoStatus {
  connected: boolean;
  message: string;
}

export interface KledoProduct {
  id: number;
  name: string;
  code: string;
  price: number;
  unit?: string;
  category?: string;
}

export interface KledoContact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
}

export interface KledoInvoice {
  id: number;
  ref_number: string;
  trans_date: string;
  due_date: string;
  amount: number;
  status: string;
  contact?: { name: string };
}

export interface KledoSyncLog {
  id: string;
  type: string;
  status: 'running' | 'success' | 'error';
  message: string;
  createdAt: string;
  response?: any;
}

export interface SpmBrand {
  brand: string;
  pic: string;
}

export const kledoService = {
  getStatus: () =>
    api.get<KledoStatus>('/kledo/status').then((r) => r.data),

  getProducts: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<{ data: KledoProduct[]; total?: number }>('/kledo/products', { params }).then((r) => r.data),

  getContacts: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<{ data: KledoContact[] }>('/kledo/contacts', { params }).then((r) => r.data),

  getInvoices: (params?: { page?: number; per_page?: number }) =>
    api.get<{ data: KledoInvoice[] }>('/kledo/invoices', { params }).then((r) => r.data),

  getSpmBrands: () =>
    api.get<SpmBrand[]>('/kledo/spm-brands').then((r) => r.data),

  syncNow: () =>
    api.post<{ success: boolean; synced: number }>('/kledo/sync').then((r) => r.data),

  autoSync: () =>
    api.post('/kledo/auto-sync').then((r) => r.data),

  getSyncLogs: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: KledoSyncLog[]; total: number }>('/kledo/sync-logs', { params }).then((r) => r.data),
};

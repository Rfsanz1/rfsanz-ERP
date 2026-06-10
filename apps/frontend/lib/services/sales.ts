import { api } from '../api';

export interface SalesOrder {
  id: string;
  order_number: string;
  customer: string;
  amount: number;
  status: 'draft' | 'confirmed' | 'shipped' | 'done' | 'cancelled';
  date: string;
  sales_person?: string;
}

export interface SalesSummary {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  growth_vs_last_month: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  expiry_date: string;
}

export const salesService = {
  getSummary: () =>
    api.get<SalesSummary>('/sales/summary').then((r) => r.data),

  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<{ data: SalesOrder[]; total: number }>('/sales/orders', { params }).then((r) => r.data),

  getOrder: (id: string) =>
    api.get<SalesOrder>(`/sales/orders/${id}`).then((r) => r.data),

  createOrder: (dto: Partial<SalesOrder>) =>
    api.post<SalesOrder>('/sales/orders', dto).then((r) => r.data),

  getQuotations: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: Quotation[]; total: number }>('/sales/quotations', { params }).then((r) => r.data),

  getFaktur: (params?: { page?: number; limit?: number }) =>
    api.get('/sales/faktur', { params }).then((r) => r.data),

  getList: () =>
    api.get('/sales/list').then((r) => r.data),
};

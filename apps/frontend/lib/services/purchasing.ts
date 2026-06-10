import { api } from '../api';

export interface PurchasingStats {
  total_po: number;
  pending_approval: number;
  total_value: number;
  overdue_po: number;
  top_supplier?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier: string;
  total_amount: number;
  status: 'draft' | 'waiting_approval' | 'approved' | 'received' | 'cancelled';
  order_date: string;
  expected_date?: string;
  items?: POItem[];
}

export interface POItem {
  product: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  total_orders?: number;
}

export const purchasingService = {
  getStats: () =>
    api.get<PurchasingStats>('/purchasing/stats').then((r) => r.data),

  getPurchaseOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<{ data: PurchaseOrder[]; total: number }>('/purchasing/purchase-orders', { params }).then((r) => r.data),

  createPurchaseOrder: (dto: Partial<PurchaseOrder>) =>
    api.post<PurchaseOrder>('/purchasing/purchase-orders', dto).then((r) => r.data),

  approvePO: (id: string) =>
    api.post(`/purchasing/purchase-orders/${id}/approve`).then((r) => r.data),

  getSuppliers: (params?: { search?: string }) =>
    api.get<Supplier[]>('/purchasing/suppliers', { params }).then((r) => r.data),
};

import { api } from '../api';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  min_stock: number;
  unit: string;
  price: number;
  warehouse?: string;
  brand?: string;
}

export interface InventoryStats {
  total_products: number;
  low_stock_items: number;
  out_of_stock: number;
  total_value: number;
  movements_today: number;
}

export interface StockMovement {
  id: string;
  product: string;
  type: 'in' | 'out' | 'transfer';
  quantity: number;
  date: string;
  reference: string;
  warehouse_from?: string;
  warehouse_to?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  used: number;
}

export const inventoryService = {
  getStats: () =>
    api.get<InventoryStats>('/inventory/stats').then((r) => r.data),

  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    api.get<{ data: Product[]; total: number }>('/inventory/products', { params }).then((r) => r.data),

  createProduct: (dto: Partial<Product>) =>
    api.post<Product>('/inventory/products', dto).then((r) => r.data),

  updateStock: (id: string, quantity: number, type: 'in' | 'out') =>
    api.post(`/inventory/products/${id}/stok`, { quantity, type }).then((r) => r.data),

  getMovements: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: StockMovement[]; total: number }>('/inventory/stock-movements', { params }).then((r) => r.data),

  getWarehouses: () =>
    api.get<Warehouse[]>('/inventory/warehouses').then((r) => r.data),
};

import { api } from '../api';

export interface MarketplaceOrder {
  id: string;
  platform: 'shopee' | 'tokopedia' | 'lazada' | 'tiktok';
  order_number: string;
  buyer_name: string;
  phone?: string;
  address?: string;
  items: MarketplaceOrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

export interface MarketplaceOrderItem {
  product_name: string;
  sku?: string;
  quantity: number;
  price: number;
}

export interface MarketplaceStats {
  platform: string;
  total_orders: number;
  revenue: number;
  pending: number;
  last_sync: string;
  status: 'connected' | 'error' | 'disconnected';
}

export interface StockSyncResult {
  synced: number;
  failed: number;
  errors?: string[];
}

export const marketplaceService = {
  getShopeeOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ data: MarketplaceOrder[]; total: number }>('/marketplace/shopee/orders', { params }).then((r) => r.data),

  syncShopeeOrders: () =>
    api.post('/marketplace/shopee/sync').then((r) => r.data),

  syncStock: (platform: string) =>
    api.post<StockSyncResult>(`/marketplace/${platform}/sync-stock`).then((r) => r.data),

  getStats: () =>
    api.get<MarketplaceStats[]>('/marketplace/stats').then((r) => r.data),

  syncPrices: (platform: string) =>
    api.post(`/marketplace/${platform}/sync-prices`).then((r) => r.data),
};

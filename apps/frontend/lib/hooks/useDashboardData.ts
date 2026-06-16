'use client';

import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';

export interface DashboardSummary {
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  totalAR: number;
  cashBalance: number;
  lowStockCount: number;
  overdueInvoiceCount: number;
  pendingPOCount: number;
  monthExpense: number;
}

export interface RevenueChartPoint {
  month: string;
  revenue: number;
  expense: number;
}

export interface TopProduct {
  productName: string;
  totalQty: number;
  totalRevenue: number;
}

export interface LowStockAlert {
  productName: string;
  currentStock: number;
  minStock: number;
}

export interface RecentOrder {
  id: string | number;
  namaCustomer: string;
  totalHarga: number;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalRoles: number;
  unreadNotifications: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  revenueChart: RevenueChartPoint[];
  topProducts: TopProduct[];
  lowStock: LowStockAlert[];
  recentOrders: RecentOrder[];
  adminStats: AdminStats;
}

const DEFAULT: DashboardData = {
  summary: {
    todayRevenue: 0, monthRevenue: 0, yearRevenue: 0,
    totalAR: 0, cashBalance: 0, lowStockCount: 0,
    overdueInvoiceCount: 0, pendingPOCount: 0, monthExpense: 0,
  },
  revenueChart: [],
  topProducts: [],
  lowStock: [],
  recentOrders: [],
  adminStats: { totalUsers: 0, totalRoles: 0, unreadNotifications: 0 },
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDemo = useAuthStore((s) => s.isDemo);
  const token = useAuthStore((s) => s.token);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, adminRes, ordersRes] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/dashboard/admin'),
        api.get('/sales/orders?limit=5&page=1'),
      ]);

      const dash = dashRes.status === 'fulfilled' ? dashRes.value.data : null;
      const admin = adminRes.status === 'fulfilled' ? adminRes.value.data : null;
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : null;

      setData({
        summary: dash?.summary ?? DEFAULT.summary,
        revenueChart: dash?.charts?.revenueChart ?? [],
        topProducts: dash?.charts?.topProducts ?? [],
        lowStock: dash?.alerts?.lowStock ?? [],
        recentOrders: Array.isArray(orders?.data?.data) ? orders.data.data : Array.isArray(orders?.data) ? orders.data : [],
        adminStats: {
          totalUsers: admin?.totalUsers ?? 0,
          totalRoles: admin?.totalRoles ?? 0,
          unreadNotifications: admin?.unreadNotifications ?? 0,
        },
      });
    } catch (e: any) {
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    if (token) {
      refresh();
    }
  }, [isDemo, token]);

  return { data, loading, error, refresh };
}

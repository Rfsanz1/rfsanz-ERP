'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  kledoConnected: boolean;
  totalInvoiceCount: number;
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
  kledoConnected: false,
  totalInvoiceCount: 0,
};

/* Konversi status invoice Kledo → label lokal */
const KLEDO_STATUS_MAP: Record<string, string> = {
  paid:    'done',
  partial: 'in_progress',
  open:    'pending',
  draft:   'pending',
  void:    'cancelled',
};

export function useDashboardData() {
  const [data, setData]       = useState<DashboardData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const isDemo = useAuthStore((s) => s.isDemo);
  const token  = useAuthStore((s) => s.token);

  /* Mutable ref untuk update Kledo agar tidak stale-closure */
  const dataRef = useRef<DashboardData>(DEFAULT);

  const applyKledo = useCallback((kledo: any) => {
    if (!kledo) return;
    setData(prev => {
      const kledoInvoicesAsOrders = (kledo.recentInvoices ?? []).map((inv: any) => ({
        id:           `kledo-${inv.id}`,
        namaCustomer: inv.contact ?? '—',
        totalHarga:   inv.amount ?? 0,
        status:       KLEDO_STATUS_MAP[inv.status] ?? 'pending',
        createdAt:    inv.trans_date ?? '',
        ref_number:   inv.ref_number ?? `INV-${inv.id}`,
      }));

      return {
        ...prev,
        summary: {
          ...prev.summary,
          todayRevenue:        kledo.todayRevenue        ?? prev.summary.todayRevenue,
          monthRevenue:        kledo.monthRevenue        ?? prev.summary.monthRevenue,
          yearRevenue:         kledo.yearRevenue         ?? prev.summary.yearRevenue,
          totalAR:             kledo.totalAR             ?? prev.summary.totalAR,
          cashBalance:         kledo.cashBalance         ?? prev.summary.cashBalance,
          monthExpense:        kledo.totalExpense        ?? prev.summary.monthExpense,
          overdueInvoiceCount: kledo.overdueInvoiceCount ?? prev.summary.overdueInvoiceCount,
        },
        revenueChart:     kledo.revenueChart?.length ? kledo.revenueChart : prev.revenueChart,
        recentOrders:     kledoInvoicesAsOrders.length
          ? [...kledoInvoicesAsOrders, ...prev.recentOrders].slice(0, 10)
          : prev.recentOrders,
        kledoConnected:   true,
        totalInvoiceCount: kledo.totalInvoiceCount ?? prev.totalInvoiceCount,
      };
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      /* ── Fase 1: data backend lokal (cepat) ─────────────────────────── */
      const [dashRes, adminRes, ordersRes] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/dashboard/admin'),
        api.get('/sales/orders?limit=5&page=1'),
      ]);

      const dash   = dashRes.status   === 'fulfilled' ? dashRes.value.data   : null;
      const admin  = adminRes.status  === 'fulfilled' ? adminRes.value.data  : null;
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : null;

      const localSummary: DashboardSummary = dash?.summary ?? DEFAULT.summary;
      const localOrders: RecentOrder[] = Array.isArray(orders?.data?.data)
        ? orders.data.data
        : Array.isArray(orders?.data) ? orders.data : [];

      setData({
        summary:       localSummary,
        revenueChart:  dash?.charts?.revenueChart ?? [],
        topProducts:   dash?.charts?.topProducts  ?? [],
        lowStock:      dash?.alerts?.lowStock     ?? [],
        recentOrders:  localOrders,
        adminStats: {
          totalUsers:          admin?.totalUsers          ?? 0,
          totalRoles:          admin?.totalRoles          ?? 0,
          unreadNotifications: admin?.unreadNotifications ?? 0,
        },
        kledoConnected:    false,
        totalInvoiceCount: 0,
      });
    } catch (e: any) {
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }

    /* ── Fase 2: data Kledo (di background, tidak blokir UI) ─────────── */
    try {
      const kledoRes = await fetch('/api/direct/kledo-dashboard');
      if (kledoRes.ok) {
        const kledoJson = await kledoRes.json();
        if (kledoJson?.success && kledoJson?.data) {
          applyKledo(kledoJson.data);
        }
      }
    } catch {
      /* Kledo tidak tersambung — UI tetap menampilkan data lokal */
    }
  }, [applyKledo]);

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    if (token) { refresh(); }
  }, [isDemo, token]);

  return { data, loading, error, refresh };
}

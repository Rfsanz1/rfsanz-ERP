import { api } from '../api';

export interface DashboardSummary {
  revenue_today: number;
  total_orders: number;
  invoice_outstanding: number;
  active_customers: number;
  low_stock_count: number;
  pending_po: number;
  revenue_growth: number;
  order_growth: number;
  recent_orders: RecentOrder[];
  alerts: DashboardAlert[];
  monthly_revenue: MonthlyData[];
}

export interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

export interface DashboardAlert {
  message: string;
  type: 'danger' | 'warning' | 'info';
  href: string;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

export const dashboardService = {
  getSummary: () =>
    api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};

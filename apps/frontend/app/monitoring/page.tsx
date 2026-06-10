'use client';

import { useEffect, useState, useCallback } from 'react';
import { OdooLayout } from '../../components/layout/OdooLayout';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import api from '../../lib/api';
import {
  ShoppingCart, Package, Truck, Monitor, RefreshCw,
  ExternalLink, Wifi, WifiOff, AlertTriangle, Clock,
} from 'lucide-react';

const C = {
  primary: '#5B52D1', border: '#EDE9FE', pageBg: '#F5F3FF',
  textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF',
};

const APP_LIST = [
  { key: 'sales',  label: 'Sales App',   url: 'http://localhost:3002', color: '#0891B2', icon: ShoppingCart },
  { key: 'gudang', label: 'Gudang App',  url: 'http://localhost:3003', color: '#D97706', icon: Package },
  { key: 'pos',    label: 'POS App',     url: 'http://localhost:3004', color: '#E64A19', icon: Monitor },
  { key: 'driver', label: 'Driver App',  url: 'http://localhost:3005', color: '#1D4ED8', icon: Truck },
];

const TABS = ['Sales', 'Gudang', 'POS', 'Driver'] as const;
type Tab = typeof TABS[number];

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}>
      {label}
    </span>
  );
}

function AppStatusCard({ app, status }: { app: typeof APP_LIST[0]; status: 'online' | 'offline' | 'checking' }) {
  const Icon = app.icon;
  const isOnline = status === 'online';
  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-4"
      style={{ border: `1.5px solid ${isOnline ? `${app.color}30` : '#EDE9FE'}` }}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
        style={{ backgroundColor: `${app.color}15` }}>
        <Icon className="h-5 w-5" style={{ color: app.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: C.textDark }}>{app.label}</p>
        <p className="text-xs truncate" style={{ color: C.textLight }}>{app.url}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {status === 'checking' ? (
          <span className="text-xs" style={{ color: C.textLight }}>Checking…</span>
        ) : isOnline ? (
          <><Wifi className="h-4 w-4 text-green-500" /><span className="text-xs font-medium text-green-600">Online</span></>
        ) : (
          <><WifiOff className="h-4 w-4 text-red-400" /><span className="text-xs font-medium text-red-500">Offline</span></>
        )}
      </div>
      <a href={app.url} target="_blank" rel="noreferrer"
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: app.color }}
        title={`Buka ${app.label}`}>
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

export default function MonitoringOverview() {
  const [stats, setStats] = useState({ salesOrders: 0, posTransactions: 0, lowStock: 0, onProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Sales');
  const [appStatus, setAppStatus] = useState<Record<string, 'online' | 'offline' | 'checking'>>({
    sales: 'checking', gudang: 'checking', pos: 'checking', driver: 'checking',
  });
  const [tableData, setTableData] = useState<{
    sales: any[]; gudang: any[]; pos: any[]; driver: any[];
  }>({ sales: [], gudang: [], pos: [], driver: [] });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, posRes, stockRes, deliveryRes] = await Promise.allSettled([
        api.get('/sales/orders?today=true&limit=10'),
        api.get('/pos/orders?today=true&limit=10'),
        api.get('/inventory/products?lowStock=true&limit=10'),
        api.get('/delivery?status=on_progress&limit=10'),
      ]);

      const salesOrders = salesRes.status === 'fulfilled' ? (salesRes.value.data?.total ?? salesRes.value.data?.length ?? salesRes.value.data?.data?.length ?? 0) : 0;
      const posTransactions = posRes.status === 'fulfilled' ? (posRes.value.data?.total ?? posRes.value.data?.length ?? posRes.value.data?.data?.length ?? 0) : 0;
      const lowStock = stockRes.status === 'fulfilled' ? (stockRes.value.data?.total ?? stockRes.value.data?.length ?? stockRes.value.data?.data?.length ?? 0) : 0;
      const onProgress = deliveryRes.status === 'fulfilled' ? (deliveryRes.value.data?.total ?? deliveryRes.value.data?.length ?? deliveryRes.value.data?.data?.length ?? 0) : 0;

      const salesList = salesRes.status === 'fulfilled' ? (salesRes.value.data?.data ?? salesRes.value.data?.items ?? salesRes.value.data ?? []).slice(0, 10) : [];
      const gudangList = stockRes.status === 'fulfilled' ? (stockRes.value.data?.data ?? stockRes.value.data?.items ?? stockRes.value.data ?? []).slice(0, 10) : [];
      const posList = posRes.status === 'fulfilled' ? (posRes.value.data?.data ?? posRes.value.data?.items ?? posRes.value.data ?? []).slice(0, 10) : [];
      const driverList = deliveryRes.status === 'fulfilled' ? (deliveryRes.value.data?.data ?? deliveryRes.value.data?.items ?? deliveryRes.value.data ?? []).slice(0, 10) : [];

      setStats({ salesOrders, posTransactions, lowStock, onProgress });
      setTableData({ sales: Array.isArray(salesList) ? salesList : [], gudang: Array.isArray(gudangList) ? gudangList : [], pos: Array.isArray(posList) ? posList : [], driver: Array.isArray(driverList) ? driverList : [] });
    } catch {
      /* keep existing */
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  const pingApps = useCallback(async () => {
    setAppStatus({ sales: 'checking', gudang: 'checking', pos: 'checking', driver: 'checking' });
    const results: Record<string, 'online' | 'offline'> = {};
    await Promise.all(APP_LIST.map(async (app) => {
      try {
        await fetch(app.url, { method: 'GET', mode: 'no-cors', signal: AbortSignal.timeout(3000) });
        results[app.key] = 'online';
      } catch {
        results[app.key] = 'offline';
      }
    }));
    setAppStatus(results as any);
  }, []);

  useEffect(() => {
    fetchStats();
    pingApps();
    const interval = setInterval(() => { fetchStats(); pingApps(); }, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats, pingApps]);

  const STAT_CARDS = [
    { label: 'Order Sales Hari Ini',   value: loading ? '…' : stats.salesOrders,    icon: ShoppingCart, iconColor: '#0891B2' },
    { label: 'Transaksi POS Hari Ini', value: loading ? '…' : stats.posTransactions, icon: Monitor,      iconColor: '#E64A19' },
    { label: 'Stok Kritis',            value: loading ? '…' : stats.lowStock,        icon: AlertTriangle, iconColor: '#F59E0B' },
    { label: 'Pengiriman On-Progress', value: loading ? '…' : stats.onProgress,      icon: Truck,        iconColor: '#1D4ED8' },
  ];

  const renderTable = () => {
    if (activeTab === 'Sales') {
      const rows = tableData.sales;
      if (!rows.length) return <EmptyState label="Belum ada data order sales" />;
      return (
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
            {['No. Order','Pelanggan','Status','Total','Tanggal'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.number ?? r.orderNumber ?? r.code ?? `ORD-${i+1}`}</td>
                <td className="px-4 py-3" style={{ color: C.textMid }}>{r.customer?.name ?? r.customerName ?? r.customer ?? '–'}</td>
                <td className="px-4 py-3"><Badge label={r.status ?? 'Draft'} color={r.status === 'done' ? '#22C55E' : r.status === 'cancel' ? '#EF4444' : '#8B5CF6'} /></td>
                <td className="px-4 py-3 font-semibold" style={{ color: C.textDark }}>{r.totalAmount != null ? `Rp ${Number(r.totalAmount).toLocaleString('id')}` : '–'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('id') : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'Gudang') {
      const rows = tableData.gudang;
      if (!rows.length) return <EmptyState label="Belum ada data mutasi stok" />;
      return (
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
            {['Produk','Stok','Satuan','Gudang','Status'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.name ?? r.productName ?? `Produk ${i+1}`}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: (r.stock ?? r.currentStock ?? 0) <= (r.minStock ?? 5) ? '#EF4444' : C.textDark }}>{r.stock ?? r.currentStock ?? 0}</td>
                <td className="px-4 py-3" style={{ color: C.textMid }}>{r.unit?.name ?? r.unitName ?? 'pcs'}</td>
                <td className="px-4 py-3" style={{ color: C.textMid }}>{r.warehouse?.name ?? r.warehouseName ?? '–'}</td>
                <td className="px-4 py-3"><Badge label={(r.stock ?? 0) <= (r.minStock ?? 5) ? 'Kritis' : 'Normal'} color={(r.stock ?? 0) <= (r.minStock ?? 5) ? '#EF4444' : '#22C55E'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'POS') {
      const rows = tableData.pos;
      if (!rows.length) return <EmptyState label="Belum ada transaksi POS hari ini" />;
      return (
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
            {['No. Transaksi','Kasir','Jumlah Item','Total','Waktu'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.number ?? r.receiptNumber ?? r.code ?? `TRX-${i+1}`}</td>
                <td className="px-4 py-3" style={{ color: C.textMid }}>{r.cashier?.name ?? r.cashierName ?? r.user?.name ?? '–'}</td>
                <td className="px-4 py-3" style={{ color: C.textMid }}>{r.itemCount ?? r.items?.length ?? 0}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: C.textDark }}>{r.totalAmount != null ? `Rp ${Number(r.totalAmount).toLocaleString('id')}` : '–'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{r.createdAt ? new Date(r.createdAt).toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' }) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    const rows = tableData.driver;
    if (!rows.length) return <EmptyState label="Belum ada data pengiriman" />;
    return (
      <table className="w-full text-sm">
        <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
          {['No. Pengiriman','Driver','Pelanggan','Status','Tanggal'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.number ?? r.deliveryNumber ?? r.code ?? `DEL-${i+1}`}</td>
              <td className="px-4 py-3" style={{ color: C.textMid }}>{r.driver?.name ?? r.driverName ?? '–'}</td>
              <td className="px-4 py-3" style={{ color: C.textMid }}>{r.customer?.name ?? r.customerName ?? '–'}</td>
              <td className="px-4 py-3"><Badge label={r.status ?? 'pending'} color={r.status === 'done' ? '#22C55E' : r.status === 'on_progress' ? '#3B82F6' : '#F59E0B'} /></td>
              <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('id') : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <OdooLayout title="Command Center" subtitle="Monitoring semua aplikasi ERP">
      <PageHeader
        title="Command Center"
        subtitle="Pantau semua aktivitas app secara real-time"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: C.textLight }}>
              <Clock className="h-3 w-3 inline mr-1" />
              {lastRefresh.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button onClick={() => { fetchStats(); pingApps(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'rgba(91,82,209,.1)', color: C.primary }}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        }
      />

      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} iconColor={s.iconColor} />
        ))}
      </div>

      {/* Row 2 — Tab Tables */}
      <div className="bg-white rounded-2xl mb-6" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="flex items-center gap-0 px-4 pt-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors mr-1"
              style={{
                color: activeTab === tab ? C.primary : C.textMid,
                backgroundColor: activeTab === tab ? 'rgba(91,82,209,.08)' : 'transparent',
                borderBottom: activeTab === tab ? `2px solid ${C.primary}` : '2px solid transparent',
              }}>
              {tab}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-transparent" style={{ borderTopColor: C.primary }} />
            </div>
          ) : renderTable()}
        </div>
      </div>

      {/* Row 3 — App Status */}
      <div className="bg-white rounded-2xl p-5" style={{ border: `1.5px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: C.textDark }}>Status Aplikasi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {APP_LIST.map((app) => (
            <AppStatusCard key={app.key} app={app} status={appStatus[app.key] ?? 'checking'} />
          ))}
        </div>
      </div>
    </OdooLayout>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <AlertTriangle className="h-8 w-8" style={{ color: '#D1C4E9' }} />
      <p className="text-sm" style={{ color: '#9CA3AF' }}>{label}</p>
    </div>
  );
}

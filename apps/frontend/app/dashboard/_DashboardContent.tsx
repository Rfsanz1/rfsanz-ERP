'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign,
  Users, FileText, AlertTriangle, CheckCircle, Clock, BarChart2,
  RefreshCw, Truck, Target, MoreHorizontal, ChevronRight, Wallet,
} from 'lucide-react';
import CreateOrderModal from '../../components/orders/CreateOrderModal';
import { useDashboardData } from '../../lib/hooks/useDashboardData';

function formatRp(n: number): string {
  if (!n || isNaN(n)) return 'Rp 0';
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(2)} Jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  confirmed:   { color: '#3B82F6', bg: '#EFF6FF',  label: 'Dikonfirmasi' },
  in_progress: { color: '#F59E0B', bg: '#FFFBEB',  label: 'Diproses' },
  done:        { color: '#10B981', bg: '#ECFDF5',  label: 'Selesai' },
  cancelled:   { color: '#EA5455', bg: '#FFF5F5',  label: 'Dibatalkan' },
  pending:     { color: '#94A3B8', bg: '#F8FAFC',  label: 'Pending' },
};

function getStatusStyle(s: string) {
  return STATUS_STYLE[s?.toLowerCase()] ?? STATUS_STYLE.pending;
}

function Skeleton({ w = 'w-full', h = 'h-4', rounded = 'rounded' }: { w?: string; h?: string; rounded?: string }) {
  return <div className={`${w} ${h} ${rounded} animate-pulse`} style={{ backgroundColor: '#F1F5F9' }} />;
}

function MiniBarChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data.length) return <div className="h-20 flex items-center justify-center text-xs text-slate-400">Belum ada data</div>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${Math.max((d.revenue / max) * 100, 4)}%`,
              backgroundColor: i === data.length - 1 ? '#3B82F6' : '#BFDBFE',
              minHeight: '4px',
            }}
          />
          <span className="text-[9px] text-slate-400 hidden sm:block">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Buat Order',        href: '/sales/orders',              icon: FileText,  color: '#3B82F6', bg: '#EFF6FF', modal: true },
  { label: 'Transfer Stok',     href: '/inventory/transfers',       icon: Package,   color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Purchase Order',    href: '/purchasing/purchase-orders', icon: Truck,    color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Lap. Penjualan',    href: '/reports/sales',             icon: BarChart2, color: '#6366F1', bg: '#EEF2FF' },
  { label: 'CRM Pipeline',      href: '/crm/pipeline',              icon: Target,    color: '#14B8A6', bg: '#F0FDFA' },
  { label: 'Karyawan',          href: '/hr',                        icon: Users,     color: '#10B981', bg: '#ECFDF5' },
];

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('month');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const { data, loading, refresh } = useDashboardData();

  const { summary, revenueChart, topProducts, lowStock, recentOrders, adminStats } = data;

  const tabRevenue = activeTab === 'today' ? summary.todayRevenue
    : activeTab === 'month' ? summary.monthRevenue
    : summary.monthRevenue;

  const KPI_CARDS = [
    {
      title:  activeTab === 'today' ? 'Penjualan Hari Ini' : 'Total Penjualan Bulan Ini',
      value:  formatRp(tabRevenue),
      sub:    `Tahun ini: ${formatRp(summary.yearRevenue)}`,
      trend:  'up' as const,
      icon:   DollarSign,
      color:  '#3B82F6',
      bg:     '#EFF6FF',
    },
    {
      title:  'Total Orders',
      value:  recentOrders.length > 0 ? `${recentOrders.length}+` : '—',
      sub:    `${summary.pendingPOCount} PO pending`,
      trend:  'up' as const,
      icon:   ShoppingCart,
      color:  '#8B5CF6',
      bg:     '#F5F3FF',
    },
    {
      title:  'Total Pengguna',
      value:  adminStats.totalUsers > 0 ? String(adminStats.totalUsers) : '—',
      sub:    `${adminStats.totalRoles} role · ${adminStats.unreadNotifications} notif`,
      trend:  'up' as const,
      icon:   Users,
      color:  '#10B981',
      bg:     '#ECFDF5',
    },
    {
      title:  'Invoice Belum Bayar',
      value:  String(summary.overdueInvoiceCount || 0),
      sub:    `AR: ${formatRp(summary.totalAR)}`,
      trend:  summary.overdueInvoiceCount > 0 ? 'down' as const : 'up' as const,
      icon:   FileText,
      color:  '#F59E0B',
      bg:     '#FFFBEB',
    },
  ];

  return (
    <>
    <div className="space-y-4 max-w-[1400px]">

      {/* Page header — stacks on mobile */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Ringkasan bisnis Anda secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border overflow-hidden text-xs font-medium" style={{ borderColor: '#E2E8F0' }}>
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-3 py-2 sm:py-1.5 transition-colors"
                style={{
                  backgroundColor: activeTab === t ? '#3B82F6' : '#FFFFFF',
                  color: activeTab === t ? '#FFFFFF' : '#64748B',
                  minWidth: 60,
                }}
              >
                {t === 'today' ? 'Hari Ini' : t === 'week' ? 'Minggu' : 'Bulan'}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-slate-50 disabled:opacity-50"
            style={{ borderColor: '#E2E8F0', color: '#64748B' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Aksi Cepat */}
      <div className="rounded-xl border p-3 sm:p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 sm:mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const cls = "flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl border transition-all active:scale-95 w-full";
            if (action.modal) {
              return (
                <button
                  key={action.label}
                  onClick={() => setShowCreateOrder(true)}
                  className={cls}
                  style={{ borderColor: '#E2E8F0' }}
                >
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: action.bg }}>
                    <Icon className="h-4 w-4" style={{ color: action.color }} />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 text-center leading-tight">{action.label}</span>
                </button>
              );
            }
            return (
              <Link key={action.label} href={action.href}
                className={cls}
                style={{ borderColor: '#E2E8F0' }}
              >
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: action.bg }}>
                  <Icon className="h-4 w-4" style={{ color: action.color }} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 text-center leading-tight">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPI Cards — 1 col xs, 2 col sm, 4 col xl */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-xl p-4 sm:p-5 border flex flex-col gap-3 sm:gap-4"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: card.color }} />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: card.trend === 'up' ? '#10B981' : '#EA5455' }}>
                  {card.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                </span>
              </div>
              <div>
                {loading
                  ? <><Skeleton w="w-24" h="h-6 sm:h-7" rounded="rounded-lg" /><Skeleton w="w-32" h="h-3" rounded="rounded" /></>
                  : <>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800 break-all">{card.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                  </>
                }
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue chart + Cash balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 rounded-xl border p-4 sm:p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Tren Pendapatan</h2>
              <p className="text-xs text-slate-400">12 bulan terakhir</p>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          {loading
            ? <Skeleton h="h-20" rounded="rounded-lg" />
            : <MiniBarChart data={revenueChart.slice(-12).map(d => ({ month: d.month?.slice(0,3) ?? '', revenue: d.revenue }))} />
          }
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#F1F5F9' }}>
            {[
              { label: 'Bulan ini',               value: formatRp(summary.monthRevenue) },
              { label: 'Tahun ini',                value: formatRp(summary.yearRevenue) },
              { label: 'Pengeluaran bulan ini',    value: formatRp(summary.monthExpense) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                {loading ? <Skeleton w="w-full" h="h-5" rounded="rounded" /> : <p className="text-sm sm:text-lg font-bold text-slate-800 break-all">{value}</p>}
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Saldo & stats */}
        <div className="rounded-xl border p-4 sm:p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Kas & Bank</h2>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-xl p-3 sm:p-4" style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              <p className="text-xs text-blue-100 mb-1">Total Saldo</p>
              {loading
                ? <Skeleton w="w-32" h="h-7" rounded="rounded-lg" />
                : <p className="text-xl sm:text-2xl font-bold text-white break-all">{formatRp(summary.cashBalance)}</p>
              }
            </div>
            {[
              { label: 'Piutang (AR)',        value: formatRp(summary.totalAR),           color: '#F59E0B' },
              { label: 'Invoice Jatuh Tempo', value: String(summary.overdueInvoiceCount), color: '#EA5455' },
              { label: 'Stok Menipis',        value: String(summary.lowStockCount),       color: '#F59E0B' },
              { label: 'Pengguna Aktif',      value: String(adminStats.totalUsers),       color: '#10B981' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-slate-500">{item.label}</span>
                {loading
                  ? <Skeleton w="w-16" h="h-4" rounded="rounded" />
                  : <span className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b" style={{ borderColor: '#F1F5F9' }}>
            <h2 className="text-sm font-semibold text-slate-700">Sales Order Terbaru</h2>
            <Link href="/sales/orders" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#3B82F6' }}>
              Lihat semua <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 sm:px-5 py-3" style={{ borderBottom: i < 3 ? '1px solid #F8FAFC' : 'none' }}>
                  <div className="flex-1 space-y-2"><Skeleton w="w-32" /><Skeleton w="w-24" h="h-3" /></div>
                  <div className="space-y-2 text-right"><Skeleton w="w-20" /><Skeleton w="w-16" h="h-3" /></div>
                </div>
              ))
              : recentOrders.length === 0
                ? <div className="px-5 py-8 text-center text-sm text-slate-400">Belum ada order</div>
                : recentOrders.map((order, i) => {
                  const s = getStatusStyle(order.status);
                  return (
                    <div key={order.id}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 active:bg-slate-50 hover:bg-slate-50 transition-colors"
                      style={{ borderBottom: i < recentOrders.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-700">#{order.id}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{order.namaCustomer}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-slate-700">{formatRp(Number(order.totalHarga))}</p>
                        <p className="text-[11px] text-slate-400">{formatRelative(order.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Low stock alerts */}
          <div className="rounded-xl border p-4 sm:p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Stok Menipis</h2>
              <AlertTriangle className="h-4 w-4" style={{ color: '#F59E0B' }} />
            </div>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <Skeleton w="w-8" h="h-8" rounded="rounded-lg" />
                  <div className="flex-1 space-y-1"><Skeleton /><Skeleton w="w-24" h="h-3" /></div>
                </div>
              ))
              : lowStock.length === 0
                ? <p className="text-xs text-slate-400 text-center py-4">Semua stok aman ✓</p>
                : lowStock.slice(0, 4).map((item) => (
                  <div key={item.productName} className="flex items-center gap-3 mb-3 last:mb-0">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#FFFBEB' }}>
                      <Package className="h-4 w-4" style={{ color: '#F59E0B' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-400">
                        Sisa: <span className="font-semibold text-red-500">{item.currentStock}</span> / min {item.minStock}
                      </p>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Activity summary */}
          <div className="rounded-xl border p-4 sm:p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Hari Ini</h2>
            <div className="space-y-2.5">
              {[
                { icon: CheckCircle, label: 'Revenue hari ini',   value: loading ? '…' : formatRp(summary.todayRevenue),          color: '#10B981', bg: '#ECFDF5' },
                { icon: Clock,       label: 'Invoice jatuh tempo', value: loading ? '…' : String(summary.overdueInvoiceCount),     color: '#F59E0B', bg: '#FFFBEB' },
                { icon: Truck,       label: 'PO pending',          value: loading ? '…' : String(summary.pendingPOCount),          color: '#3B82F6', bg: '#EFF6FF' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: item.bg }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                    </div>
                    <span className="flex-1 text-xs text-slate-600">{item.label}</span>
                    <span className="text-sm font-bold text-slate-700">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl border p-4 sm:p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Produk Terlaris</h2>
          <Link href="/reports/sales" className="text-xs font-medium" style={{ color: '#3B82F6' }}>Lihat semua</Link>
        </div>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <Skeleton w="w-5" h="h-4" rounded="rounded" />
              <div className="flex-1 space-y-1"><Skeleton /><Skeleton h="h-1.5" rounded="rounded-full" /></div>
              <Skeleton w="w-16" h="h-4" rounded="rounded" />
            </div>
          ))
          : topProducts.length === 0
            ? <p className="text-sm text-slate-400 text-center py-4">Belum ada data penjualan</p>
            : (() => {
              const maxRev = Math.max(...topProducts.map(p => p.totalRevenue), 1);
              return topProducts.slice(0, 7).map((product, i) => (
                <div key={product.productName} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-xs font-bold w-5 text-slate-400 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{product.productName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(product.totalRevenue / maxRev) * 100}%`, backgroundColor: '#3B82F6' }} />
                      </div>
                      <span className="text-[10px] text-slate-400 w-16 sm:w-20 text-right flex-shrink-0">{product.totalQty} terjual</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 flex-shrink-0 w-16 sm:w-20 text-right">{formatRp(product.totalRevenue)}</span>
                </div>
              ));
            })()
        }
      </div>

    </div>

    {showCreateOrder && (
      <CreateOrderModal
        onClose={() => setShowCreateOrder(false)}
        onSuccess={() => { setShowCreateOrder(false); refresh(); }}
      />
    )}
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign,
  Users, FileText, AlertTriangle, CheckCircle, Clock, BarChart2,
  RefreshCw, Truck, Target, ChevronRight, Wallet, ArrowUpRight,
} from 'lucide-react';
import CreateOrderModal from '../../components/orders/CreateOrderModal';
import { useDashboardData } from '../../lib/hooks/useDashboardData';

/* ── Formatters ────────────────────────────────────────────────────── */
function formatRp(n: number): string {
  if (!n || isNaN(n)) return 'Rp 0';
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
}

/* ── Status pills ──────────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:   { label: 'Dikonfirmasi',    color: '#3B82F6', bg: 'rgba(59,130,246,0.10)'  },
  in_progress: { label: 'Diproses',        color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  done:        { label: 'Selesai',          color: '#10B981', bg: 'rgba(16,185,129,0.10)'  },
  cancelled:   { label: 'Dibatalkan',      color: '#EF4444', bg: 'rgba(239,68,68,0.10)'   },
  pending:     { label: 'Pending',          color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' },
  lunas:       { label: 'Lunas',            color: '#10B981', bg: 'rgba(16,185,129,0.10)'  },
  sebagian:    { label: 'Dibayar Sebagian', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)'  },
  belum_bayar: { label: 'Belum Bayar',      color: '#EF4444', bg: 'rgba(239,68,68,0.10)'   },
  dibatalkan:  { label: 'Dibatalkan',       color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' },
};
const getStatus = (s: string) => STATUS_MAP[s?.toLowerCase()] ?? STATUS_MAP.belum_bayar;

/* ── Skeleton ──────────────────────────────────────────────────────── */
function Skel({ w = '100%', h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: w, height: h, borderRadius: r,
        background: 'var(--border)',
      }}
    />
  );
}

/* ── Mini bar chart ────────────────────────────────────────────────── */
function BarChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data.length) {
    return (
      <div className="h-24 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Belum ada data
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 96 }}>
      {data.map((d, i) => {
        const pct = Math.max((d.revenue / max) * 100, 3);
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              style={{
                width: '100%',
                height: `${pct}%`,
                borderRadius: '4px 4px 2px 2px',
                background: isLast
                  ? 'linear-gradient(180deg, #818CF8 0%, #6366F1 100%)'
                  : 'var(--border-strong)',
                minHeight: 3,
                transition: 'height 0.4s ease',
              }}
            />
            <span
              className="hidden sm:block"
              style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}
            >
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Quick actions ─────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Buat Order',      href: '/sales/orders',               icon: FileText,  color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  modal: true },
  { label: 'Transfer Stok',   href: '/inventory/transfers',        icon: Package,   color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  { label: 'Purchase Order',  href: '/purchasing/purchase-orders', icon: Truck,     color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  { label: 'Lap. Penjualan',  href: '/reports/sales',              icon: BarChart2, color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
  { label: 'CRM Pipeline',    href: '/crm/pipeline',               icon: Target,    color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  { label: 'Karyawan',        href: '/hr',                         icon: Users,     color: '#EC4899', bg: 'rgba(236,72,153,0.10)' },
];

/* ═══════════════════════════════════════════════════════════════════ */
export default function DashboardContent() {
  const [tab, setTab] = useState<'today' | 'week' | 'month'>('month');
  const [showOrder, setShowOrder] = useState(false);
  const { data, loading, refresh } = useDashboardData();
  const { summary, revenueChart, topProducts, lowStock, recentOrders, adminStats, kledoConnected, totalInvoiceCount } = data;

  const revenue =
    tab === 'today' ? summary.todayRevenue :
    tab === 'week'  ? summary.weekRevenue  :
    summary.monthRevenue;

  const revenueTitle =
    tab === 'today' ? 'Penjualan Hari Ini' :
    tab === 'week'  ? 'Penjualan Minggu Ini' :
    'Penjualan Bulan Ini';

  const revenueSub =
    tab === 'today' ? `Minggu ini: ${formatRp(summary.weekRevenue)}` :
    tab === 'week'  ? `Bulan ini: ${formatRp(summary.monthRevenue)}` :
    `Tahun ini: ${formatRp(summary.yearRevenue)}`;

  const KPI = [
    {
      title:  revenueTitle,
      value:  formatRp(revenue),
      sub:    revenueSub,
      up:     true,
      icon:   DollarSign,
      accent: '#6366F1',
      light:  'rgba(99,102,241,0.10)',
    },
    {
      title:  kledoConnected ? 'Total Invoice Kledo' : 'Total Orders',
      value:  kledoConnected
        ? (totalInvoiceCount > 0 ? String(totalInvoiceCount) : '—')
        : (recentOrders.length > 0 ? `${recentOrders.length}+` : '—'),
      sub:    kledoConnected
        ? `${summary.pendingPOCount || 0} belum lunas`
        : `${summary.pendingPOCount} PO menunggu`,
      up:     true,
      icon:   ShoppingCart,
      accent: '#8B5CF6',
      light:  'rgba(139,92,246,0.10)',
    },
    {
      title:  'Total Pengguna',
      value:  adminStats.totalUsers > 0 ? String(adminStats.totalUsers) : '—',
      sub:    `${adminStats.totalRoles} role · ${adminStats.unreadNotifications} notif`,
      up:     true,
      icon:   Users,
      accent: '#10B981',
      light:  'rgba(16,185,129,0.10)',
    },
    {
      title:  'Invoice Belum Bayar',
      value:  String(summary.overdueInvoiceCount || 0),
      sub:    `AR: ${formatRp(summary.totalAR)}`,
      up:     summary.overdueInvoiceCount === 0,
      icon:   FileText,
      accent: summary.overdueInvoiceCount > 0 ? '#EF4444' : '#F59E0B',
      light:  summary.overdueInvoiceCount > 0 ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
    },
  ];

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <>
    <div style={{ maxWidth: 1400 }} className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Dashboard
            </h1>
            {kledoConnected && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px',
                borderRadius: 100, background: 'rgba(16,185,129,0.12)',
                color: '#10B981', letterSpacing: '0.04em',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                ● KLEDO
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
            {kledoConnected ? 'Data real-time dari Kledo Accounting' : 'Ringkasan bisnis Anda secara real-time'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab switcher */}
          <div
            className="flex"
            style={{
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 3,
              gap: 2,
            }}
          >
            {(['today', 'week', 'month'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: tab === t ? 'var(--surface)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {t === 'today' ? 'Hari Ini' : t === 'week' ? 'Minggu' : 'Bulan'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {KPI.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.title}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '18px 20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: k.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: k.accent }} strokeWidth={2} />
                </div>
                <span
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontSize: 11, fontWeight: 600,
                    color: k.up ? '#10B981' : '#EF4444',
                  }}
                >
                  {k.up
                    ? <TrendingUp size={13} strokeWidth={2.5} />
                    : <TrendingDown size={13} strokeWidth={2.5} />}
                </span>
              </div>

              <div>
                {loading ? (
                  <div className="space-y-2">
                    <Skel w="70%" h={26} r={8} />
                    <Skel w="90%" h={12} r={6} />
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                      {k.value}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '5px 0 0', lineHeight: 1.4 }}>
                      {k.sub}
                    </p>
                  </>
                )}
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.3 }}>
                  {k.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Aksi Cepat
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Pintasan menu yang sering digunakan</p>
          </div>
          <ArrowUpRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            const base: React.CSSProperties = {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '20px 12px 18px',
              borderRadius: 14,
              border: '1.5px solid var(--border)',
              background: 'var(--surface-sunken)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              width: '100%',
              textDecoration: 'none',
            };
            const inner = (
              <>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: a.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${a.color}22`,
                  flexShrink: 0,
                }}>
                  <Icon size={24} style={{ color: a.color }} strokeWidth={1.8} />
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  lineHeight: 1.35,
                  letterSpacing: '-0.01em',
                }}>
                  {a.label}
                </span>
              </>
            );
            if (a.modal) return (
              <button
                key={a.label}
                onClick={() => setShowOrder(true)}
                style={base}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = a.color;
                  (e.currentTarget as HTMLElement).style.background = a.bg;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${a.color}22`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {inner}
              </button>
            );
            return (
              <Link
                key={a.label}
                href={a.href}
                style={base}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = a.color;
                  (e.currentTarget as HTMLElement).style.background = a.bg;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${a.color}22`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Revenue + Kas ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Revenue chart */}
        <div
          className="lg:col-span-2"
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Tren Pendapatan
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>12 bulan terakhir</p>
            </div>
            <div
              style={{
                fontSize: 11, fontWeight: 700, color: '#6366F1',
                background: 'rgba(99,102,241,0.10)', borderRadius: 8,
                padding: '4px 10px',
              }}
            >
              Live
            </div>
          </div>

          {loading
            ? <Skel h={96} r={10} />
            : <BarChart data={revenueChart.slice(-12).map(d => ({ month: d.month?.slice(0, 3) ?? '', revenue: d.revenue }))} />
          }

          <div
            className="grid grid-cols-3 gap-3 mt-5 pt-5"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {[
              { label: 'Bulan ini',            val: formatRp(summary.monthRevenue),  accent: '#6366F1' },
              { label: 'Tahun ini',             val: formatRp(summary.yearRevenue),   accent: '#10B981' },
              { label: 'Pengeluaran',           val: formatRp(summary.monthExpense),  accent: '#F59E0B' },
            ].map(({ label, val, accent }) => (
              <div key={label} className="text-center">
                {loading
                  ? <Skel w="80%" h={20} r={6} />
                  : <p style={{ fontSize: 15, fontWeight: 800, color: accent, margin: 0, letterSpacing: '-0.01em' }}>{val}</p>}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.3 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Kas & Bank */}
        <div
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Kas & Bank
            </p>
            <Wallet size={16} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Saldo utama */}
          <div
            style={{
              borderRadius: 14,
              padding: '16px 18px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 6px', fontWeight: 500 }}>
              Total Saldo
            </p>
            {loading
              ? <Skel w="60%" h={28} r={8} />
              : <p style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                  {formatRp(summary.cashBalance)}
                </p>
            }
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {[
              { label: 'Piutang (AR)',        val: formatRp(summary.totalAR),           color: '#F59E0B' },
              { label: 'Invoice Jatuh Tempo', val: String(summary.overdueInvoiceCount), color: '#EF4444' },
              { label: 'Stok Menipis',        val: String(summary.lowStockCount),       color: '#F59E0B' },
              { label: 'Pengguna Aktif',      val: String(adminStats.totalUsers),       color: '#10B981' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                {loading
                  ? <Skel w={48} h={14} r={6} />
                  : <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Orders + Stock + Summary ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Recent orders */}
        <div
          className="lg:col-span-2"
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                {kledoConnected ? 'Invoice Terbaru' : 'Sales Order Terbaru'}
              </p>
              {kledoConnected && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100,
                  background: 'rgba(16,185,129,0.12)', color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>Kledo</span>
              )}
            </div>
            <Link
              href={kledoConnected ? '/invoice/list' : '/sales/orders'}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, color: '#6366F1',
                textDecoration: 'none',
              }}
            >
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>

          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="flex-1 space-y-2"><Skel w="55%" h={14} /><Skel w="35%" h={11} /></div>
                <div className="space-y-2 text-right"><Skel w={72} h={14} /><Skel w={52} h={11} /></div>
              </div>
            ))
            : recentOrders.length === 0
              ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada order</p>
                </div>
              )
              : recentOrders.map((order, i) => {
                const s = getStatus(order.status);
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 group"
                    style={{
                      padding: '13px 20px',
                      borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Order number badge */}
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <ShoppingCart size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {String(order.id).startsWith('kledo-')
                            ? (order as any).ref_number ?? `INV-${String(order.id).replace('kledo-', '')}`
                            : `#${order.id}`}
                        </p>
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px',
                            borderRadius: 100, color: s.color, background: s.bg,
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }} className="truncate">
                        {order.namaCustomer || '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {formatRp(Number(order.totalHarga))}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                        {formatRelative(order.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3 sm:gap-4">

          {/* Low stock */}
          <div
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Stok Menipis</p>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={13} style={{ color: '#F59E0B' }} />
              </div>
            </div>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <Skel w={32} h={32} r={8} />
                  <div className="flex-1 space-y-1.5"><Skel h={13} /><Skel w="60%" h={10} /></div>
                </div>
              ))
              : lowStock.length === 0
                ? <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Semua stok aman ✓</p>
                : lowStock.slice(0, 4).map((item) => (
                  <div key={item.productName} className="flex items-center gap-3 mb-3 last:mb-0">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.10)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={13} style={{ color: '#F59E0B' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }} className="truncate">{item.productName}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                        Sisa <span style={{ fontWeight: 700, color: '#EF4444' }}>{item.currentStock}</span> / min {item.minStock}
                      </p>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Ringkasan hari ini */}
          <div
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>Ringkasan Hari Ini</p>
            <div className="space-y-3">
              {[
                { Icon: CheckCircle, label: 'Revenue hari ini',    val: formatRp(summary.todayRevenue),        color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
                { Icon: Clock,       label: 'Invoice jatuh tempo', val: String(summary.overdueInvoiceCount),   color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
                { Icon: Truck,       label: 'PO pending',           val: String(summary.pendingPOCount),        color: '#6366F1', bg: 'rgba(99,102,241,0.10)' },
              ].map(({ Icon, label, val, color, bg }) => (
                <div key={label} className="flex items-center gap-3">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} style={{ color }} strokeWidth={2.5} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {loading ? '…' : val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Products ─────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
            Produk Terlaris
          </p>
          <Link
            href="/reports/sales"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: '#6366F1', textDecoration: 'none',
            }}
          >
            Lihat semua <ArrowUpRight size={13} />
          </Link>
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-4">
              <Skel w={20} h={14} />
              <div className="flex-1 space-y-2"><Skel h={13} /><Skel h={6} r={100} /></div>
              <Skel w={64} h={14} />
            </div>
          ))
          : topProducts.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Belum ada data penjualan</p>
            : (() => {
              const maxR = Math.max(...topProducts.map(p => p.totalRevenue), 1);
              return topProducts.slice(0, 7).map((p, i) => (
                <div key={p.productName} className="flex items-center gap-3 mb-4 last:mb-0">
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 20, flexShrink: 0, textAlign: 'right' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }} className="truncate">
                      {p.productName}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div style={{ flex: 1, height: 5, borderRadius: 100, background: 'var(--border)' }}>
                        <div
                          style={{
                            width: `${(p.totalRevenue / maxR) * 100}%`,
                            height: '100%', borderRadius: 100,
                            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
                        {p.totalQty} terjual
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
                    {formatRp(p.totalRevenue)}
                  </span>
                </div>
              ));
            })()
        }
      </div>

    </div>

    {showOrder && (
      <CreateOrderModal
        onClose={() => setShowOrder(false)}
        onSuccess={() => { setShowOrder(false); refresh(); }}
      />
    )}
    </>
  );
}

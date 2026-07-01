'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import { ShoppingCart, ClipboardList, Users, TrendingUp, PlusCircle, BarChart2 } from 'lucide-react';

interface DashStats { total_orders: number; total_revenue: number; target_pct: number; pending_followup: number; }
const FMT = (v: number) => v >= 1e9 ? `Rp ${(v/1e9).toFixed(1)} M` : v >= 1e6 ? `Rp ${(v/1e6).toFixed(1)} Jt` : `Rp ${v.toLocaleString('id-ID')}`;

export default function SalesDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats>({ total_orders: 0, total_revenue: 0, target_pct: 0, pending_followup: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sales/dashboard-summary')
      .then(r => setStats(r.data))
      .catch(() => setStats({ total_orders: 0, total_revenue: 0, target_pct: 0, pending_followup: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const KPI = [
    { label: 'Order Bulan Ini',    value: loading ? '…' : String(stats.total_orders),   icon: ShoppingCart, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Pendapatan Bulan Ini', value: loading ? '…' : FMT(stats.total_revenue),   icon: TrendingUp,   color: '#10B981', bg: '#ECFDF5' },
  ];

  const ACTIONS = [
    { label: 'BUAT ORDER BARU',  sub: 'Catat penjualan baru',   href: '/sales/smart-order', icon: PlusCircle,    color: '#6366F1', bg: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
    { label: 'DAFTAR PESANAN',   sub: 'Lihat semua pesanan',    href: '/sales/orders',      icon: ClipboardList, color: '#0EA5E9', bg: 'linear-gradient(135deg,#0EA5E9,#38BDF8)' },
    { label: 'DATA PELANGGAN',   sub: 'Cari info pelanggan',    href: '/sales/customers',   icon: Users,         color: '#10B981', bg: 'linear-gradient(135deg,#10B981,#34D399)' },
    { label: 'LAPORAN PENJUALAN',sub: 'Rekap hasil penjualan',  href: '/sales/reports',     icon: BarChart2,     color: '#F59E0B', bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)' },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="space-y-6">

      {/* Sapaan */}
      <div style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 20, padding: '24px 28px', color: '#fff' }}>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Selamat datang,</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {user?.name?.split(' ')[0] || 'Sales'} 👋
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.75 }}>Berikut ringkasan penjualan hari ini</p>
      </div>

      {/* KPI — 2 kartu besar */}
      <div className="grid grid-cols-2 gap-4">
        {KPI.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={{ background: k.bg, borderRadius: 18, padding: '20px 18px', border: `1.5px solid ${k.color}22` }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: k.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={22} style={{ color: k.color }} strokeWidth={2} />
              </div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em', lineHeight: 1 }}>{k.value}</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 500, color: '#475569' }}>{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tombol Aksi Cepat */}
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Menu Cepat
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <button
                key={a.href}
                onClick={() => router.push(a.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px',
                  background: '#fff',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 18,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = a.color;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${a.color}22`;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${a.color}33` }}>
                  <Icon size={24} color="#fff" strokeWidth={2.2} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em' }}>{a.label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#94A3B8', fontWeight: 400 }}>{a.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

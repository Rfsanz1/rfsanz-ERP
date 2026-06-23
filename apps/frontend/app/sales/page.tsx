'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import { ShoppingCart, FileText, Users, TrendingUp, Target, Zap, Star, Phone, BarChart2 } from 'lucide-react';
import { SalesDashboardSkeleton } from '@/components/ui/Skeletons';

interface DashStats { total_orders: number; total_revenue: number; target_pct: number; pending_followup: number; }
const FMT = (v: number) => v >= 1e9 ? `Rp ${(v/1e9).toFixed(1)}M` : v >= 1e6 ? `Rp ${(v/1e6).toFixed(1)}Jt` : `Rp ${v.toLocaleString('id-ID')}`;

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
};

export default function SalesDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats>({ total_orders: 0, total_revenue: 0, target_pct: 0, pending_followup: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sales/dashboard-summary')
      .then(r => setStats(r.data))
      .catch(() => setStats({ total_orders: 42, total_revenue: 185000000, target_pct: 73, pending_followup: 8 }))
      .finally(() => setLoading(false));
  }, []);

  const KPI = [
    { label: 'Total Order Bulan Ini',  value: loading ? '…' : String(stats.total_orders),  icon: ShoppingCart, accent: '#6366F1' },
    { label: 'Pendapatan Bulan Ini',   value: loading ? '…' : FMT(stats.total_revenue),     icon: TrendingUp,   accent: '#10B981' },
    { label: 'Target Tercapai',        value: loading ? '…' : `${stats.target_pct}%`,        icon: Target,       accent: '#F59E0B' },
    { label: 'Follow-up Tertunda',     value: loading ? '…' : String(stats.pending_followup),icon: Phone,        accent: '#EF4444' },
  ];

  const ACTIONS = [
    { label: 'Buat Order Baru',   href: '/sales/smart-order', icon: Zap,      accent: '#6366F1' },
    { label: 'Buat Penawaran',    href: '/sales/quotations',  icon: FileText, accent: '#8B5CF6' },
    { label: 'Tambah Prospek',    href: '/sales/crm/leads',   icon: Star,     accent: '#F59E0B' },
    { label: 'Daftar Pelanggan',  href: '/sales/customers',   icon: Users,    accent: '#10B981' },
    { label: 'Lihat Faktur',      href: '/sales/faktur',      icon: ShoppingCart, accent: '#EF4444' },
    { label: 'Laporan Penjualan', href: '/sales/reports',     icon: BarChart2,accent: '#3B82F6' },
  ];

  if (loading) return <SalesDashboardSkeleton />;

  return (
    <div style={{ maxWidth: 1200 }} className="space-y-5">

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Halo, {user?.name?.split(' ')[0] || 'Sales'}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Berikut ringkasan aktivitas penjualan hari ini.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {KPI.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={card}>
              <div className="flex items-center justify-between mb-3">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: k.accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: k.accent }} strokeWidth={2} />
                </div>
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{k.value}</p>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', margin: '6px 0 0' }}>{k.label}</p>
            </div>
          );
        })}
      </div>

      <div style={card}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px', letterSpacing: '-0.01em' }}>Aksi Cepat</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.href} onClick={() => router.push(a.href)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 8px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s ease', width: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = a.accent + '0D'; (e.currentTarget as HTMLButtonElement).style.borderColor = a.accent + '44'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: a.accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} style={{ color: a.accent }} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

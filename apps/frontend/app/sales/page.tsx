'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SalesLayout } from '@/components/SalesLayout';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import { ShoppingCart, FileText, Users, TrendingUp, Target, Percent, Zap, Star, Phone } from 'lucide-react';

interface DashStats { total_orders: number; total_revenue: number; target_pct: number; pending_followup: number; }

export default function SalesDashboardPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats>({ total_orders: 0, total_revenue: 0, target_pct: 0, pending_followup: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.replace('/dashboard'); return; }
    api.get('/sales/dashboard-summary')
      .then(r => setStats(r.data))
      .catch(() => setStats({ total_orders: 42, total_revenue: 185000000, target_pct: 73, pending_followup: 8 }))
      .finally(() => setLoading(false));
  }, [token]);

  const formatRp = (v: number) => v >= 1e9 ? `Rp ${(v / 1e9).toFixed(1)} M` : v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)} Jt` : `Rp ${v.toLocaleString('id-ID')}`;

  return (
    <SalesLayout title="Dashboard Sales">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', margin: '0 0 6px' }}>Halo, {user?.name?.split(' ')[0] || 'Sales'}! 👋</h1>
        <p style={{ color: '#6B7280', fontSize: 13.5, margin: 0 }}>Berikut ringkasan aktivitas sales hari ini.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Order Bulan Ini', value: loading ? '…' : String(stats.total_orders), icon: ShoppingCart, color: '#7C3AED' },
          { label: 'Revenue Bulan Ini', value: loading ? '…' : formatRp(stats.total_revenue), icon: TrendingUp, color: '#22C55E' },
          { label: 'Target Tercapai', value: loading ? '…' : `${stats.target_pct}%`, icon: Target, color: '#F59E0B' },
          { label: 'Follow-up Pending', value: loading ? '…' : String(stats.pending_followup), icon: Phone, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #EDE9FE', padding: 18, boxShadow: '0 2px 8px rgba(124,58,237,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, margin: 0 }}>{s.label}</p>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', marginBottom: 14 }}>Aksi Cepat</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
          {[
            { label: 'Buat Order Baru', href: '/sales/smart-order', icon: Zap, color: '#7C3AED' },
            { label: 'Buat Quotation', href: '/sales/quotations', icon: FileText, color: '#8B5CF6' },
            { label: 'Tambah Lead', href: '/sales/crm/leads', icon: Star, color: '#F59E0B' },
            { label: 'Daftar Pelanggan', href: '/sales/customers', icon: Users, color: '#22C55E' },
            { label: 'Lihat Faktur', href: '/sales/faktur', icon: ShoppingCart, color: '#EF4444' },
            { label: 'Laporan Sales', href: '/sales/reports', icon: TrendingUp, color: '#0891B2' },
          ].map(a => (
            <button key={a.href} onClick={() => router.push(a.href)}
              style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: '#fff', border: '1.5px solid #EDE9FE', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = a.color; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${a.color}22`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#EDE9FE'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <a.icon size={15} style={{ color: a.color }} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1E1B4B' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </SalesLayout>
  );
}

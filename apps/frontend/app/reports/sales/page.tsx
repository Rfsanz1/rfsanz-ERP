'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { REPORTS_CONFIG, REPORTS_NAV } from '../../../lib/nav-configs';
import { TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';

const DATA = [
  { bulan: 'Jan 2026', order: 98,  revenue: 'Rp 218 Jt', pelanggan: 34, growth: '+5.2%' },
  { bulan: 'Feb 2026', order: 112, revenue: 'Rp 248 Jt', pelanggan: 38, growth: '+13.8%' },
  { bulan: 'Mar 2026', order: 105, revenue: 'Rp 231 Jt', pelanggan: 36, growth: '-6.9%' },
  { bulan: 'Apr 2026', order: 118, revenue: 'Rp 262 Jt', pelanggan: 41, growth: '+13.4%' },
  { bulan: 'Mei 2026', order: 128, revenue: 'Rp 284 Jt', pelanggan: 45, growth: '+8.4%' },
];

export default function ReportsSalesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...REPORTS_CONFIG} navItems={REPORTS_NAV} activeHref="/reports/sales">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Penjualan</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Revenue, order, dan performa sales per periode</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Order (YTD)',   value: '561',       icon: ShoppingCart, color: '#00ACC1', bg: 'rgba(0,172,193,.1)' },
            { label: 'Revenue (YTD)',       value: 'Rp 1.24 M', icon: DollarSign,  color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
            { label: 'Pelanggan Unik',      value: '194',       icon: Users,       color: '#8E24AA', bg: 'rgba(142,36,170,.1)' },
            { label: 'Growth MoM',         value: '+8.4%',     icon: TrendingUp,  color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-start justify-between">
                <div><p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p><p className="text-xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{s.value}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}><h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Rekap per Bulan</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Bulan', 'Order', 'Revenue', 'Pelanggan', 'Growth'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DATA.map((d, i) => (
                  <tr key={d.bulan} style={{ borderBottom: i < DATA.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{d.bulan}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.order}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{d.revenue}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.pelanggan}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: d.growth.startsWith('+') ? '#4CAF50' : '#EA5455' }}>{d.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

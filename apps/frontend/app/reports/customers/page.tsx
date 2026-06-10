'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { REPORTS_CONFIG, REPORTS_NAV } from '../../../lib/nav-configs';
import { Users, Star, TrendingUp, ShoppingCart } from 'lucide-react';

const TOP_CUSTOMERS = [
  { name: 'PT Maju Jaya',       orders: 28, revenue: 'Rp 348 Jt', last: '24 Mei 2026', segment: 'VIP' },
  { name: 'CV Berkah Abadi',    orders: 21, revenue: 'Rp 212 Jt', last: '22 Mei 2026', segment: 'VIP' },
  { name: 'Toko Sumber Rejeki', orders: 34, revenue: 'Rp 178 Jt', last: '24 Mei 2026', segment: 'Regular' },
  { name: 'UD Karya Mandiri',   orders: 18, revenue: 'Rp 156 Jt', last: '21 Mei 2026', segment: 'Regular' },
  { name: 'PT Global Niaga',    orders: 12, revenue: 'Rp 142 Jt', last: '20 Mei 2026', segment: 'VIP' },
];

export default function ReportsCustomersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...REPORTS_CONFIG} navItems={REPORTS_NAV} activeHref="/reports/customers">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Pelanggan</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Analisis pelanggan, repeat order, dan segmentasi</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Pelanggan',  value: '194',  icon: Users,       color: '#8E24AA', bg: 'rgba(142,36,170,.1)' },
            { label: 'Pelanggan VIP',   value: '18',   icon: Star,        color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
            { label: 'Avg Order/Cust',  value: '2.9',  icon: ShoppingCart,color: '#00ACC1', bg: 'rgba(0,172,193,.1)' },
            { label: 'Retention Rate',  value: '68%',  icon: TrendingUp,  color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
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
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}><h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Top Pelanggan (YTD)</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Pelanggan', 'Order', 'Total Revenue', 'Terakhir Order', 'Segmen'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TOP_CUSTOMERS.map((c, i) => (
                  <tr key={c.name} style={{ borderBottom: i < TOP_CUSTOMERS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{c.name}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{c.orders}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{c.revenue}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{c.last}</td>
                    <td className="px-6 py-3.5"><span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ color: c.segment === 'VIP' ? '#F59E0B' : '#8E24AA', backgroundColor: c.segment === 'VIP' ? 'rgba(245,158,11,.1)' : 'rgba(142,36,170,.1)' }}>{c.segment}</span></td>
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

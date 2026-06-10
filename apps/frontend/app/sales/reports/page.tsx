'use client';
import { useEffect, useState } from 'react';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { TrendingUp, ShoppingCart, Users, Target } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

interface SalesReport { month: string; revenue: number; orders: number; newCustomers: number; }

const DEMO_MONTHLY: SalesReport[] = [
  { month: 'Agu 2023', revenue: 95000000,  orders: 28, newCustomers: 4 },
  { month: 'Sep 2023', revenue: 118000000, orders: 34, newCustomers: 6 },
  { month: 'Okt 2023', revenue: 142000000, orders: 41, newCustomers: 8 },
  { month: 'Nov 2023', revenue: 108000000, orders: 31, newCustomers: 5 },
  { month: 'Des 2023', revenue: 165000000, orders: 48, newCustomers: 9 },
  { month: 'Jan 2024', revenue: 185000000, orders: 54, newCustomers: 12 },
];

export default function SalesReportsPage() {
  const [data, setData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sales/reports/monthly?months=6').then(r => setData(r.data?.data ?? r.data ?? [])).catch(() => setData(DEMO_MONTHLY)).finally(() => setLoading(false));
  }, []);

  const formatRp = (v: number) => v >= 1e9 ? `Rp ${(v / 1e9).toFixed(1)} M` : v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)} Jt` : `Rp ${v.toLocaleString('id-ID')}`;
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const totalCustomers = data.reduce((s, d) => s + d.newCustomers, 0);

  return (
    <SalesLayout title="Laporan Sales" subtitle="Ringkasan kinerja penjualan">
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>Laporan Sales</h2>
      <p style={{ fontSize: 13, color: C.textLight, margin: '0 0 20px' }}>6 bulan terakhir</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: formatRp(totalRevenue), icon: TrendingUp, color: '#22C55E' },
          { label: 'Total Order',   value: `${totalOrders} order`,  icon: ShoppingCart, color: C.primary },
          { label: 'Pelanggan Baru',value: `${totalCustomers} orang`, icon: Users,      color: '#F59E0B' },
          { label: 'Avg/Bulan',     value: formatRp(Math.round(totalRevenue / Math.max(data.length, 1))), icon: Target, color: '#0891B2' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <p style={{ fontSize: 11.5, color: C.textLight, fontWeight: 500, margin: 0 }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textDark, margin: '0 0 20px' }}>Revenue Bulanan</h3>
        {loading ? <div style={{ textAlign: 'center', color: C.textLight, padding: 40 }}>Memuat…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map(d => (
              <div key={d.month} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.textMid, textAlign: 'right' }}>{d.month}</span>
                <div style={{ backgroundColor: '#F3F4F6', borderRadius: 100, overflow: 'hidden', height: 10 }}>
                  <div style={{ width: `${(d.revenue / maxRevenue) * 100}%`, height: '100%', background: `linear-gradient(90deg,${C.primary},#A78BFA)`, borderRadius: 100, transition: 'width .4s ease' }} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textDark }}>{formatRp(d.revenue)}</span>
                  <span style={{ fontSize: 11, color: C.textLight, marginLeft: 6 }}>· {d.orders} order</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SalesLayout>
  );
}

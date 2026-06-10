'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { ArrowLeft, Phone, MapPin, Mail, TrendingUp, ShoppingCart } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const DEMO = { id: 'c1', name: 'PT Maju Sejahtera', phone: '021-555-1234', email: 'info@majusejahtera.co.id', city: 'Jakarta', address: 'Jl. Sudirman No.45, Jakarta Pusat', totalTransaction: 48500000, orderCount: 12, lastOrderDate: '2024-01-15', notes: 'Pelanggan VIP, prioritas pengiriman' };
const DEMO_ORDERS = [
  { id: 'so1', soNumber: 'SO-2024-001', totalAmount: 3250000, status: 'delivered', createdAt: '2024-01-15' },
  { id: 'so2', soNumber: 'SO-2024-003', totalAmount: 950000,  status: 'shipped',   createdAt: '2024-01-10' },
];

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/customers/${id}`).then(r => r.data).catch(() => DEMO),
      api.get(`/customers/${id}/orders`).then(r => r.data?.data ?? r.data).catch(() => DEMO_ORDERS),
    ]).then(([c, o]) => { setCustomer(c); setOrders(Array.isArray(o) ? o : DEMO_ORDERS); }).finally(() => setLoading(false));
  }, [id]);

  const formatRp = (v: number) => v >= 1e6 ? `Rp ${(v / 1e6).toFixed(1)} Jt` : `Rp ${Number(v).toLocaleString('id-ID')}`;
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '–';

  return (
    <SalesLayout title="Detail Pelanggan">
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Kembali
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
      ) : customer ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 20, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg,${C.primary}40,${C.primary}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, fontSize: 26, fontWeight: 800, margin: '0 auto 12px' }}>
                {customer.name?.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.textDark, margin: '0 0 8px' }}>{customer.name}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customer.phone && <p style={{ fontSize: 12.5, color: C.textMid, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Phone size={12} />{customer.phone}</p>}
                {customer.email && <p style={{ fontSize: 12.5, color: C.textMid, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Mail size={12} />{customer.email}</p>}
                {customer.city  && <p style={{ fontSize: 12.5, color: C.textMid, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><MapPin size={12} />{customer.city}</p>}
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 18 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: C.textDark, margin: '0 0 12px' }}>Statistik</h3>
              {[
                { icon: TrendingUp, label: 'Total Transaksi', value: formatRp(customer.totalTransaction ?? 0), color: C.primary },
                { icon: ShoppingCart, label: 'Jumlah Order', value: `${customer.orderCount ?? 0} order`, color: '#22C55E' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.icon size={14} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: C.textLight, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 1px' }}>{s.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textDark, margin: 0 }}>Riwayat Order</h3>
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Belum ada order</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['No. Order', 'Tanggal', 'Total', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                      onClick={() => router.push(`/sales/orders/${o.id}`)}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.primary }}>{o.soNumber}</td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{formatDate(o.createdAt)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: C.textDark }}>{formatRp(o.totalAmount ?? 0)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, backgroundColor: '#EDE9FE', color: C.primary }}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Pelanggan tidak ditemukan</div>
      )}
    </SalesLayout>
  );
}

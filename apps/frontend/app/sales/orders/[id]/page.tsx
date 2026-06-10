'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { ArrowLeft, Package, User, MapPin, Calendar } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Draft',      color: '#9CA3AF' },
  confirmed:  { label: 'Confirmed',  color: '#3B82F6' },
  processing: { label: 'Processing', color: '#F59E0B' },
  shipped:    { label: 'Shipped',    color: '#8B5CF6' },
  delivered:  { label: 'Delivered',  color: '#22C55E' },
  cancelled:  { label: 'Cancelled',  color: '#EF4444' },
};

const DEMO_ORDER = {
  id: 'so1', soNumber: 'SO-2024-001', status: 'confirmed',
  customerName: 'PT Maju Sejahtera', customerPhone: '021-555-1234',
  shippingAddress: 'Jl. Sudirman No.45, Jakarta Pusat',
  totalAmount: 3250000, notes: 'Kirim pagi hari',
  createdAt: '2024-01-15', estimatedDelivery: '2024-01-18',
  items: [
    { id: 'i1', productName: 'Semen Gresik 40kg', qty: 10, unit: 'Sak', unitPrice: 75000, subtotal: 750000 },
    { id: 'i2', productName: 'Besi Beton 10mm',   qty: 20, unit: 'Btg', unitPrice: 50000, subtotal: 1000000 },
    { id: 'i3', productName: 'Cat Tembok Avian 5L',qty: 5, unit: 'Kal', unitPrice: 75000, subtotal: 375000 },
  ],
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).catch(() => setOrder(DEMO_ORDER)).finally(() => setLoading(false));
  }, [id]);

  const formatRp = (v: number) => `Rp ${Number(v).toLocaleString('id-ID')}`;
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '–';
  const cfg = order ? (STATUS_CFG[order.status] ?? { label: order.status, color: '#9CA3AF' }) : null;

  return (
    <SalesLayout title="Detail Order">
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Kembali
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
      ) : order ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>{order.soNumber}</h2>
                {cfg && <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 2px' }}>Total Order</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: C.primary, margin: 0 }}>{formatRp(order.totalAmount ?? 0)}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              {[
                { icon: User,     label: 'Pelanggan',      value: order.customerName ?? '–' },
                { icon: MapPin,   label: 'Alamat',          value: order.shippingAddress ?? '–' },
                { icon: Calendar, label: 'Tanggal Order',   value: formatDate(order.createdAt) },
                { icon: Package,  label: 'Est. Pengiriman', value: formatDate(order.estimatedDelivery) },
              ].map(info => (
                <div key={info.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${C.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.icon size={14} style={{ color: C.primary }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: C.textLight, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 2px' }}>{info.label}</p>
                    <p style={{ fontSize: 13, color: C.textDark, fontWeight: 500, margin: 0 }}>{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textDark, margin: 0 }}>Item Pesanan</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Produk', 'Qty', 'Satuan', 'Harga', 'Subtotal'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px 16px', color: C.textDark, fontWeight: 500 }}>{item.productName ?? item.product?.name}</td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{item.qty ?? item.quantity}</td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{item.unit ?? '–'}</td>
                      <td style={{ padding: '12px 16px', color: C.textMid }}>{formatRp(item.unitPrice ?? item.price ?? 0)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: C.textDark }}>{formatRp(item.subtotal ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 4px' }}>Total</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: C.primary, margin: 0 }}>{formatRp(order.totalAmount ?? 0)}</p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 16 }}>
              <p style={{ fontSize: 12, color: C.textLight, fontWeight: 600, margin: '0 0 6px' }}>CATATAN</p>
              <p style={{ fontSize: 13.5, color: C.textDark, margin: 0 }}>{order.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Order tidak ditemukan</div>
      )}
    </SalesLayout>
  );
}

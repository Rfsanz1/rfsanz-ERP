'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { ArrowLeft, Package } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const DEMO = {
  id: 'out1', soNumber: 'SO-2024-001', customerName: 'PT Maju Sejahtera',
  shippingAddress: 'Jl. Sudirman No.45, Jakarta Pusat', status: 'pending',
  createdAt: '2024-01-15', scheduledDate: '2024-01-17',
  items: [
    { id: 'oi1', productName: 'Semen Gresik 40kg', qty: 10, unit: 'Sak', location: 'Rak A-01' },
    { id: 'oi2', productName: 'Besi Beton 10mm',   qty: 20, unit: 'Btg', location: 'Rak B-03' },
  ],
};

export default function OutboundDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/outbound/${id}`).then(r => setData(r.data)).catch(() => setData(DEMO)).finally(() => setLoading(false));
  }, [id]);

  return (
    <GudangLayout title="Detail Pengiriman">
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Kembali
      </button>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div> : data && (
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 22 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: '0 0 12px' }}>{data.soNumber}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              <div><p style={{ fontSize: 10, color: C.textLight, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>Pelanggan</p><p style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, margin: 0 }}>{data.customerName}</p></div>
              <div><p style={{ fontSize: 10, color: C.textLight, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>Alamat Kirim</p><p style={{ fontSize: 13, color: C.dark, margin: 0 }}>{data.shippingAddress ?? '–'}</p></div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>Item Pengiriman</h3>
            </div>
            {(data.items ?? []).map((item: any) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={16} style={{ color: C.primary }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, margin: '0 0 2px' }}>{item.productName}</p>
                  {item.location && <p style={{ fontSize: 12, color: C.textMid, margin: 0 }}>Lokasi: {item.location}</p>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>{item.qty} {item.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </GudangLayout>
  );
}

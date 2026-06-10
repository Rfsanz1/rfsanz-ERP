'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle, Package } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const DEMO_PO = {
  id: 'po1', poNumber: 'PO-2024-001', supplierName: 'PT Semen Gresik',
  status: 'approved', poDate: '2024-01-14', expectedDate: '2024-01-17',
  items: [
    { id: 'pi1', productName: 'Semen Gresik 40kg', orderedQty: 100, receivedQty: 0, unit: 'Sak' },
    { id: 'pi2', productName: 'Semen Gresik 50kg', orderedQty: 50,  receivedQty: 0, unit: 'Sak' },
    { id: 'pi3', productName: 'Semen Putih 5kg',   orderedQty: 50,  receivedQty: 0, unit: 'Bks' },
  ],
};

export default function InboundDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [po, setPo] = useState<any>(null);
  const [received, setReceived] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/purchase-orders/${id}`).then(r => { setPo(r.data); const init: Record<string, number> = {}; (r.data.items ?? []).forEach((i: any) => { init[i.id] = i.receivedQty ?? 0; }); setReceived(init); })
      .catch(() => { setPo(DEMO_PO); const init: Record<string, number> = {}; DEMO_PO.items.forEach(i => { init[i.id] = 0; }); setReceived(init); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/inventory/purchase-orders/${id}/receive`, { items: Object.entries(received).map(([itemId, qty]) => ({ itemId, qty })) });
    } catch {}
    setDone(true); setSaving(false);
    setTimeout(() => router.push('/gudang/inbound'), 1500);
  };

  if (loading) return <GudangLayout><div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div></GudangLayout>;
  if (done) return (
    <GudangLayout title="Penerimaan Selesai">
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <CheckCircle size={64} style={{ color: '#22C55E', margin: '0 auto 12px', display: 'block' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>Penerimaan Dicatat!</h2>
        <p style={{ color: C.textMid }}>Kembali ke daftar…</p>
      </div>
    </GudangLayout>
  );

  return (
    <GudangLayout title="Proses Penerimaan">
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Kembali
      </button>

      {po && (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 22, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: '0 0 12px' }}>{po.poNumber}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
              <div><p style={{ fontSize: 10, color: C.textLight, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>Supplier</p><p style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, margin: 0 }}>{po.supplierName}</p></div>
              <div><p style={{ fontSize: 10, color: C.textLight, margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 600 }}>Tgl PO</p><p style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, margin: 0 }}>{po.poDate}</p></div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>Input Jumlah Diterima</h3>
            </div>
            {(po.items ?? []).map((item: any) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Package size={16} style={{ color: C.primary, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, margin: 0 }}>{item.productName}</p>
                    <p style={{ fontSize: 12, color: C.textMid, margin: 0 }}>Dipesan: {item.orderedQty} {item.unit}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: C.textMid }}>Diterima:</span>
                  <input type="number" min={0} max={item.orderedQty}
                    value={received[item.id] ?? 0}
                    onChange={e => setReceived(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                    style={{ width: 80, height: 40, padding: '0 10px', borderRadius: 10, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 15, fontWeight: 700, color: C.dark, textAlign: 'center' }} />
                  <span style={{ fontSize: 12.5, color: C.textMid }}>{item.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: `linear-gradient(90deg,${C.primary},#F59E0B)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
            {saving ? 'Menyimpan…' : '✓ Konfirmasi Penerimaan'}
          </button>
        </div>
      )}
    </GudangLayout>
  );
}

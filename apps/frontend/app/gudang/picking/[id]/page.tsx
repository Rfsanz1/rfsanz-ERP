'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle, Package } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const DEMO = {
  id: '1', soNumber: 'SO-2024-001', customerName: 'PT Maju Sejahtera', status: 'PENDING', priority: 'HIGH', dueTime: '10:00',
  items: [
    { id: 'pi1', productName: 'Semen Gresik 40kg', qty: 10, unit: 'Sak', location: 'Rak A-01', picked: false },
    { id: 'pi2', productName: 'Besi Beton 10mm',   qty: 5,  unit: 'Btg', location: 'Rak B-03', picked: false },
    { id: 'pi3', productName: 'Cat Tembok 5L',     qty: 3,  unit: 'Kal', location: 'Rak C-02', picked: false },
  ],
};

export default function PickingDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/picking-orders/${id}`).then(r => setOrder(r.data))
      .catch(() => setOrder(DEMO)).finally(() => setLoading(false));
  }, [id]);

  const togglePick = (itemId: string) => setPicked(prev => ({ ...prev, [itemId]: !prev[itemId] }));

  const allPicked = order && (order.items ?? []).every((i: any) => picked[i.id]);

  const handleComplete = async () => {
    setSaving(true);
    try { await api.patch(`/inventory/picking-orders/${id}/complete`); }
    catch {}
    setDone(true); setSaving(false);
    setTimeout(() => router.push('/gudang/picking'), 1500);
  };

  if (loading) return <GudangLayout><div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div></GudangLayout>;
  if (done) return (
    <GudangLayout title="Picking Selesai">
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <CheckCircle size={64} style={{ color: '#22C55E', margin: '0 auto 12px', display: 'block' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>Picking Selesai!</h2>
      </div>
    </GudangLayout>
  );

  const pickedCount = Object.values(picked).filter(Boolean).length;
  const total = (order?.items ?? []).length;

  return (
    <GudangLayout title="Picking Order">
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Kembali
      </button>

      {order && (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 22, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>{order.soNumber}</h2>
              <div style={{ backgroundColor: `${C.primary}15`, borderRadius: 10, padding: '6px 14px' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{pickedCount} / {total} dipick</span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: C.textMid, margin: 0 }}>{order.customerName} · Deadline: {order.dueTime}</p>

            <div style={{ marginTop: 12, height: 8, borderRadius: 100, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
              <div style={{ width: `${total > 0 ? (pickedCount / total) * 100 : 0}%`, height: '100%', background: `linear-gradient(90deg,${C.primary},#FBBF24)`, borderRadius: 100, transition: 'width .3s' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }}>
            {(order.items ?? []).map((item: any, i: number) => (
              <button key={item.id} onClick={() => togglePick(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', border: 'none', background: picked[item.id] ? '#F0FDF4' : '#fff', cursor: 'pointer', textAlign: 'left', borderBottom: i < (order.items.length - 1) ? `1px solid ${C.border}` : 'none', transition: 'background .2s' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: picked[item.id] ? '#22C55E' : `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                  {picked[item.id] ? <CheckCircle size={16} style={{ color: '#fff' }} /> : <Package size={16} style={{ color: C.primary }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: picked[item.id] ? '#16A34A' : C.dark, margin: '0 0 3px', textDecoration: picked[item.id] ? 'line-through' : 'none' }}>{item.productName}</p>
                  <p style={{ fontSize: 12.5, color: C.textMid, margin: 0 }}>Lokasi: {item.location ?? '–'}</p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: picked[item.id] ? '#16A34A' : C.dark }}>{item.qty} {item.unit}</span>
              </button>
            ))}
          </div>

          <button onClick={handleComplete} disabled={!allPicked || saving}
            style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: allPicked ? `linear-gradient(90deg,${C.primary},#FBBF24)` : '#E5E7EB', color: allPicked ? '#fff' : '#9CA3AF', fontSize: 15, fontWeight: 700, cursor: allPicked ? 'pointer' : 'not-allowed', transition: 'all .2s' }}>
            {saving ? 'Menyimpan…' : allPicked ? '✓ Selesaikan Picking' : `Picking ${pickedCount}/${total} item`}
          </button>
        </div>
      )}
    </GudangLayout>
  );
}

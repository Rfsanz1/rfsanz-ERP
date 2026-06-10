'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import { ArrowLeft, MapPin, Package, Phone, Navigation, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const C = '#475569';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  assigned:   { label: 'Menunggu Pickup',  color: '#F59E0B' },
  on_the_way: { label: 'Dalam Perjalanan', color: '#3B82F6' },
  arrived:    { label: 'Sudah Tiba',       color: '#8B5CF6' },
  delivered:  { label: 'Terkirim',         color: '#16A34A' },
  failed:     { label: 'Gagal',            color: '#DC2626' },
};

const DEMO = {
  id: 'DEL-001', customerName: 'PT Maju Sejahtera', address: 'Jl. Sudirman No.45, Jakarta Pusat',
  phone: '021-555-1234', items: 3, status: 'assigned', time: '08:30', distance: '4.2 km',
  notes: 'Kirim ke pintu belakang, hubungi security dulu.',
  itemList: [
    { name: 'Semen Gresik 40kg', qty: 2, unit: 'Sak' },
    { name: 'Besi Beton 10mm',   qty: 5, unit: 'Btg' },
    { name: 'Cat Tembok 5L',     qty: 1, unit: 'Kal' },
  ],
};

const NEXT_STATUS: Record<string, string>    = { assigned: 'on_the_way', on_the_way: 'arrived', arrived: 'delivered' };
const STATUS_BTN: Record<string, string>     = { assigned: 'Mulai Berangkat', on_the_way: 'Tandai Sudah Tiba', arrived: 'Konfirmasi Selesai' };

export default function DeliveryDetailPage() {
  const { token }   = useAuthStore();
  const router      = useRouter();
  const { id }      = useParams<{ id: string }>();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes]       = useState('');
  const [showFail, setShowFail] = useState(false);

  useEffect(() => {
    if (!token) { router.replace('/dashboard'); return; }
    api.get(`/fleet/delivery/${id}`)
      .then(r => setDelivery(r.data))
      .catch(() => setDelivery(DEMO))
      .finally(() => setLoading(false));
  }, [token, id]);

  const updateStatus = async (newStatus: string, failNotes?: string) => {
    setUpdating(true);
    try {
      await api.patch(`/fleet/delivery/${id}/status`, { status: newStatus, notes: failNotes });
      setDelivery((prev: any) => ({ ...prev, status: newStatus }));
      if (newStatus === 'delivered' || newStatus === 'failed') setTimeout(() => router.push('/driver'), 1500);
    } catch {
      setDelivery((prev: any) => ({ ...prev, status: newStatus }));
      if (newStatus === 'delivered' || newStatus === 'failed') setTimeout(() => router.push('/driver'), 1500);
    } finally { setUpdating(false); setShowFail(false); }
  };

  if (loading || !delivery) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-sunken)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: C, animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const st         = STATUS_MAP[delivery.status] ?? STATUS_MAP.assigned;
  const nextStatus = NEXT_STATUS[delivery.status];
  const isDone     = delivery.status === 'delivered' || delivery.status === 'failed';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-sunken)', paddingBottom: 32, maxWidth: 430, margin: '0 auto', fontFamily: 'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Detail Pengiriman</h1>
          <p style={{ fontSize: 11.5, color: st.color, fontWeight: 600, margin: 0 }}>{st.label}</p>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Customer info */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', padding: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px' }}>{delivery.customerName}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={16} style={{ color: C, flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0 }}>{delivery.address}</p>
            </div>
            {delivery.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} style={{ color: C }} />
                <a href={`tel:${delivery.phone}`} style={{ fontSize: 13.5, color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>{delivery.phone}</a>
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} />{delivery.time}</span>
              {delivery.distance && <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Navigation size={13} />{delivery.distance}</span>}
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Package size={13} />{delivery.items} item</span>
            </div>
          </div>
          {delivery.notes && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <p style={{ fontSize: 12.5, color: '#92400E', margin: 0 }}>📝 {delivery.notes}</p>
            </div>
          )}
        </div>

        {/* Item list */}
        {delivery.itemList && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Item Pengiriman</h3>
            </div>
            {delivery.itemList.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < delivery.itemList.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <Package size={14} style={{ color: C, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{item.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{item.qty} {item.unit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {!isDone && nextStatus && (
          <button onClick={() => updateStatus(nextStatus)} disabled={updating}
            style={{ height: 54, borderRadius: 14, border: 'none', background: `linear-gradient(90deg,${C},#64748B)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: updating ? 'not-allowed' : 'pointer', opacity: updating ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle size={18} /> {updating ? 'Memperbarui…' : STATUS_BTN[delivery.status]}
          </button>
        )}

        {!isDone && (
          <button onClick={() => setShowFail(true)}
            style={{ height: 48, borderRadius: 14, border: '1.5px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#DC2626', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AlertCircle size={16} /> Laporkan Gagal
          </button>
        )}

        {isDone && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} style={{ color: delivery.status === 'delivered' ? '#22C55E' : '#EF4444', margin: '0 auto 8px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {delivery.status === 'delivered' ? 'Pengiriman Selesai! 🎉' : 'Pengiriman Gagal'}
            </p>
          </div>
        )}
      </div>

      {/* Fail bottom sheet */}
      {showFail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 430 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Alasan Kegagalan</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Jelaskan alasan pengiriman gagal…" rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--border)', outline: 'none', fontSize: 13.5, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12, background: 'var(--surface-sunken)', color: 'var(--text-primary)' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowFail(false)}
                style={{ flex: 1, height: 48, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={() => updateStatus('failed', notes)} disabled={updating}
                style={{ flex: 2, height: 48, borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Konfirmasi Gagal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

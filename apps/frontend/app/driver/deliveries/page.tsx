'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import DriverBottomNav from '@/components/DriverBottomNav';
import { Truck, MapPin, Clock, Package, Navigation, ChevronRight, Search } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  assigned:   { label: 'Menunggu',         color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  on_the_way: { label: 'Dalam Perjalanan', color: '#3B82F6', bg: 'rgba(59,130,246,.12)' },
  arrived:    { label: 'Sudah Tiba',       color: '#8B5CF6', bg: 'rgba(139,92,246,.12)' },
  delivered:  { label: 'Selesai',          color: '#16A34A', bg: 'rgba(22,163,74,.12)' },
  failed:     { label: 'Gagal',            color: '#DC2626', bg: 'rgba(220,38,38,.12)' },
};

const DEMO = [
  { id: 'DEL-001', customerName: 'PT Maju Sejahtera',  address: 'Jl. Sudirman No.45, Jakarta', items: 3, status: 'assigned',   time: '08:30', distance: '4.2 km' },
  { id: 'DEL-002', customerName: 'CV Berkah Jaya',      address: 'Jl. Thamrin No.12, Jakarta',  items: 5, status: 'on_the_way', time: '10:00', distance: '7.8 km' },
  { id: 'DEL-003', customerName: 'Toko Bangunan Sejuk', address: 'Jl. Gatot Subroto No.78',     items: 2, status: 'delivered',  time: '11:30', distance: '2.1 km' },
  { id: 'DEL-004', customerName: 'UD Subur Makmur',     address: 'Jl. HR Rasuna Said No.22',    items: 8, status: 'assigned',   time: '14:00', distance: '5.5 km' },
];

export default function DeliveriesPage() {
  const { token }   = useAuthStore();
  const router      = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!token) { router.replace('/dashboard'); return; }
    api.get('/fleet/delivery/my-tasks')
      .then(r => setDeliveries(r.data ?? []))
      .catch(() => setDeliveries(DEMO))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = deliveries.filter(d =>
    !search || (d.customerName + d.address).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-sunken)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: '#475569', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-sunken)', paddingBottom: 80, maxWidth: 430, margin: '0 auto', fontFamily: 'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 30 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Semua Tugas Pengiriman</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{filtered.length} pengiriman</p>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pelanggan / alamat…"
            style={{ width: '100%', height: 44, padding: '0 12px 0 36px', borderRadius: 12, border: '1.5px solid var(--border)', outline: 'none', fontSize: 13.5, boxSizing: 'border-box', color: 'var(--text-primary)', background: 'var(--surface)' }}
            onFocus={e => { e.target.style.borderColor = '#475569'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(d => {
            const st = STATUS_MAP[d.status] ?? STATUS_MAP.assigned;
            return (
              <button key={d.id} onClick={() => router.push(`/driver/delivery/${d.id}`)}
                style={{ width: '100%', background: 'var(--surface)', borderRadius: 14, border: '1.5px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color .12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#475569'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(71,85,105,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={18} style={{ color: '#475569' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{d.customerName}</p>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{d.address}</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Package size={10} />{d.items} item</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{d.time}</span>
                    {d.distance && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Navigation size={10} />{d.distance}</span>}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 4, opacity: 0.5 }} />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Truck size={40} style={{ color: 'var(--border)', margin: '0 auto 8px', display: 'block' }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Tidak ada pengiriman</p>
            </div>
          )}
        </div>
      </div>
      <DriverBottomNav />
    </div>
  );
}

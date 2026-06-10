'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import DriverBottomNav from '@/components/DriverBottomNav';
import { Truck, MapPin, CheckCircle, Clock, Package, ChevronRight, Navigation, Bell } from 'lucide-react';

const C = '#475569';

interface Delivery {
  id: string; customerName: string; address: string; items: number;
  status: 'assigned' | 'on_the_way' | 'arrived' | 'delivered' | 'failed';
  time: string; distance?: string;
}

const STATUS_MAP = {
  assigned:   { label: 'Menunggu',         color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  on_the_way: { label: 'Dalam Perjalanan', color: '#3B82F6', bg: 'rgba(59,130,246,.12)' },
  arrived:    { label: 'Sudah Tiba',       color: '#8B5CF6', bg: 'rgba(139,92,246,.12)' },
  delivered:  { label: 'Selesai',          color: '#16A34A', bg: 'rgba(22,163,74,.12)' },
  failed:     { label: 'Gagal',            color: '#DC2626', bg: 'rgba(220,38,38,.12)' },
};

const DEMO: Delivery[] = [
  { id: 'DEL-001', customerName: 'PT Maju Sejahtera',  address: 'Jl. Sudirman No.45, Jakarta', items: 3, status: 'assigned',   time: '08:30', distance: '4.2 km' },
  { id: 'DEL-002', customerName: 'CV Berkah Jaya',      address: 'Jl. Thamrin No.12, Jakarta',  items: 5, status: 'on_the_way', time: '10:00', distance: '7.8 km' },
  { id: 'DEL-003', customerName: 'Toko Bangunan Sejuk', address: 'Jl. Gatot Subroto No.78',     items: 2, status: 'delivered',  time: '11:30', distance: '2.1 km' },
  { id: 'DEL-004', customerName: 'UD Subur Makmur',     address: 'Jl. HR Rasuna Said No.22',    items: 8, status: 'assigned',   time: '14:00', distance: '5.5 km' },
];

export default function DriverHomePage() {
  const { token, user } = useAuthStore();
  const router          = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading]       = useState(true);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    if (!token) { router.replace('/dashboard'); return; }
    api.get('/fleet/delivery/my-tasks')
      .then(r => setDeliveries(r.data ?? []))
      .catch(() => setDeliveries(DEMO))
      .finally(() => { setLoading(false); setTimeout(() => setMounted(true), 60); });
  }, [token]);

  if (!token || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-sunken)' }}>
      <svg style={{ width: 28, height: 28, animation: 'spin .8s linear infinite', color: C }} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <circle opacity=".2" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path opacity=".8" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
      </svg>
    </div>
  );

  const counts = {
    waiting: deliveries.filter(d => d.status === 'assigned').length,
    onWay:   deliveries.filter(d => d.status === 'on_the_way').length,
    done:    deliveries.filter(d => d.status === 'delivered').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-sunken)', paddingBottom: 80, opacity: mounted ? 1 : 0, transition: 'opacity .4s', fontFamily: 'Inter,sans-serif', maxWidth: 430, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,#334155,${C})`, padding: '20px 20px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', margin: '0 0 2px' }}>Selamat datang,</p>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{user?.name || 'Driver'} 👋</h1>
          </div>
          <button style={{ padding: 8, border: 'none', background: 'rgba(255,255,255,.15)', borderRadius: 10, cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <Bell size={18} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', margin: '0 0 14px' }}>Ada <strong style={{ color: '#fff' }}>{deliveries.filter(d => ['assigned','on_the_way','arrived'].includes(d.status)).length}</strong> pengiriman menunggu hari ini</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Menunggu',    value: counts.waiting, color: '#FDE68A' },
            { label: 'Dalam Jalan', value: counts.onWay,   color: '#BFDBFE' },
            { label: 'Selesai',     value: counts.done,    color: '#BBF7D0' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task card */}
      <div style={{ padding: '0 16px', marginTop: -48, position: 'relative' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: '0 8px 32px rgba(71,85,105,.12)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Tugas Hari Ini</h2>
            <button onClick={() => router.push('/driver/deliveries')} style={{ fontSize: 12, color: C, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>Lihat Semua</button>
          </div>

          {deliveries.slice(0, 4).map((d, i) => {
            const st = STATUS_MAP[d.status];
            return (
              <button key={d.id} onClick={() => router.push(`/driver/delivery/${d.id}`)}
                style={{ width: '100%', padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: i < Math.min(deliveries.length - 1, 3) ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={18} style={{ color: C }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{d.customerName}</p>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, color: st.color, background: st.bg, flexShrink: 0 }}>{st.label}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '0 0 5px', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {d.address}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Package size={10} /> {d.items} item</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {d.time}</span>
                    {d.distance && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Navigation size={10} /> {d.distance}</span>}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 4, opacity: 0.5 }} />
              </button>
            );
          })}

          {deliveries.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <CheckCircle size={36} style={{ color: '#BBF7D0', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Semua tugas selesai! 🎉</p>
            </div>
          )}
        </div>
      </div>
      <DriverBottomNav />
    </div>
  );
}

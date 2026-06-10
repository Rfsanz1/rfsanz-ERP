'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import DriverBottomNav from '@/components/DriverBottomNav';
import { Truck, MapPin, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

const C = '#475569';

const DEMO = [
  { id: 'DEL-099', customerName: 'PT Karya Abadi',     address: 'Jl. Raya Bekasi No.10',  items: 4, status: 'delivered', completedAt: '2024-01-14T16:45', distance: '8.3 km' },
  { id: 'DEL-098', customerName: 'CV Maju Terus',       address: 'Jl. Cempaka No.22',      items: 2, status: 'delivered', completedAt: '2024-01-13T11:20', distance: '3.1 km' },
  { id: 'DEL-097', customerName: 'Toko Makmur',         address: 'Jl. Pahlawan No.5',      items: 6, status: 'failed',    completedAt: '2024-01-12T14:30', distance: '5.7 km' },
  { id: 'DEL-096', customerName: 'PT Sejahtera Jaya',   address: 'Jl. Industri No.88',     items: 3, status: 'delivered', completedAt: '2024-01-11T09:15', distance: '12.4 km' },
  { id: 'DEL-095', customerName: 'UD Berkah Mandiri',   address: 'Jl. Melati No.33',       items: 7, status: 'delivered', completedAt: '2024-01-10T15:00', distance: '6.2 km' },
];

export default function DriverHistoryPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.replace('/dashboard'); return; }
    api.get('/fleet/delivery/history').then(r => setHistory(r.data?.data ?? r.data ?? [])).catch(() => setHistory(DEMO)).finally(() => setLoading(false));
  }, [token]);

  const doneCount = history.filter(d => d.status === 'delivered').length;
  const failCount = history.filter(d => d.status === 'failed').length;
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}><div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: C, animation: 'spin .7s linear infinite' }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: 80, maxWidth: 430, margin: '0 auto', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 30 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: 0 }}>Riwayat Pengiriman</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 16px 0' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 16, textAlign: 'center' }}>
          <CheckCircle size={22} style={{ color: '#22C55E', margin: '0 auto 6px', display: 'block' }} />
          <p style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', margin: '0 0 2px' }}>{doneCount}</p>
          <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }}>Selesai</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 16, textAlign: 'center' }}>
          <XCircle size={22} style={{ color: '#EF4444', margin: '0 auto 6px', display: 'block' }} />
          <p style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', margin: '0 0 2px' }}>{failCount}</p>
          <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }}>Gagal</p>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map(d => (
            <button key={d.id} onClick={() => router.push(`/driver/delivery/${d.id}`)}
              style={{ width: '100%', backgroundColor: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: d.status === 'delivered' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {d.status === 'delivered' ? <CheckCircle size={18} style={{ color: '#22C55E' }} /> : <XCircle size={18} style={{ color: '#EF4444' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#1E293B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.customerName}</p>
                <p style={{ fontSize: 11.5, color: '#64748B', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><MapPin size={10} />{d.address}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} />{formatDate(d.completedAt)}</span>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, color: d.status === 'delivered' ? '#16A34A' : '#DC2626', backgroundColor: d.status === 'delivered' ? 'rgba(22,163,74,.1)' : 'rgba(220,38,38,.1)', flexShrink: 0 }}>
                {d.status === 'delivered' ? 'Selesai' : 'Gagal'}
              </span>
            </button>
          ))}
          {history.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}><Truck size={40} style={{ color: '#E2E8F0', margin: '0 auto 8px', display: 'block' }} /><p style={{ fontSize: 14 }}>Belum ada riwayat</p></div>}
        </div>
      </div>
      <DriverBottomNav />
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { Search, CheckCircle, Package } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

interface PickingOrder { id: string; soNumber: string; customerName: string; itemCount: number; status: string; priority: string; dueTime: string; }

const DEMO: PickingOrder[] = [
  { id:'1', soNumber:'SO-2024-001', customerName:'PT Maju Sejahtera',    itemCount:5, status:'PENDING',     priority:'HIGH',   dueTime:'10:00' },
  { id:'2', soNumber:'SO-2024-002', customerName:'CV Berkah Jaya',       itemCount:3, status:'IN_PROGRESS', priority:'NORMAL', dueTime:'11:30' },
  { id:'3', soNumber:'SO-2024-003', customerName:'Toko Bangunan Sejuk',  itemCount:8, status:'COMPLETED',   priority:'NORMAL', dueTime:'09:00' },
  { id:'4', soNumber:'SO-2024-004', customerName:'UD Subur Makmur',      itemCount:2, status:'PENDING',     priority:'URGENT', dueTime:'08:30' },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label:'Menunggu',        color:'#F59E0B', bg:'rgba(245,158,11,.12)' },
  IN_PROGRESS: { label:'Sedang Dipicking',color:'#3B82F6', bg:'rgba(59,130,246,.12)' },
  COMPLETED:   { label:'Selesai',         color:'#16A34A', bg:'rgba(22,163,74,.12)' },
};

const PRIORITY_STYLE: Record<string, { label: string; color: string }> = {
  URGENT: { label:'URGENT', color:'#DC2626' },
  HIGH:   { label:'HIGH',   color:'#F59E0B' },
  NORMAL: { label:'NORMAL', color:'#6B7280' },
};

export default function PickingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PickingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/inventory/picking-orders').then(r => setOrders(r.data ?? [])).catch(() => setOrders(DEMO)).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o =>
    o.soNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GudangLayout title="Picking Order" subtitle="Persiapan barang untuk pengiriman">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>Picking Order</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: 0 }}>{orders.filter(o => o.status !== 'COMPLETED').length} order aktif</p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor SO / pelanggan…"
          style={{ width: '100%', height: 48, padding: '0 14px 0 42px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, boxSizing: 'border-box', color: C.dark, backgroundColor: '#fff' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(order => {
            const ss = STATUS_STYLE[order.status] ?? STATUS_STYLE.PENDING;
            const ps = PRIORITY_STYLE[order.priority] ?? PRIORITY_STYLE.NORMAL;
            return (
              <div key={order.id} onClick={() => router.push(`/gudang/picking/${order.id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${C.primary}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {order.status === 'COMPLETED' ? <CheckCircle size={20} style={{ color: '#16A34A' }} /> : <Package size={20} style={{ color: C.primary }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{order.soNumber}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ps.color }}>{ps.label}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 9px', borderRadius: 100, color: ss.color, backgroundColor: ss.bg }}>{ss.label}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.textMid, margin: '0 0 3px' }}>{order.customerName}</p>
                  <p style={{ fontSize: 12, color: C.textLight, margin: 0 }}>{order.itemCount} item · Deadline: {order.dueTime}</p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: C.textLight }}>Tidak ada picking order</div>}
        </div>
      )}
    </GudangLayout>
  );
}

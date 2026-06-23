'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { Search, RefreshCw } from 'lucide-react';
import { GudangSkeletonTableRows } from '@/components/ui/Skeletons';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Menunggu',     color: '#F59E0B' },
  packed:    { label: 'Dikemas',      color: '#3B82F6' },
  shipped:   { label: 'Dikirim',      color: '#8B5CF6' },
  delivered: { label: 'Terkirim',     color: '#22C55E' },
  cancelled: { label: 'Dibatalkan',   color: '#EF4444' },
};

const DEMO: any[] = [
  { id: 'out1', soNumber: 'SO-2024-001', customerName: 'PT Maju Sejahtera',  itemCount: 5, status: 'pending', createdAt: '2024-01-15', scheduledDate: '2024-01-17' },
  { id: 'out2', soNumber: 'SO-2024-002', customerName: 'CV Berkah Jaya',     itemCount: 3, status: 'packed',  createdAt: '2024-01-14', scheduledDate: '2024-01-16' },
  { id: 'out3', soNumber: 'SO-2024-003', customerName: 'Toko Bangunan',      itemCount: 8, status: 'shipped', createdAt: '2024-01-13', scheduledDate: '2024-01-15' },
];

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#9CA3AF' };
  return <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>;
}

export default function OutboundPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/outbound?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || (r.soNumber + (r.customerName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <GudangLayout title="Barang Keluar" subtitle="Pengiriman Sales Order">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>Barang Keluar</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: 0 }}>{filtered.length} pengiriman</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. SO / pelanggan…"
            style={{ width: '100%', height: 48, padding: '0 14px 0 42px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, boxSizing: 'border-box', color: C.dark, backgroundColor: '#fff' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ height: 48, padding: '0 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, cursor: 'pointer', color: C.textMid, backgroundColor: '#fff' }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 580 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}`, backgroundColor: C.bg }}>
                {['No. SO', 'Pelanggan', 'Tgl Dibuat', 'Tgl Kirim', 'Items', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <GudangSkeletonTableRows cols={7} count={6} />
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.textLight }}>Tidak ada data</td></tr>
              : filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFFBEB')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: C.primary }}>{r.soNumber}</td>
                  <td style={{ padding: '14px 16px', color: C.dark }}>{r.customerName}</td>
                  <td style={{ padding: '14px 16px', color: C.textMid }}>{formatDate(r.createdAt)}</td>
                  <td style={{ padding: '14px 16px', color: C.textMid }}>{formatDate(r.scheduledDate)}</td>
                  <td style={{ padding: '14px 16px', color: C.textMid }}>{r.itemCount} item</td>
                  <td style={{ padding: '14px 16px' }}><Badge status={r.status} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => router.push(`/gudang/outbound/${r.id}`)}
                      style={{ padding: '7px 14px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GudangLayout>
  );
}

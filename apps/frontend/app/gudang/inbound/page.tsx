'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { Search, RefreshCw } from 'lucide-react';
import { GudangSkeletonTableRows } from '@/components/ui/Skeletons';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  approved:  { label: 'Disetujui',          color: '#3B82F6' },
  partial:   { label: 'Sebagian Diterima',   color: '#F59E0B' },
  pending:   { label: 'Menunggu',            color: '#9CA3AF' },
  received:  { label: 'Diterima',            color: '#22C55E' },
  cancelled: { label: 'Dibatalkan',          color: '#EF4444' },
};

const DEMO: any[] = [
  { id: 'po1', poNumber: 'PO-2024-001', supplierName: 'PT Semen Gresik',    itemCount: 5,  totalQty: 200, status: 'approved', poDate: '2024-01-14', expectedDate: '2024-01-17' },
  { id: 'po2', poNumber: 'PO-2024-002', supplierName: 'CV Besi Baja Jaya',  itemCount: 3,  totalQty: 80,  status: 'partial',  poDate: '2024-01-13', expectedDate: '2024-01-16' },
  { id: 'po3', poNumber: 'PO-2024-003', supplierName: 'PT Cat Avian',       itemCount: 8,  totalQty: 150, status: 'approved', poDate: '2024-01-12', expectedDate: '2024-01-18' },
  { id: 'po4', poNumber: 'PO-2024-004', supplierName: 'UD Material Prima',  itemCount: 2,  totalQty: 40,  status: 'approved', poDate: '2024-01-11', expectedDate: '2024-01-15' },
];

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#9CA3AF' };
  return <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap' }}>{cfg.label}</span>;
}

export default function InboundPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/purchase-orders?status=approved,partial&limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || (r.poNumber + (r.supplierName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );

  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <GudangLayout title="Barang Masuk" subtitle="Penerimaan Purchase Order">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>Penerimaan Barang</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: 0 }}>{filtered.length} PO menunggu penerimaan</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. PO / supplier…"
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}`, backgroundColor: C.bg }}>
                {['No. PO', 'Supplier', 'Tgl PO', 'Exp. Tiba', 'Item', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <GudangSkeletonTableRows cols={7} count={6} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.textLight }}>Tidak ada data</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FFFBEB')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: C.primary }}>{r.poNumber}</td>
                  <td style={{ padding: '14px 16px', color: C.dark }}>{r.supplierName}</td>
                  <td style={{ padding: '14px 16px', color: C.textMid }}>{formatDate(r.poDate)}</td>
                  <td style={{ padding: '14px 16px', color: C.textMid }}>{formatDate(r.expectedDate)}</td>
                  <td style={{ padding: '14px 16px', color: C.textMid }}>{r.itemCount} item · {r.totalQty} unit</td>
                  <td style={{ padding: '14px 16px' }}><Badge status={r.status} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => router.push(`/gudang/inbound/${r.id}`)}
                      style={{ padding: '7px 14px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Proses
                    </button>
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

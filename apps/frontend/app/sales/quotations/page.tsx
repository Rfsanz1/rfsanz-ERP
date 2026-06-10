'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { FileText, Search, RefreshCw, Plus } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Draft',    color: '#9CA3AF' },
  sent:     { label: 'Terkirim', color: '#3B82F6' },
  accepted: { label: 'Diterima', color: '#22C55E' },
  rejected: { label: 'Ditolak',  color: '#EF4444' },
  expired:  { label: 'Expired',  color: '#F59E0B' },
};

const DEMO: any[] = [
  { id: 'q1', quoteNumber: 'QUO-2024-001', customerName: 'PT Maju Sejahtera',   totalAmount: 3250000, status: 'accepted', validUntil: '2024-02-15', createdAt: '2024-01-15', items: 5 },
  { id: 'q2', quoteNumber: 'QUO-2024-002', customerName: 'CV Berkah Jaya',       totalAmount: 1875000, status: 'sent',     validUntil: '2024-02-14', createdAt: '2024-01-14', items: 3 },
  { id: 'q3', quoteNumber: 'QUO-2024-003', customerName: 'Toko Bangunan Sejuk',  totalAmount: 950000,  status: 'draft',    validUntil: '2024-02-01', createdAt: '2024-01-13', items: 2 },
  { id: 'q4', quoteNumber: 'QUO-2024-004', customerName: 'UD Subur Makmur',      totalAmount: 5100000, status: 'rejected', validUntil: '2024-01-10', createdAt: '2024-01-05', items: 8 },
];

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#9CA3AF' };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>;
}

export default function QuotationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || (r.quoteNumber + (r.customerName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );
  const formatRp = (v: number) => `Rp ${Number(v).toLocaleString('id-ID')}`;
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <SalesLayout title="Quotation" subtitle="Penawaran harga ke pelanggan">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>Quotation</h2>
          <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>{rows.length} penawaran terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}><RefreshCw size={13} /></button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Quotation Baru
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. quotation / pelanggan…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 13, boxSizing: 'border-box', color: C.textDark }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 13, cursor: 'pointer', color: C.textMid }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
              {['No. Quotation', 'Pelanggan', 'Tanggal', 'Berlaku Hingga', 'Items', 'Total', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Memuat…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Tidak ada quotation</td></tr>
              : filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: C.primary }}>{r.quoteNumber}</td>
                  <td style={{ padding: '13px 16px', color: C.textDark }}>{r.customerName ?? '–'}</td>
                  <td style={{ padding: '13px 16px', color: C.textMid }}>{formatDate(r.createdAt)}</td>
                  <td style={{ padding: '13px 16px', color: C.textMid }}>{formatDate(r.validUntil)}</td>
                  <td style={{ padding: '13px 16px', color: C.textMid }}>{r.items ?? '–'} item</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: C.textDark }}>{formatRp(r.totalAmount ?? 0)}</td>
                  <td style={{ padding: '13px 16px' }}><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SalesLayout>
  );
}

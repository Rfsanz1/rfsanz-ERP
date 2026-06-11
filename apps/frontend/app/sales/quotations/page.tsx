'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Search, RefreshCw, Plus } from 'lucide-react';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Draf',      color: '#94A3B8' },
  sent:     { label: 'Terkirim',  color: '#3B82F6' },
  accepted: { label: 'Diterima',  color: '#22C55E' },
  rejected: { label: 'Ditolak',   color: '#EF4444' },
  expired:  { label: 'Kedaluarsa', color: '#F59E0B' },
};

const DEMO: any[] = [
  { id: 'q1', quoteNumber: 'QUO-2024-001', customerName: 'PT Maju Sejahtera',  totalAmount: 3250000, status: 'accepted', validUntil: '2024-02-15', createdAt: '2024-01-15', items: 5 },
  { id: 'q2', quoteNumber: 'QUO-2024-002', customerName: 'CV Berkah Jaya',      totalAmount: 1875000, status: 'sent',     validUntil: '2024-02-14', createdAt: '2024-01-14', items: 3 },
  { id: 'q3', quoteNumber: 'QUO-2024-003', customerName: 'Toko Bangunan Sejuk', totalAmount: 950000,  status: 'draft',    validUntil: '2024-02-01', createdAt: '2024-01-13', items: 2 },
  { id: 'q4', quoteNumber: 'QUO-2024-004', customerName: 'UD Subur Makmur',     totalAmount: 5100000, status: 'rejected', validUntil: '2024-01-10', createdAt: '2024-01-05', items: 8 },
];

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};

const fmtRp   = (v: number) => `Rp ${Number(v).toLocaleString('id-ID')}`;
const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

export default function QuotationsPage() {
  const [rows, setRows]                 = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
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

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Penawaran Harga</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{rows.length} penawaran terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Penawaran Baru
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. penawaran / pelanggan…"
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', background: 'var(--surface)' }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['No. Penawaran','Pelanggan','Tanggal','Berlaku Hingga','Item','Total','Status'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada penawaran</td></tr>
              ) : filtered.map(r => {
                const s = STATUS_CFG[r.status] ?? STATUS_CFG.draft;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#6366F1', fontSize: 11, fontFamily: 'monospace' }}>{r.quoteNumber}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{r.customerName ?? '–'}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.validUntil)}</td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{r.items ?? '–'} item</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{fmtRp(r.totalAmount ?? 0)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: s.color, background: s.color + '18', border: `1px solid ${s.color}30` }}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

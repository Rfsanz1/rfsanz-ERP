'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Search, RefreshCw, AlertTriangle } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  paid:      { label: 'Lunas',       color: '#22C55E' },
  unpaid:    { label: 'Belum Bayar', color: '#EF4444' },
  partial:   { label: 'Sebagian',    color: '#F59E0B' },
  overdue:   { label: 'Jatuh Tempo', color: '#DC2626' },
  draft:     { label: 'Draft',       color: '#9CA3AF' },
  cancelled: { label: 'Dibatalkan',  color: '#9CA3AF' },
};

const DEMO: any[] = [
  { id: 'i1', number: 'INV-2024-001', customerName: 'PT Maju Sejahtera',   totalAmount: 3250000, amountDue: 0,       status: 'paid',    dueDate: '2024-02-15', createdAt: '2024-01-15' },
  { id: 'i2', number: 'INV-2024-002', customerName: 'CV Berkah Jaya',       totalAmount: 1875000, amountDue: 1875000, status: 'unpaid',  dueDate: '2024-02-14', createdAt: '2024-01-14' },
  { id: 'i3', number: 'INV-2024-003', customerName: 'Toko Bangunan Sejuk', totalAmount: 950000,  amountDue: 450000,  status: 'partial', dueDate: '2024-02-01', createdAt: '2024-01-13' },
  { id: 'i4', number: 'INV-2024-004', customerName: 'UD Subur Makmur',      totalAmount: 5100000, amountDue: 5100000, status: 'overdue', dueDate: '2024-01-10', createdAt: '2024-01-05' },
];

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#9CA3AF' };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>;
}

export default function FakturPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoice/list?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || (r.number + (r.customerName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );

  const formatRp = (v: number) => `Rp ${Number(v).toLocaleString('id-ID')}`;
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';
  const totalOutstanding = filtered.reduce((s, r) => s + (r.amountDue ?? 0), 0);
  const overdueCount = filtered.filter(r => r.status === 'overdue').length;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>Faktur / Invoice</h2>
          <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>Pantau status pembayaran pelanggan</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Piutang',      value: formatRp(totalOutstanding),                                     color: '#EF4444', bg: '#FEF2F2' },
          { label: 'Invoice Jatuh Tempo', value: `${overdueCount} invoice`,                                    color: '#DC2626', bg: '#FFF1F2' },
          { label: 'Invoice Lunas',       value: `${filtered.filter(r => r.status === 'paid').length} invoice`, color: '#22C55E', bg: '#F0FDF4' },
          { label: 'Belum Bayar',         value: `${filtered.filter(r => r.status === 'unpaid').length} invoice`,color: '#F59E0B', bg: '#FFFBEB' },
        ].map(card => (
          <div key={card.label} style={{ backgroundColor: card.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${card.color}20` }}>
            <p style={{ fontSize: 11, color: card.color, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>{card.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {overdueCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, backgroundColor: '#FEF2F2', border: '1.5px solid rgba(239,68,68,.2)', marginBottom: 16 }}>
          <AlertTriangle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, margin: 0 }}>{overdueCount} invoice sudah melewati jatuh tempo. Segera lakukan penagihan.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. invoice / pelanggan…"
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
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
                {['No. Invoice', 'Pelanggan', 'Tanggal', 'Jatuh Tempo', 'Total', 'Sisa Bayar', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Memuat…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Tidak ada invoice</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: 'pointer', backgroundColor: r.status === 'overdue' ? 'rgba(239,68,68,.03)' : 'transparent', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = r.status === 'overdue' ? 'rgba(239,68,68,.07)' : '#F5F3FF')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = r.status === 'overdue' ? 'rgba(239,68,68,.03)' : 'transparent')}
                >
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: C.primary }}>{r.number ?? r.invoiceNumber}</td>
                  <td style={{ padding: '13px 16px', color: C.textDark }}>{r.customerName ?? r.customer?.name ?? '–'}</td>
                  <td style={{ padding: '13px 16px', color: C.textMid }}>{formatDate(r.createdAt)}</td>
                  <td style={{ padding: '13px 16px', color: r.status === 'overdue' ? '#DC2626' : C.textMid, fontWeight: r.status === 'overdue' ? 700 : 400 }}>{formatDate(r.dueDate)}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: C.textDark }}>{formatRp(r.totalAmount ?? r.total ?? 0)}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: (r.amountDue ?? 0) > 0 ? '#EF4444' : '#22C55E' }}>{formatRp(r.amountDue ?? 0)}</td>
                  <td style={{ padding: '13px 16px' }}><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, color: C.textLight, fontSize: 12 }}>
            {filtered.length} invoice · Total piutang: <strong style={{ color: '#EF4444' }}>{formatRp(totalOutstanding)}</strong>
          </div>
        )}
      </div>
    </>
  );
}

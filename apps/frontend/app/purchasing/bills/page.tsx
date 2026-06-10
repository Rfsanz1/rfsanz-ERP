'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { FileText, Plus, Search, RefreshCw, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';

const IDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:        { label: 'Draft',        color: '#78909C' },
  submitted:    { label: 'Dikirim',      color: '#1976D2' },
  approved:     { label: 'Diapprove',    color: '#388E3C' },
  partial_paid: { label: 'Bayar Sebag.', color: '#F57C00' },
  paid:         { label: 'Lunas',        color: '#2E7D32' },
  overdue:      { label: 'Jatuh Tempo',  color: '#C62828' },
  cancelled:    { label: 'Dibatalkan',   color: '#BDBDBD' },
};

export default function BillsPage() {
  const router = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [aging, setAging]     = useState<any>(null);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        api.get('/purchasing/bills', { params: { search, status, page, limit: 20 } }),
        api.get('/purchasing/bills/aging'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setAging(a.data.data ?? null);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, status, page]);

  const totalPages = Math.ceil(total / 20);

  const agingBuckets = aging ? [
    { key: 'current', label: 'Belum Jatuh Tempo', color: '#388E3C' },
    { key: 'd1_30',   label: '1–30 Hari',          color: '#F9A825' },
    { key: 'd31_60',  label: '31–60 Hari',          color: '#EF6C00' },
    { key: 'd61_90',  label: '61–90 Hari',          color: '#C62828' },
    { key: 'over90',  label: '>90 Hari',             color: '#6A1B9A' },
  ] : [];

  return (
    <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Vendor Bill (AP)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* AP Aging summary */}
        {aging && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {agingBuckets.map(b => (
              <div key={b.key} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{b.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: b.color }}>{IDR(aging[b.key]?.total ?? 0)}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{aging[b.key]?.items?.length ?? 0} tagihan</div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nomor bill…" style={{ width: '100%', paddingLeft: 32, paddingRight: 10, height: 36, borderRadius: 7, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ height: 36, borderRadius: 7, border: '1px solid #E0E0E0', padding: '0 10px', fontSize: 13, color: '#444' }}>
            <option value="">Semua Status</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={load} style={{ height: 36, width: 36, borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={14} /></button>
          <button onClick={() => router.push('/purchasing/bills/new')} style={{ height: 36, borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Buat Bill
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9F5F0' }}>
                {['No. Bill', 'Supplier', 'Total', 'Dibayar', 'Outstanding', 'Jatuh Tempo', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5D4037', letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Memuat data…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Belum ada vendor bill</td></tr>
              ) : data.map(bill => {
                const outstanding = Number(bill.totalAmount) - Number(bill.paidAmount ?? 0);
                const meta = STATUS_META[bill.status] ?? { label: bill.status, color: '#888' };
                return (
                  <tr key={bill.id} onClick={() => router.push(`/purchasing/bills/${bill.id}`)} style={{ cursor: 'pointer', borderTop: '1px solid #F3F3F3' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#5D4037' }}>{bill.noBill}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{bill.supplier?.name ?? '-'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{IDR(Number(bill.totalAmount))}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#388E3C' }}>{IDR(Number(bill.paidAmount ?? 0))}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: outstanding > 0 ? '#C62828' : '#388E3C' }}>{IDR(outstanding)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#888' }}>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('id-ID') : '-'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: meta.color + '22', color: meta.color }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={e => { e.stopPropagation(); window.open(`/api/purchasing/bills/${bill.id}/pdf`, '_blank'); }} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', color: '#5D4037' }}>PDF</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '14px 0', borderTop: '1px solid #F3F3F3' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E0E0E0', background: p === page ? '#5D4037' : '#fff', color: p === page ? '#fff' : '#444', cursor: 'pointer', fontSize: 12 }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { ShoppingCart, Search, RefreshCw, Plus, Eye } from 'lucide-react';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Draf',         color: '#94A3B8' },
  confirmed:  { label: 'Dikonfirmasi', color: '#3B82F6' },
  processing: { label: 'Diproses',     color: '#F59E0B' },
  shipped:    { label: 'Dikirim',      color: '#8B5CF6' },
  delivered:  { label: 'Terkirim',     color: '#10B981' },
  cancelled:  { label: 'Dibatalkan',   color: '#EF4444' },
};

const DEMO: any[] = [
  { id: 'so1', soNumber: 'SO-2024-001', customerName: 'PT Maju Sejahtera',   totalAmount: 3250000, status: 'confirmed',  items: 5, createdAt: '2024-01-15' },
  { id: 'so2', soNumber: 'SO-2024-002', customerName: 'CV Berkah Jaya',      totalAmount: 1875000, status: 'processing', items: 3, createdAt: '2024-01-14' },
  { id: 'so3', soNumber: 'SO-2024-003', customerName: 'Toko Bangunan Sejuk', totalAmount: 950000,  status: 'shipped',    items: 2, createdAt: '2024-01-13' },
  { id: 'so4', soNumber: 'SO-2024-004', customerName: 'UD Subur Makmur',     totalAmount: 5100000, status: 'delivered',  items: 8, createdAt: '2024-01-12' },
  { id: 'so5', soNumber: 'SO-2024-005', customerName: 'PT Karya Abadi',      totalAmount: 2300000, status: 'draft',      items: 4, createdAt: '2024-01-11' },
];

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#94A3B8' };
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: cfg.color, background: cfg.color + '1A' }}>{cfg.label}</span>;
}

const btn = (primary = false): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
  border: primary ? 'none' : '1px solid var(--border)',
  background: primary ? '#6366F1' : 'var(--surface)',
  color: primary ? '#fff' : 'var(--text-secondary)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
});

export default function SalesOrdersPage() {
  const router = useRouter();
  const [rows, setRows]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || ((r.soNumber ?? '') + (r.namaCustomer ?? r.customerName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );

  const fmtRp   = (v: number) => `Rp ${Number(v).toLocaleString('id-ID')}`;
  const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <SalesLayout title="Sales Order" subtitle="Kelola pesanan pelanggan">

      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Sales Order
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{rows.length} order terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} style={btn()}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => router.push('/sales/smart-order')} style={btn(true)}>
            <Plus size={14} /> Order Baru
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. order / pelanggan…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', background: 'var(--surface-sunken)' }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['No. Order', 'Pelanggan', 'Tanggal', 'Item', 'Total', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada order ditemukan</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: '#6366F1', fontSize: 12 }}>{r.soNumber ?? r.orderNumber}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.namaCustomer ?? r.customerName ?? r.customer?.name ?? '–'}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-muted)' }}>{r.items ?? r.itemCount ?? '–'} item</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtRp(r.totalAmount ?? r.total ?? 0)}</td>
                  <td style={{ padding: '13px 16px' }}><Badge status={r.status} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => router.push(`/sales/orders/${r.id}`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: '#6366F1', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      <Eye size={12} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
            Menampilkan {filtered.length} order
          </div>
        )}
      </div>
    </SalesLayout>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, RefreshCw, Plus, Eye, Link2 } from 'lucide-react';

const C = '#00ACC1';
const PURPLE = '#6366F1';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',      color: '#F59E0B' },
  draft:      { label: 'Draf',         color: '#94A3B8' },
  confirmed:  { label: 'Dikonfirmasi', color: '#3B82F6' },
  processing: { label: 'Diproses',     color: '#8B5CF6' },
  shipped:    { label: 'Dikirim',      color: '#06B6D4' },
  delivered:  { label: 'Terkirim',     color: '#22C55E' },
  cancelled:  { label: 'Dibatalkan',   color: '#EF4444' },
};

const fmtRp   = (v: number) => `Rp ${Number(v ?? 0).toLocaleString('id-ID')}`;
const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#94A3B8' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: cfg.color, background: cfg.color + '1A', border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

export default function SalesOrdersPage() {
  const router = useRouter();
  const [rows, setRows]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [source, setSource]       = useState<'local' | 'kledo'>('local');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      /* Coba endpoint lokal dulu */
      const params: any = { limit: 30, page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/orders', { params });
      const data = res.data?.data ?? res.data?.items ?? res.data;
      if (Array.isArray(data) && data.length > 0) {
        setRows(data);
        setTotal(res.data?.meta?.total ?? res.data?.total ?? data.length);
        setSource('local');
      } else {
        throw new Error('no local data');
      }
    } catch {
      /* Fallback: ambil dari Kledo invoices (invoice = sales order di Kledo) */
      try {
        const kRes = await api.get('/kledo/invoices', { params: { per_page: 50 } });
        const d = kRes.data;
        const inner = d?.data ?? d;
        const list: any[] = Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
        const mapped = list.map((inv: any) => ({
          id: `kledo-${inv.id}`,
          soNumber: inv.ref_number ?? `INV-${inv.id}`,
          namaCustomer: inv.contact?.name ?? inv.contact_name ?? '–',
          totalHarga: Number(inv.amount ?? inv.total ?? 0),
          status: inv.status ?? 'draft',
          createdAt: inv.trans_date,
          source: 'kledo',
          kledoId: inv.id,
        }));
        setRows(mapped);
        setTotal(inner?.total ?? mapped.length);
        setSource('kledo');
      } catch { setRows([]); setTotal(0); }
    } finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!search || ((r.soNumber ?? '') + (r.namaCustomer ?? r.customerName ?? '')).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Sales Order
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {total} order terdaftar
            {source === 'kledo' && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: PURPLE }}>
                <Link2 size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                dari Kledo
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => router.push('/sales/smart-order')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: C, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Order Baru
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari no. order / pelanggan…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', background: 'var(--surface-sunken)' }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['No. Order', 'Pelanggan', 'Tanggal', 'Total', 'Status', 'Sumber', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada order ditemukan</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => router.push(`/sales/orders/${r.id}`)}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: C, fontSize: 12, fontFamily: 'monospace' }}>{r.soNumber ?? r.orderNumber ?? `#${r.id}`}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.namaCustomer ?? r.customerName ?? r.customer?.name ?? '–'}</td>
                  <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.createdAt ?? r.tanggal)}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtRp(r.totalHarga ?? r.totalAmount ?? r.amount ?? 0)}</td>
                  <td style={{ padding: '13px 16px' }}><Badge status={r.status} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    {r.source === 'kledo' || r.kledoInvoiceId ? (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: PURPLE, background: PURPLE + '12' }}>
                        <Link2 size={9} style={{ display: 'inline', marginRight: 3 }} />Kledo
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: C, background: C + '12' }}>ERP</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => router.push(`/sales/orders/${r.id}`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: C, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      <Eye size={12} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Menampilkan {filtered.length} dari {total} order</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
            <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={rows.length < 30}
              style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', cursor: 'pointer', opacity: rows.length < 30 ? 0.4 : 1 }}>→</button>
          </div>
        </div>
      </div>
    </>
  );
}

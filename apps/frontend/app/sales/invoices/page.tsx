'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { api } from '@/lib/api';
import { Plus, Search, RefreshCw, BarChart2 } from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draf',      color: '#94A3B8' },
  sent:      { label: 'Terkirim',  color: '#3B82F6' },
  partial:   { label: 'Sebagian',  color: '#F59E0B' },
  paid:      { label: 'Lunas',     color: '#10B981' },
  overdue:   { label: 'Jatuh Tempo', color: '#EF4444' },
  cancelled: { label: 'Batal',     color: '#6B7280' },
};

const STATUS_FILTERS = [
  { value: '', label: 'Semua' }, { value: 'draft', label: 'Draf' },
  { value: 'sent', label: 'Terkirim' }, { value: 'partial', label: 'Sebagian' },
  { value: 'paid', label: 'Lunas' }, { value: 'overdue', label: 'Jatuh Tempo' },
];

const fmt = (v: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v ?? 0));
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};

export default function InvoicesPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [data, setData]     = useState<any[]>([]);
  const [stats, setStats]   = useState<any>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { search, page, limit: 20 };
      if (status) params.status = status;
      const [r, s] = await Promise.all([
        api.get('/invoices', { params }),
        api.get('/invoices/stats'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.meta?.total ?? 0);
      setStats(s.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [search, page, status, token]);


  return (
    <AppShell>
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Invoice</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manajemen piutang &amp; penagihan pelanggan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/sales/invoices/aging')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <BarChart2 size={14} /> Aging
            </button>
            <button onClick={() => router.push('/sales/invoices/new')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Buat Invoice
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Total',      value: stats.total,   accent: 'var(--text-primary)' },
              { label: 'Draf',       value: stats.draft,   accent: '#94A3B8' },
              { label: 'Terkirim',   value: stats.sent,    accent: '#3B82F6' },
              { label: 'Sebagian',   value: stats.partial, accent: '#F59E0B' },
              { label: 'Lunas',      value: stats.paid,    accent: '#10B981' },
              { label: 'Jatuh Tempo',value: stats.overdue, accent: '#EF4444' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.accent, margin: '5px 0 0', letterSpacing: '-0.02em' }}>{s.value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: status === f.value ? 'var(--surface)' : 'transparent',
                  color: status === f.value ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: status === f.value ? 'var(--shadow-xs)' : 'none' }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              placeholder="Cari no. invoice atau pelanggan…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={load}
            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['No. Invoice','Pelanggan','Tanggal','Jatuh Tempo','Total','Dibayar','Status',''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada invoice</td></tr>
                ) : data.map(inv => {
                  const s = STATUS[inv.status] ?? STATUS.draft;
                  const overdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'paid';
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => router.push(`/sales/invoices/${inv.id}`)}>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: '#6366F1', fontSize: 11, fontFamily: 'monospace' }}>{inv.noInvoice}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{inv.customer?.name ?? '–'}</td>
                      <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(inv.tanggal)}</td>
                      <td style={{ padding: '13px 16px', color: overdue ? '#EF4444' : 'var(--text-muted)', fontSize: 12, fontWeight: overdue ? 600 : 400 }}>{fmtDate(inv.dueDate)}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{fmt(inv.grandTotal)}</td>
                      <td style={{ padding: '13px 16px', color: '#10B981', fontSize: 13, fontWeight: 500 }}>{fmt(inv.paidAmount)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: s.color, background: s.color + '1A' }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#6366F1', fontSize: 13 }}
                        onClick={e => { e.stopPropagation(); router.push(`/sales/invoices/${inv.id}`); }}>→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total} invoice</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
              <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={data.length < 20}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: data.length < 20 ? 0.4 : 1 }}>→</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

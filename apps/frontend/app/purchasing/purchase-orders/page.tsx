'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Truck, Plus, Search, RefreshCw, CheckCircle, DollarSign, Package, FileText } from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draf',       color: '#94A3B8' },
  approved:  { label: 'Disetujui',  color: '#10B981' },
  received:  { label: 'Diterima',   color: '#3B82F6' },
  cancelled: { label: 'Dibatalkan', color: '#EF4444' },
};

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/purchasing/purchase-orders', { params: { search, status, page, limit: 20 } }),
        api.get('/purchasing/stats'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setStats(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, status, page]);

  const approve = async (id: string) => {
    try { await api.post(`/purchasing/purchase-orders/${id}/approve`); load(); }
    catch (e: any) { alert(e.response?.data?.message || 'Gagal menyetujui PO'); }
  };

  const fmtRp = (v: number) => Number(v || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
  };

  return (
    <ModernLayout>
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Purchase Order</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manajemen pembelian &amp; persetujuan PO</p>
          </div>
          <button onClick={() => router.push('/purchasing/purchase-orders/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat PO
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Total PO',    value: stats.total,   icon: FileText,  accent: '#6366F1' },
              { label: 'Draf',        value: stats.pending, icon: Package,   accent: '#94A3B8' },
              { label: 'Disetujui',   value: stats.approved,icon: CheckCircle,accent: '#10B981'},
              { label: 'Total Nilai', value: fmtRp(stats.totalValue), icon: DollarSign, accent: '#F59E0B', small: true },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={card}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={16} style={{ color: s.accent }} strokeWidth={2} />
                  </div>
                  <p style={{ fontSize: s.small ? 15 : 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '5px 0 0' }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nomor PO…" />
            </div>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>No. PO</th>
                  <th style={thStyle}>Supplier</th>
                  <th style={thStyle}>Tanggal</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada Purchase Order</td></tr>
                ) : data.map(po => {
                  const st = STATUS[po.status] ?? { label: po.status, color: '#94A3B8' };
                  return (
                    <tr key={po.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#6366F1' }}>{po.noPo}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{po.supplier?.name || '–'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{new Date(po.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtRp(po.totalHarga)}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: st.color, background: st.color + '1A' }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        {po.status === 'draft' && (
                          <button onClick={() => approve(po.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <CheckCircle size={12} /> Setujui
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total} PO</span>
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
    </ModernLayout>
  );
}

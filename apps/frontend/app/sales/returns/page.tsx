'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { api } from '@/lib/api';
import { RotateCcw, Plus, RefreshCw, CheckCircle, X } from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draf',        color: '#94A3B8' },
  validated: { label: 'Divalidasi',  color: '#10B981' },
  cancelled: { label: 'Dibatalkan',  color: '#EF4444' },
};

const fmt     = (v: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v ?? 0));
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function SalesReturnsPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [data, setData]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ customerId: '', reason: '', noReturn: '', totalAmount: 0 });
  const [customers, setCustomers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg]           = useState('');
  const [msgErr, setMsgErr]     = useState(false);


  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (status) params.status = status;
      const r = await api.get('/sales/returns', { params });
      setData(r.data.data ?? []);
      setTotal(r.data.meta?.total ?? 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token, page, status]);
  useEffect(() => {
    if (!token) return;
    api.get('/customers', { params: { limit: 200 } }).then(r => setCustomers(r.data.data ?? [])).catch(() => {});
  }, [token]);

  const validate = async (id: string) => {
    try {
      await api.post(`/sales/returns/${id}/validate`);
      setMsg('Return berhasil divalidasi, stok dikembalikan'); setMsgErr(false);
      load();
    } catch (e: any) { setMsg(e?.response?.data?.message ?? 'Gagal validasi'); setMsgErr(true); }
  };

  const createReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/sales/returns', form);
      setShowForm(false);
      setForm({ customerId: '', reason: '', noReturn: '', totalAmount: 0 });
      setMsg('Retur berhasil dibuat'); setMsgErr(false);
      load();
    } catch (err: any) { setMsg(err?.response?.data?.message ?? 'Gagal membuat retur'); setMsgErr(true); }
    finally { setCreating(false); }
  };

  if (!token) return null;

  return (
    <AppShell>
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Retur Penjualan</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola pengembalian barang dari pelanggan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowForm(!showForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Buat Retur
            </button>
          </div>
        </div>

        {/* Message */}
        {msg && (
          <div className="flex items-center justify-between" style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: msgErr ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${msgErr ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            color: msgErr ? '#991B1B' : '#065F46' }}>
            <span>{msg}</span>
            <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={14} style={{ color: '#6366F1' }} /> Form Retur Penjualan
            </h3>
            <form onSubmit={createReturn} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Pelanggan *</label>
                <select style={inputStyle} value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Total Retur (Rp)</label>
                <input type="number" style={inputStyle} min={0} value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: Number(e.target.value) }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Alasan Retur</label>
                <textarea style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Alasan pengembalian barang…" />
              </div>
              <div style={{ gridColumn: '1 / -1' }} className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={creating} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Menyimpan…' : 'Simpan Retur'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
            {[{ v: '', l: 'Semua' }, { v: 'draft', l: 'Draf' }, { v: 'validated', l: 'Divalidasi' }].map(f => (
              <button key={f.v} onClick={() => { setStatus(f.v); setPage(1); }}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: status === f.v ? 'var(--surface)' : 'transparent',
                  color: status === f.v ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: status === f.v ? 'var(--shadow-xs)' : 'none' }}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['No. Retur','Pelanggan','Alasan','Total','Status','Tanggal','Aksi'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada data retur</td></tr>
                ) : data.map(r => {
                  const s = STATUS[r.status] ?? STATUS.draft;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#6366F1', fontSize: 11, fontFamily: 'monospace' }}>{r.noReturn}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{r.customer?.name ?? '–'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '–'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{fmt(r.totalAmount)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: s.color, background: s.color + '1A' }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.status === 'draft' && (
                          <button onClick={() => validate(r.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,.10)', color: '#065F46', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            <CheckCircle size={12} /> Validasi
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
            <span>Total: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={data.length < 20}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: data.length < 20 ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

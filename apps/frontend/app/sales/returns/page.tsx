'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { api } from '@/lib/api';
import { RotateCcw, Plus, Search, RefreshCw, CheckCircle } from 'lucide-react';

const C = '#00ACC1';

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',      color: '#9E9E9E', bg: 'rgba(158,158,158,.12)' },
  validated: { label: 'Divalidasi', color: '#4CAF50', bg: 'rgba(76,175,80,.12)' },
  cancelled: { label: 'Dibatalkan', color: '#F44336', bg: 'rgba(244,67,54,.12)' },
};

const fmt = (v: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v ?? 0));
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

export default function SalesReturnsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', reason: '', noReturn: '', totalAmount: 0 });
  const [customers, setCustomers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

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
      setMsg('Return berhasil divalidasi, stok dikembalikan');
      load();
    } catch (e: any) { setMsg(e?.response?.data?.message ?? 'Gagal validasi'); }
  };

  const createReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/sales/returns', form);
      setShowForm(false);
      setForm({ customerId: '', reason: '', noReturn: '', totalAmount: 0 });
      setMsg('Retur berhasil dibuat');
      load();
    } catch (err: any) { setMsg(err?.response?.data?.message ?? 'Gagal membuat retur'); } finally { setCreating(false); }
  };

  if (!token) return null;

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm outline-none';
  const inputStyle = { border: '1px solid #EDE8F5', color: '#1E1B4B', backgroundColor: '#FDFCFF' };

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Retur Penjualan</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola pengembalian barang dari pelanggan</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Retur
          </button>
        </div>

        {msg && (
          <div className="rounded-xl p-3 text-sm flex items-center justify-between" style={{ backgroundColor: 'rgba(76,175,80,.08)', color: '#4CAF50', border: '1px solid rgba(76,175,80,.2)' }}>
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-lg leading-none">×</button>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Form Retur Penjualan</h3>
            <form onSubmit={createReturn} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Pelanggan*</label>
                <select className={inputCls} style={inputStyle} value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Total Retur (Rp)</label>
                <input type="number" className={inputCls} style={inputStyle} value={form.totalAmount} min={0} onChange={e => setForm(f => ({ ...f, totalAmount: Number(e.target.value) }))} />
              </div>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Alasan Retur</label>
                <textarea className={inputCls} style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Alasan pengembalian barang..." />
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }}>Batal</button>
                <button type="submit" disabled={creating} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: C }}>
                  {creating ? 'Menyimpan...' : 'Simpan Retur'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F5F2FB' }}>
            {[{ v: '', l: 'Semua' }, { v: 'draft', l: 'Draft' }, { v: 'validated', l: 'Divalidasi' }].map(f => (
              <button key={f.v} onClick={() => { setStatus(f.v); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                style={status === f.v ? { backgroundColor: 'white', color: '#1E1B4B', boxShadow: '0 1px 3px rgba(47,43,61,.1)' } : { color: '#9CA3AF' }}>
                {f.l}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF', backgroundColor: 'white' }}><RefreshCw className="h-4 w-4" /></button>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#FDFCFF' }}>
                  {['No. Return', 'Pelanggan', 'Alasan', 'Total', 'Status', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-14 text-center text-sm" style={{ color: '#9CA3AF' }}>Belum ada data retur</td></tr>
                ) : data.map((r, i) => {
                  const s = STATUS[r.status] ?? STATUS.draft;
                  return (
                    <tr key={r.id} style={{ borderBottom: i < data.length - 1 ? '1px solid #F5F2FB' : 'none' }}>
                      <td className="px-5 py-3.5 text-xs font-mono font-semibold" style={{ color: C }}>{r.noReturn}</td>
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{r.customer?.name ?? '–'}</td>
                      <td className="px-5 py-3.5 text-xs max-w-48 truncate" style={{ color: '#9CA3AF' }}>{r.reason || '–'}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{fmt(r.totalAmount)}</td>
                      <td className="px-5 py-3.5"><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span></td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{fmtDate(r.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        {r.status === 'draft' && (
                          <button onClick={() => validate(r.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#4CAF50' }}>
                            <CheckCircle className="h-3.5 w-3.5" /> Validasi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #EDE8F5' }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Total: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg text-xs disabled:opacity-40" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}>← Prev</button>
              <span className="px-3 py-1 text-xs" style={{ color: '#1E1B4B' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={data.length < 20} className="px-3 py-1 rounded-lg text-xs disabled:opacity-40" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B' }}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

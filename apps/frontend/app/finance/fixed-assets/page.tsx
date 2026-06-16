'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Building2, Plus, Search, RefreshCw, X, TrendingDown, Play } from 'lucide-react';
import { api } from '../../../lib/api';

const C = ACCOUNTING_CONFIG.appColor;
const fmt = (v: number) => Number(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const DEPRECIATION_METHODS = ['STRAIGHT_LINE', 'DECLINING_BALANCE', 'SUM_OF_YEARS'];
const METHOD_LABELS: Record<string, string> = { STRAIGHT_LINE: 'Garis Lurus', DECLINING_BALANCE: 'Saldo Menurun', SUM_OF_YEARS: 'Angka Tahun' };
const ASSET_CATEGORIES = ['Tanah & Bangunan', 'Mesin & Peralatan', 'Kendaraan', 'Inventaris Kantor', 'Peralatan IT', 'Aset Tidak Berwujud'];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:     { label: 'Aktif',     color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  DISPOSED:   { label: 'Dilepas',   color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  IN_REPAIR:  { label: 'Perbaikan', color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  active:     { label: 'Aktif',     color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  disposed:   { label: 'Dilepas',   color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
};

export default function FixedAssetsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningDep, setRunningDep] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: '', category: '', acquisitionValue: '', usefulLife: '', method: 'STRAIGHT_LINE',
    acquisitionDate: '', assetAccountId: '', depAccountId: '', description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get('/assets', { params });
      setAssets(data.data ?? data ?? []);
    } catch { setAssets([]); }
    finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { if (token) load(); }, [load, token]);


  const totalValue       = assets.reduce((s, a) => s + Number(a.acquisitionValue ?? a.acquisition_value ?? 0), 0);
  const totalDepreciation = assets.reduce((s, a) => s + Number(a.accumulatedDepreciation ?? a.accumulated_depreciation ?? 0), 0);
  const totalBookValue   = assets.reduce((s, a) => s + Number(a.bookValue ?? a.book_value ?? 0), 0);

  const submitAsset = async () => {
    setSubmitting(true);
    try {
      await api.post('/assets', {
        name: form.name,
        category: form.category,
        acquisitionValue: Number(form.acquisitionValue),
        usefulLife: Number(form.usefulLife),
        method: form.method,
        acquisitionDate: form.acquisitionDate,
        assetAccountId: form.assetAccountId || undefined,
        depAccountId: form.depAccountId || undefined,
        description: form.description,
      });
      setMsg({ type: 'success', text: 'Aset berhasil ditambahkan' });
      setShowForm(false);
      load();
    } catch (e: any) { setMsg({ type: 'error', text: e?.response?.data?.message || 'Gagal menambah aset' }); }
    finally { setSubmitting(false); }
  };

  const runDepreciation = async () => {
    setRunningDep(true);
    try {
      const now = new Date();
      await api.post('/assets/depreciation/run', { month: now.getMonth() + 1, year: now.getFullYear() });
      setMsg({ type: 'success', text: 'Depresiasi bulanan berhasil dijalankan' });
      load();
    } catch (e: any) { setMsg({ type: 'error', text: e?.response?.data?.message || 'Gagal menjalankan depresiasi' }); }
    finally { setRunningDep(false); }
  };

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV}>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Aset Tetap</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola aset tetap, depresiasi, dan nilai buku</p>
          </div>
          <div className="flex gap-2">
            <button onClick={runDepreciation} disabled={runningDep} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280', opacity: runningDep ? .6 : 1 }}>
              {runningDep ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run Depresiasi
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
              <Plus className="h-4 w-4" /> Tambah Aset
            </button>
          </div>
        </div>

        {msg && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ background: msg.type === 'success' ? 'rgba(76,175,80,.1)' : 'rgba(244,67,54,.1)', border: `1px solid ${msg.type === 'success' ? '#4CAF50' : '#f44336'}`, color: msg.type === 'success' ? '#2e7d32' : '#c62828' }}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Nilai Perolehan',       value: fmt(totalValue),        color: C },
            { label: 'Total Akumulasi Depresiasi',  value: fmt(totalDepreciation), color: '#FF9800' },
            { label: 'Total Nilai Buku',             value: fmt(totalBookValue),    color: '#4CAF50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari aset..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Semua Kategori</option>
              {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={load} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer' }}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} style={{ color: '#9CA3AF' }} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Memuat data aset tetap...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                    {['Kode', 'Nama Aset', 'Kategori', 'Tgl Perolehan', 'Nilai Perolehan', 'Metode', 'Umur (Th)', 'Akum. Depresiasi', 'Nilai Buku', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => {
                    const acqVal  = Number(a.acquisitionValue ?? a.acquisition_value ?? 0);
                    const accDep  = Number(a.accumulatedDepreciation ?? a.accumulated_depreciation ?? 0);
                    const bv      = Number(a.bookValue ?? a.book_value ?? acqVal - accDep);
                    const depPct  = acqVal > 0 ? Math.round(accDep / acqVal * 100) : 0;
                    const statusKey = a.status ?? 'ACTIVE';
                    const s = STATUS_MAP[statusKey] ?? STATUS_MAP.ACTIVE;
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-xs" style={{ color: C }}>{a.code}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{a.name}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{a.category}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{a.acquisitionDate ? new Date(a.acquisitionDate).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#1E1B4B' }}>{fmt(acqVal)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{METHOD_LABELS[a.method ?? ''] ?? a.method}</td>
                        <td className="px-4 py-3 text-xs text-center" style={{ color: '#6B7280' }}>{a.usefulLife ?? a.useful_life}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold" style={{ color: '#FF9800' }}>{fmt(accDep)}</p>
                          <div className="h-1.5 w-20 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(depPct, 100)}%`, backgroundColor: '#FF9800' }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#4CAF50' }}>{fmt(bv)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {assets.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Belum ada data aset tetap</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-y-auto" style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Aset Tetap</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'name', label: 'Nama Aset *', placeholder: 'Nama aset tetap...' },
                  { key: 'acquisitionValue', label: 'Nilai Perolehan (Rp)', placeholder: '0', type: 'number' },
                  { key: 'acquisitionDate', label: 'Tanggal Perolehan', placeholder: '', type: 'date' },
                  { key: 'usefulLife', label: 'Umur Ekonomis (Tahun)', placeholder: '5', type: 'number' },
                  { key: 'assetAccountId', label: 'Akun Aset (ID)', placeholder: 'ID Akun aset...' },
                  { key: 'depAccountId', label: 'Akun Depresiasi (ID)', placeholder: 'ID Akun depresiasi...' },
                  { key: 'description', label: 'Keterangan', placeholder: 'Keterangan tambahan...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Kategori</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      <option value="">Pilih kategori...</option>
                      {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Metode Depresiasi</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                      {DEPRECIATION_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={submitAsset} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C, opacity: submitting ? .7 : 1 }}>
                    <Plus className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan Aset'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

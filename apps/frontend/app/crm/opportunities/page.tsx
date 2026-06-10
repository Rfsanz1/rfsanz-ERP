'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { TrendingUp, Plus, Search, RefreshCw, X, DollarSign, Calendar, User } from 'lucide-react';

const STAGES = ['Prospek', 'Kualifikasi', 'Penawaran', 'Negosiasi', 'Menang', 'Kalah'];
const C = CRM_CONFIG.appColor;

const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
  'Prospek':    { color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  'Kualifikasi':{ color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  'Penawaran':  { color: '#9C27B0', bg: 'rgba(156,39,176,.1)' },
  'Negosiasi':  { color: '#FF5722', bg: 'rgba(255,87,34,.1)' },
  'Menang':     { color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  'Kalah':      { color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
};

export default function OpportunitiesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', customer: '', stage: 'Prospek', probability: 20,
    expected_revenue: '', deadline: '', salesperson: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/crm/leads', { params: { search, page: 1, limit: 50 } });
      setItems(r.data.data ?? r.data ?? []);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [search, stage, token]);

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/crm/leads', form);
      setShowForm(false);
      load();
    } catch {} finally { setSaving(false); }
  };

  const totalRevenue = items.reduce((s, i) => s + Number(i.expectedRevenue ?? 0), 0);
  const won = items.filter(i => i.stage === 'Menang').length;
  const winRate = items.length > 0 ? Math.round(won / items.length * 100) : 0;

  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/opportunities">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Opportunity</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola peluang penjualan dan pipeline CRM</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Opportunity
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Opportunity', value: items.length, color: C },
            { label: 'Expected Revenue', value: totalRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }), color: '#4CAF50' },
            { label: 'Menang', value: won, color: '#4CAF50' },
            { label: 'Win Rate', value: `${winRate}%`, color: '#FF9800' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari opportunity..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={stage} onChange={e => setStage(e.target.value)}>
              <option value="">Semua Stage</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={load} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }}><RefreshCw className="h-4 w-4" /></button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                    {['Opportunity', 'Pelanggan', 'Stage', 'Prob.', 'Expected Revenue', 'Deadline', 'Salesperson'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Belum ada opportunity</td></tr>
                  ) : items.map((item) => {
                    const sc = STAGE_COLORS[item.stage] ?? STAGE_COLORS['Prospek'];
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{item.name ?? item.title ?? '-'}</td>
                        <td className="px-6 py-3" style={{ color: '#6B7280' }}>{item.customerName ?? item.customer ?? '-'}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: sc.color, backgroundColor: sc.bg }}>{item.stage ?? 'Prospek'}</span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                              <div className="h-full rounded-full" style={{ width: `${item.probability ?? 20}%`, backgroundColor: C }} />
                            </div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>{item.probability ?? 20}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{Number(item.expectedRevenue ?? 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</td>
                        <td className="px-6 py-3" style={{ color: '#6B7280' }}>{item.deadline ? new Date(item.deadline).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="px-6 py-3" style={{ color: '#6B7280' }}>{item.salesperson ?? '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Opportunity</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'name', label: 'Nama Opportunity *', placeholder: 'Proyek / deal...' },
                  { key: 'customer', label: 'Pelanggan', placeholder: 'Nama perusahaan...' },
                  { key: 'salesperson', label: 'Salesperson', placeholder: 'Nama sales...' },
                  { key: 'expected_revenue', label: 'Expected Revenue (Rp)', placeholder: '0', type: 'number' },
                  { key: 'deadline', label: 'Deadline', placeholder: '', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Stage</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Probabilitas (%)</label>
                    <input type="number" min={0} max={100} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: +e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Catatan</label>
                  <textarea className="w-full rounded-lg px-4 py-2.5 text-sm resize-none" rows={3} style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Catatan opportunity..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {saving ? 'Menyimpan...' : 'Simpan'}
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

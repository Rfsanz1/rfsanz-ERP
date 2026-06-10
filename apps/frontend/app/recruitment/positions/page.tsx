'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { RECRUITMENT_CONFIG, RECRUITMENT_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Briefcase, Plus, Search, X, Users, MapPin, RefreshCw } from 'lucide-react';

const C = RECRUITMENT_CONFIG.appColor;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  open:     { label: 'Dibuka',    color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  closed:   { label: 'Ditutup',  color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  on_hold:  { label: 'Ditahan',  color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
};

export default function RecruitmentPositionsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', location: '', type: 'Full-time', quota: '1', salary_min: '', salary_max: '', requirements: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const SAMPLE = [
    { id: 1, title: 'Staff Produksi', department: 'Operasional', location: 'Jakarta', type: 'Full-time', quota: 3, applicants: 12, status: 'open', posted: '2025-06-01', salary_range: 'Rp 4.5jt - 5.5jt' },
    { id: 2, title: 'Sales Executive', department: 'Sales', location: 'Jakarta / Jabar', type: 'Full-time', quota: 2, applicants: 28, status: 'open', posted: '2025-06-10', salary_range: 'Rp 5jt - 7jt + Komisi' },
    { id: 3, title: 'Staff Akuntansi', department: 'Keuangan', location: 'Jakarta', type: 'Full-time', quota: 1, applicants: 8, status: 'open', posted: '2025-06-15', salary_range: 'Rp 5jt - 6.5jt' },
    { id: 4, title: 'Teknisi Servis', department: 'Servis', location: 'Tangerang', type: 'Full-time', quota: 2, applicants: 5, status: 'on_hold', posted: '2025-05-20', salary_range: 'Rp 4.5jt - 6jt' },
  ];

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/recruitment/positions');
      setPositions(r.data.data ?? r.data ?? SAMPLE);
    } catch { setPositions(SAMPLE); } finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const save = async () => {
    setSaving(true);
    try { await api.post('/recruitment/positions', form); } catch {}
    setPositions(p => [...p, { id: p.length + 1, title: form.title, department: form.department, location: form.location, type: form.type, quota: +form.quota, applicants: 0, status: 'open', posted: new Date().toISOString().split('T')[0], salary_range: form.salary_min ? `Rp ${(+form.salary_min/1000000).toFixed(1)}jt - ${(+form.salary_max/1000000).toFixed(1)}jt` : 'Negotiable' }]);
    setShowForm(false);
    setSaving(false);
    setForm({ title: '', department: '', location: '', type: 'Full-time', quota: '1', salary_min: '', salary_max: '', requirements: '', description: '' });
  };

  if (!token) return null;

  const filtered = (positions.length > 0 ? positions : SAMPLE).filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell {...RECRUITMENT_CONFIG} navItems={RECRUITMENT_NAV} activeHref="/recruitment/positions">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Lowongan Pekerjaan</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola posisi yang sedang dibuka dan alur rekrutmen</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buka Lowongan
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Lowongan', value: filtered.length, color: C },
            { label: 'Dibuka', value: filtered.filter(p => p.status === 'open').length, color: '#4CAF50' },
            { label: 'Total Pelamar', value: filtered.reduce((s, p) => s + (p.applicants ?? 0), 0), color: '#2196F3' },
            { label: 'Quota Tersedia', value: filtered.reduce((s, p) => s + (p.quota ?? 0), 0), color: '#FF9800' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari posisi atau departemen..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={load} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }}><RefreshCw className="h-4 w-4" /></button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {filtered.map(pos => {
                const s = STATUS_MAP[pos.status] ?? STATUS_MAP.open;
                return (
                  <div key={pos.id} className="rounded-xl p-5 transition-all hover:shadow-md cursor-pointer" style={{ border: '1.5px solid #EDE8F5' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold" style={{ color: '#1E1B4B' }}>{pos.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{pos.department}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
                        <MapPin className="h-3 w-3" />{pos.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
                        <Users className="h-3 w-3" />{pos.quota} quota
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: C }}>{pos.salary_range}</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#2196F3' }}>
                        <Users className="h-3 w-3" />{pos.applicants} pelamar
                      </div>
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                      {pos.type} • Dibuka: {new Date(pos.posted).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-y-auto" style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buka Lowongan Baru</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'title', label: 'Posisi / Jabatan *', placeholder: 'Staff Produksi...' },
                    { key: 'department', label: 'Departemen', placeholder: 'Operasional...' },
                    { key: 'location', label: 'Lokasi Kerja', placeholder: 'Jakarta...' },
                    { key: 'quota', label: 'Jumlah Kebutuhan', placeholder: '1', type: 'number' },
                    { key: 'salary_min', label: 'Gaji Min (Rp)', placeholder: '4500000', type: 'number' },
                    { key: 'salary_max', label: 'Gaji Max (Rp)', placeholder: '6000000', type: 'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                      <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tipe Kerja</label>
                  <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {['Full-time', 'Part-time', 'Kontrak', 'Magang', 'Freelance'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Persyaratan</label>
                  <textarea className="w-full rounded-lg px-4 py-2.5 text-sm resize-none" rows={3} style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Pendidikan min, pengalaman, skill yang dibutuhkan..." value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
                    {saving ? 'Menyimpan...' : 'Buka Lowongan'}
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

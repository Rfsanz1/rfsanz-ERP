'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { GraduationCap, Plus, Search, X, Calendar, Users, Award, RefreshCw } from 'lucide-react';

const C = HR_CONFIG.appColor;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  planned:   { label: 'Direncanakan', color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  ongoing:   { label: 'Berlangsung',  color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  completed: { label: 'Selesai',      color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  cancelled: { label: 'Dibatalkan',   color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
};

const SAMPLE = [
  { id: 1, title: 'Pelatihan K3 & Keselamatan Kerja', category: 'Keselamatan', trainer: 'PT. Safety Indonesia', participants: 25, start: '2025-07-10', end: '2025-07-11', cost: 15000000, status: 'planned' },
  { id: 2, title: 'Training Leadership untuk Supervisor', category: 'Manajemen', trainer: 'Lembaga Pelatihan ABC', participants: 8, start: '2025-06-20', end: '2025-06-22', cost: 24000000, status: 'ongoing' },
  { id: 3, title: 'Pelatihan Penggunaan ERP Baru', category: 'IT & Sistem', trainer: 'Tim Internal', participants: 45, start: '2025-05-15', end: '2025-05-17', cost: 5000000, status: 'completed' },
  { id: 4, title: 'Training Customer Service Excellence', category: 'Pelayanan', trainer: 'Konsultan XYZ', participants: 15, start: '2025-08-01', end: '2025-08-02', cost: 18000000, status: 'planned' },
];

export default function TrainingPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', trainer: '', participants: '', start: '', end: '', cost: '', description: '' });

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) &&
    (status === '' || i.status === status)
  );

  const save = () => {
    if (!form.title) return;
    setItems(it => [...it, { id: it.length + 1, ...form, participants: +form.participants, cost: +form.cost, status: 'planned' }]);
    setShowForm(false);
    setForm({ title: '', category: '', trainer: '', participants: '', start: '', end: '', cost: '', description: '' });
  };

  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/training">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Training & Pelatihan</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola program pelatihan dan pengembangan karyawan</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Training
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Program', value: items.length, color: C },
            { label: 'Berlangsung', value: items.filter(i => i.status === 'ongoing').length, color: '#FF9800' },
            { label: 'Selesai', value: items.filter(i => i.status === 'completed').length, color: '#4CAF50' },
            { label: 'Total Peserta', value: items.reduce((s, i) => s + i.participants, 0), color: '#2196F3' },
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
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari program training..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {filtered.map(item => {
              const s = STATUS_MAP[item.status];
              return (
                <div key={item.id} className="rounded-xl p-4 border transition-all hover:shadow-md" style={{ border: '1.5px solid #EDE8F5' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{item.category} • {item.trainer}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
                      <Calendar className="h-3 w-3" />
                      {new Date(item.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
                      <Users className="h-3 w-3" />
                      {item.participants} peserta
                    </div>
                    <div className="text-xs font-semibold" style={{ color: C }}>
                      {item.cost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-y-auto" style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat Program Training</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'title', label: 'Judul Training *', placeholder: 'Nama program pelatihan...' },
                  { key: 'category', label: 'Kategori', placeholder: 'Keselamatan / Manajemen...' },
                  { key: 'trainer', label: 'Trainer / Lembaga', placeholder: 'Nama trainer atau lembaga...' },
                  { key: 'participants', label: 'Jumlah Peserta', placeholder: '0', type: 'number' },
                  { key: 'cost', label: 'Biaya Total (Rp)', placeholder: '0', type: 'number' },
                  { key: 'description', label: 'Deskripsi', placeholder: 'Deskripsi program...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tanggal Mulai</label>
                    <input type="date" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tanggal Selesai</label>
                    <input type="date" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <GraduationCap className="h-4 w-4" /> Simpan Training
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

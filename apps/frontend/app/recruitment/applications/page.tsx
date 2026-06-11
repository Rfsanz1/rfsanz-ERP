'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { RECRUITMENT_CONFIG, RECRUITMENT_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Users, Search, RefreshCw, ChevronRight, Phone, Mail, Star } from 'lucide-react';

const C = RECRUITMENT_CONFIG.appColor;

const STAGES = ['Baru', 'Screening CV', 'Interview', 'Test', 'Offering', 'Diterima', 'Ditolak'];

const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
  'Baru':        { color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  'Screening CV':{ color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  'Interview':   { color: '#9C27B0', bg: 'rgba(156,39,176,.1)' },
  'Test':        { color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  'Offering':    { color: '#FF5722', bg: 'rgba(255,87,34,.1)' },
  'Diterima':    { color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  'Ditolak':     { color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

export default function ApplicationsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const SAMPLE = [
    { id: 1, name: 'Ahmad Rizky', position: 'Staff Produksi', email: 'ahmad.r@email.com', phone: '081234567890', stage: 'Interview', score: 78, applied_date: '2025-06-15', source: 'LinkedIn' },
    { id: 2, name: 'Sari Dewi', position: 'Sales Executive', email: 'sari.d@email.com', phone: '082345678901', stage: 'Offering', score: 92, applied_date: '2025-06-12', source: 'Indeed' },
    { id: 3, name: 'Budi Prasetyo', position: 'Staff Akuntansi', email: 'budi.p@email.com', phone: '083456789012', stage: 'Screening CV', score: 65, applied_date: '2025-06-20', source: 'Jobstreet' },
    { id: 4, name: 'Rina Kusuma', position: 'Staff Produksi', email: 'rina.k@email.com', phone: '084567890123', stage: 'Diterima', score: 88, applied_date: '2025-06-08', source: 'Referral' },
    { id: 5, name: 'Hendra Wijaya', position: 'Sales Executive', email: 'hendra.w@email.com', phone: '085678901234', stage: 'Ditolak', score: 45, applied_date: '2025-06-18', source: 'Walk-in' },
  ];


  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/recruitment/applications');
      setApplications(r.data.data ?? r.data ?? SAMPLE);
    } catch { setApplications(SAMPLE); } finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);

  if (!token) return null;

  const data = applications.length > 0 ? applications : SAMPLE;
  const filtered = data.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) &&
    (stageFilter === '' || a.stage === stageFilter)
  );

  const advance = (id: number) => {
    setApplications(apps => apps.map(a => {
      if (a.id !== id) return a;
      const idx = STAGES.indexOf(a.stage);
      return { ...a, stage: STAGES[Math.min(idx + 1, STAGES.length - 2)] };
    }));
  };

  return (
    <AppShell {...RECRUITMENT_CONFIG} navItems={RECRUITMENT_NAV} activeHref="/recruitment/applications">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Data Pelamar</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola dan pantau proses seleksi kandidat</p>
          </div>
          <button onClick={load} className="p-2 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }}><RefreshCw className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Pelamar', value: data.length, color: C },
            { label: 'Dalam Proses', value: data.filter(a => !['Diterima','Ditolak'].includes(a.stage)).length, color: '#2196F3' },
            { label: 'Diterima', value: data.filter(a => a.stage === 'Diterima').length, color: '#4CAF50' },
            { label: 'Ditolak', value: data.filter(a => a.stage === 'Ditolak').length, color: '#EA5455' },
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
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari pelamar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="">Semua Stage</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Pelamar', 'Posisi', 'Kontak', 'Tgl Melamar', 'Sumber', 'Skor', 'Stage', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const sc = STAGE_COLORS[app.stage] ?? STAGE_COLORS['Baru'];
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: C }}>{app.name?.charAt(0)}</div>
                          <span className="font-medium" style={{ color: '#1E1B4B' }}>{app.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{app.position}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}><Mail className="h-3 w-3" />{app.email}</div>
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}><Phone className="h-3 w-3" />{app.phone}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(app.applied_date).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{app.source}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3 w-3" style={{ color: app.score >= 80 ? '#FF9800' : '#9CA3AF' }} />
                          <span className="font-bold text-sm" style={{ color: app.score >= 80 ? '#FF9800' : app.score >= 60 ? '#2196F3' : '#EA5455' }}>{app.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: sc.color, backgroundColor: sc.bg }}>{app.stage}</span>
                      </td>
                      <td className="px-4 py-3">
                        {!['Diterima','Ditolak'].includes(app.stage) && (
                          <button onClick={() => advance(app.id)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${C}15`, color: C }}>
                            <ChevronRight className="h-3.5 w-3.5" /> Lanjut
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

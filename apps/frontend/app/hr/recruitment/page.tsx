'use client';

import { useState, useEffect } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import api from '@/lib/api';

const P = '#7367F0';

const APP_STAGES = [
  { key: 'new',       label: 'Baru',       color: '#A5A3AE', bg: 'rgba(165,163,174,.1)' },
  { key: 'screening', label: 'Screening',  color: P,         bg: 'rgba(115,103,240,.1)' },
  { key: 'interview', label: 'Interview',  color: '#00CFE8', bg: 'rgba(0,207,232,.1)' },
  { key: 'offer',     label: 'Penawaran',  color: '#FF9F43', bg: 'rgba(255,159,67,.1)' },
  { key: 'hired',     label: 'Diterima',   color: '#28C76F', bg: 'rgba(40,199,111,.1)' },
  { key: 'refused',   label: 'Ditolak',    color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
];

const inputCls = 'w-full rounded-lg px-3 py-2 text-sm outline-none';
const inputStyle = { border: '1.5px solid #EDE8F5', color: '#1E1B4B', backgroundColor: '#FAFAFA' };

export default function RecruitmentPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<'positions' | 'applications'>('positions');
  const [loading, setLoading] = useState(true);
  const [showPosForm, setShowPosForm] = useState(false);
  const [showAppForm, setShowAppForm] = useState(false);
  const [posForm, setPosForm] = useState({ name: '', departmentId: '', expectedEmployees: '1' });
  const [appForm, setAppForm] = useState({ jobId: '', applicantName: '', email: '', phone: '', notes: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [posRes, appRes, statsRes] = await Promise.all([
        api.get('/recruitment/positions'),
        api.get('/recruitment/applications'),
        api.get('/recruitment/stats'),
      ]);
      setPositions(posRes.data ?? []);
      setApplications(appRes.data.data ?? []);
      setStats(statsRes.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreatePos(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/recruitment/positions', { ...posForm, expectedEmployees: parseInt(posForm.expectedEmployees) });
      setShowPosForm(false);
      setPosForm({ name: '', departmentId: '', expectedEmployees: '1' });
      fetchAll();
    } catch { }
  }

  async function handleCreateApp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/recruitment/applications', appForm);
      setShowAppForm(false);
      setAppForm({ jobId: '', applicantName: '', email: '', phone: '', notes: '' });
      fetchAll();
    } catch { }
  }

  async function advanceStage(id: string, stage: string) {
    await api.post(`/recruitment/applications/${id}/advance`, { stage });
    fetchAll();
  }

  return (
    <ModernLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>Rekrutmen</h1>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Kelola lowongan & lamaran kerja</p>
          </div>
          <div className="flex gap-2">
            {tab === 'positions' && (
              <button onClick={() => setShowPosForm(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: P }}>
                + Lowongan
              </button>
            )}
            {tab === 'applications' && (
              <button onClick={() => setShowAppForm(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: P }}>
                + Lamaran
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Lowongan', value: stats.totalPositions, color: P },
              { label: 'Buka', value: stats.openPositions, color: '#28C76F' },
              { label: 'Total Lamaran', value: stats.totalApps, color: '#00CFE8' },
              { label: 'Diterima', value: stats.stageCount?.find((s: any) => s.stage === 'hired')?._count ?? 0, color: '#FF9F43' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE8F5' }}>
          {([['positions', 'Lowongan'], ['applications', 'Lamaran']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={tab === key ? { backgroundColor: P, color: '#fff' } : { color: '#9CA3AF' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: '#B0AAB9' }}>Memuat data...</div>
        ) : tab === 'positions' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold" style={{ color: '#1E1B4B' }}>{p.name}</p>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={p.status === 'open'
                      ? { backgroundColor: 'rgba(40,199,111,.1)', color: '#28C76F' }
                      : { backgroundColor: 'rgba(165,163,174,.1)', color: '#A5A3AE' }}>
                    {p.status === 'open' ? 'Buka' : 'Tutup'}
                  </span>
                </div>
                {p.departmentId && <p className="text-sm" style={{ color: '#9CA3AF' }}>{p.departmentId}</p>}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span style={{ color: '#9CA3AF' }}>Target: <span className="font-semibold" style={{ color: '#1E1B4B' }}>{p.expectedEmployees} orang</span></span>
                  <span style={{ color: P, fontWeight: 600 }}>{p._count?.applications ?? 0} lamaran</span>
                </div>
              </div>
            ))}
            {positions.length === 0 && (
              <p className="col-span-3 text-center py-10 text-sm" style={{ color: '#B0AAB9' }}>Belum ada lowongan</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Pelamar', 'Posisi', 'Kontak', 'Stage', 'Ubah Stage'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map(a => {
                  const stage = APP_STAGES.find(s => s.key === a.stage);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition" style={{ borderBottom: '1px solid #F5F3FF' }}>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{a.applicantName}</td>
                      <td className="px-4 py-3" style={{ color: '#6B7280' }}>{a.job?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{a.email ?? '—'}<br />{a.phone ?? ''}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                          style={{ color: stage?.color ?? '#A5A3AE', backgroundColor: stage?.bg ?? 'rgba(165,163,174,.1)' }}>
                          {stage?.label ?? a.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select value={a.stage} onChange={e => advanceStage(a.id, e.target.value)}
                          className="rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', backgroundColor: '#FAFAFA' }}>
                          {APP_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {applications.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-sm" style={{ color: '#B0AAB9' }}>Belum ada lamaran</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Tambah Lowongan */}
        {showPosForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(47,43,61,.5)' }}>
            <div className="bg-white rounded-2xl w-full max-w-sm" style={{ boxShadow: '0 20px 60px rgba(47,43,61,.2)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Lowongan</h2>
                <button onClick={() => setShowPosForm(false)} style={{ color: '#A5A3AE' }}>✕</button>
              </div>
              <form onSubmit={handleCreatePos} className="p-5 space-y-3">
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Posisi / Jabatan *</label><input required value={posForm.name} onChange={e => setPosForm(f => ({ ...f, name: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Departemen</label><input value={posForm.departmentId} onChange={e => setPosForm(f => ({ ...f, departmentId: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Target Karyawan</label><input type="number" min="1" value={posForm.expectedEmployees} onChange={e => setPosForm(f => ({ ...f, expectedEmployees: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPosForm(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: P }}>Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Input Lamaran */}
        {showAppForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(47,43,61,.5)' }}>
            <div className="bg-white rounded-2xl w-full max-w-md" style={{ boxShadow: '0 20px 60px rgba(47,43,61,.2)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Input Lamaran</h2>
                <button onClick={() => setShowAppForm(false)} style={{ color: '#A5A3AE' }}>✕</button>
              </div>
              <form onSubmit={handleCreateApp} className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Posisi *</label>
                  <select required value={appForm.jobId} onChange={e => setAppForm(f => ({ ...f, jobId: e.target.value }))} className={inputCls} style={inputStyle}>
                    <option value="">-- Pilih Posisi --</option>
                    {positions.filter(p => p.status === 'open').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Nama Pelamar *</label><input required value={appForm.applicantName} onChange={e => setAppForm(f => ({ ...f, applicantName: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Email</label><input type="email" value={appForm.email} onChange={e => setAppForm(f => ({ ...f, email: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>No. HP</label><input value={appForm.phone} onChange={e => setAppForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                </div>
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Catatan</label><textarea value={appForm.notes} onChange={e => setAppForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} style={inputStyle} /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAppForm(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: P }}>Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}

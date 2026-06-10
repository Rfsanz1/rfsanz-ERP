'use client';

import { useState, useEffect } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import api from '@/lib/api';

const P = '#7367F0';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: '#A5A3AE', bg: 'rgba(165,163,174,.1)' },
  confirmed: { label: 'Menunggu',  color: '#FF9F43', bg: 'rgba(255,159,67,.1)' },
  validated: { label: 'Disetujui', color: '#28C76F', bg: 'rgba(40,199,111,.1)' },
  refused:   { label: 'Ditolak',   color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

type Tab = 'requests' | 'types' | 'allocations';

export default function LeavesPage() {
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', leaveTypeId: '', dateFrom: '', dateTo: '', numberOfDays: '', reason: '' });
  const [typeForm, setTypeForm] = useState({ name: '', requiresApproval: true, maxDays: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [reqRes, typeRes, allocRes, statsRes] = await Promise.all([
        api.get('/leave/requests'),
        api.get('/leave/types'),
        api.get('/leave/allocations'),
        api.get('/leave/stats'),
      ]);
      setRequests(reqRes.data.data ?? []);
      setLeaveTypes(typeRes.data ?? []);
      setAllocations(allocRes.data ?? []);
      setStats(statsRes.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/leave/requests', { ...form, numberOfDays: parseFloat(form.numberOfDays) });
      setShowForm(false);
      setForm({ employeeId: '', leaveTypeId: '', dateFrom: '', dateTo: '', numberOfDays: '', reason: '' });
      fetchAll();
    } catch { }
  }

  async function handleTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/leave/types', { ...typeForm, maxDays: typeForm.maxDays ? parseInt(typeForm.maxDays) : null });
      setShowTypeForm(false);
      setTypeForm({ name: '', requiresApproval: true, maxDays: '' });
      fetchAll();
    } catch { }
  }

  async function approveRequest(id: string) { await api.post(`/leave/requests/${id}/approve`); fetchAll(); }
  async function refuseRequest(id: string) { await api.post(`/leave/requests/${id}/refuse`); fetchAll(); }

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm outline-none';
  const inputStyle = { border: '1.5px solid #EDE8F5', color: '#1E1B4B', backgroundColor: '#FAFAFA' };

  return (
    <ModernLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1E1B4B' }}>Cuti & Izin</h1>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Kelola pengajuan cuti karyawan</p>
          </div>
          <div className="flex gap-2">
            {tab === 'requests' && (
              <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: P }}>
                + Ajukan Cuti
              </button>
            )}
            {tab === 'types' && (
              <button onClick={() => setShowTypeForm(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: P }}>
                + Jenis Cuti
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Pengajuan', value: stats.total, color: P },
              { label: 'Menunggu', value: stats.pending, color: '#FF9F43' },
              { label: 'Disetujui', value: stats.approved, color: '#28C76F' },
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
          {([['requests', 'Pengajuan'], ['types', 'Jenis Cuti'], ['allocations', 'Alokasi']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={tab === key ? { backgroundColor: P, color: '#fff' } : { color: '#9CA3AF' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48" style={{ color: '#B0AAB9' }}>Memuat data...</div>
        ) : (
          <>
            {/* Requests tab */}
            {tab === 'requests' && (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                      {['Karyawan', 'Jenis Cuti', 'Tanggal', 'Hari', 'Status', 'Aksi'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => {
                      const st = STATUS_MAP[r.status] ?? STATUS_MAP.draft;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 transition" style={{ borderBottom: '1px solid #F5F3FF' }}>
                          <td className="px-4 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{r.employee?.name ?? r.employeeId}</td>
                          <td className="px-4 py-3" style={{ color: '#6B7280' }}>{r.leaveType?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{new Date(r.dateFrom).toLocaleDateString('id-ID')} – {new Date(r.dateTo).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{Number(r.numberOfDays)} hari</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            {(r.status === 'draft' || r.status === 'confirmed') && (
                              <div className="flex gap-2">
                                <button onClick={() => approveRequest(r.id)} className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(40,199,111,.1)', color: '#28C76F' }}>✓ Setuju</button>
                                <button onClick={() => refuseRequest(r.id)} className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#EA5455' }}>✗ Tolak</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {requests.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-sm" style={{ color: '#B0AAB9' }}>Belum ada pengajuan cuti</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Types tab */}
            {tab === 'types' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaveTypes.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                    <p className="font-semibold" style={{ color: '#1E1B4B' }}>{t.name}</p>
                    <div className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: '#9CA3AF' }}>Perlu Persetujuan</span>
                        <span className="font-medium" style={{ color: '#1E1B4B' }}>{t.requiresApproval ? 'Ya' : 'Tidak'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#9CA3AF' }}>Maks. Hari</span>
                        <span className="font-medium" style={{ color: '#1E1B4B' }}>{t.maxDays ?? 'Tidak terbatas'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {leaveTypes.length === 0 && (
                  <p className="col-span-3 text-center py-10 text-sm" style={{ color: '#B0AAB9' }}>Belum ada jenis cuti. Klik "+ Jenis Cuti" untuk menambah.</p>
                )}
              </div>
            )}

            {/* Allocations tab */}
            {tab === 'allocations' && (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                      {['Karyawan', 'Jenis Cuti', 'Tahun', 'Jatah (Hari)', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 transition" style={{ borderBottom: '1px solid #F5F3FF' }}>
                        <td className="px-4 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{a.employee?.name ?? a.employeeId}</td>
                        <td className="px-4 py-3" style={{ color: '#6B7280' }}>{a.leaveType?.name ?? '—'}</td>
                        <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{a.year}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{Number(a.numberOfDays)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(40,199,111,.1)', color: '#28C76F' }}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                    {allocations.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-sm" style={{ color: '#B0AAB9' }}>Belum ada alokasi cuti</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Modal: Ajukan Cuti */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(47,43,61,.5)' }}>
            <div className="bg-white rounded-2xl w-full max-w-md" style={{ boxShadow: '0 20px 60px rgba(47,43,61,.2)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Ajukan Cuti</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#A5A3AE' }}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>ID Karyawan *</label><input required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Jenis Cuti *</label>
                  <select required value={form.leaveTypeId} onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} className={inputCls} style={inputStyle}>
                    <option value="">-- Pilih Jenis --</option>
                    {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Dari *</label><input required type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Sampai *</label><input required type="date" value={form.dateTo} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                </div>
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Jumlah Hari *</label><input required type="number" min="0.5" step="0.5" value={form.numberOfDays} onChange={e => setForm(f => ({ ...f, numberOfDays: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Alasan</label><textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} className={inputCls + ' resize-none'} style={inputStyle} /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: P }}>Ajukan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Jenis Cuti */}
        {showTypeForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(47,43,61,.5)' }}>
            <div className="bg-white rounded-2xl w-full max-w-sm" style={{ boxShadow: '0 20px 60px rgba(47,43,61,.2)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Jenis Cuti</h2>
                <button onClick={() => setShowTypeForm(false)} style={{ color: '#A5A3AE' }}>✕</button>
              </div>
              <form onSubmit={handleTypeSubmit} className="p-5 space-y-3">
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Nama *</label><input required value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} className={inputCls} style={inputStyle} placeholder="Cuti Tahunan" /></div>
                <div><label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>Maks. Hari (kosong = tidak terbatas)</label><input type="number" value={typeForm.maxDays} onChange={e => setTypeForm(f => ({ ...f, maxDays: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={typeForm.requiresApproval} onChange={e => setTypeForm(f => ({ ...f, requiresApproval: e.target.checked }))} className="rounded" />
                  <span className="text-sm" style={{ color: '#6B7280' }}>Perlu persetujuan atasan</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowTypeForm(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
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

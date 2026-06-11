'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import api from '@/lib/api';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draf',      color: '#94A3B8' },
  confirmed: { label: 'Menunggu', color: '#F59E0B' },
  validated: { label: 'Disetujui', color: '#10B981' },
  refused:   { label: 'Ditolak',   color: '#EF4444' },
};

type Tab = 'requests' | 'types' | 'allocations';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 9, outline: 'none',
  border: '1px solid var(--border)', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function LeavesPage() {
  const { token }   = useAuthStore();
  const router      = useRouter();
  const [tab, setTab]                 = useState<Tab>('requests');
  const [requests, setRequests]       = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes]   = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [stats, setStats]             = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [form, setForm]               = useState({ employeeId: '', leaveTypeId: '', dateFrom: '', dateTo: '', numberOfDays: '', reason: '' });
  const [typeForm, setTypeForm]       = useState({ name: '', requiresApproval: true, maxDays: '' });


  async function fetchAll() {
    setLoading(true);
    try {
      const [reqRes, typeRes, allocRes, statsRes] = await Promise.all([
        api.get('/leave/requests'), api.get('/leave/types'), api.get('/leave/allocations'), api.get('/leave/stats'),
      ]);
      setRequests(reqRes.data.data ?? []);
      setLeaveTypes(typeRes.data ?? []);
      setAllocations(allocRes.data ?? []);
      setStats(statsRes.data);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { if (token) fetchAll(); }, [token]);
  if (!token) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/leave/requests', { ...form, numberOfDays: parseFloat(form.numberOfDays) });
      setShowForm(false); setForm({ employeeId: '', leaveTypeId: '', dateFrom: '', dateTo: '', numberOfDays: '', reason: '' });
      fetchAll();
    } catch {}
  }
  async function handleTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/leave/types', { ...typeForm, maxDays: typeForm.maxDays ? parseInt(typeForm.maxDays) : null });
      setShowTypeForm(false); setTypeForm({ name: '', requiresApproval: true, maxDays: '' });
      fetchAll();
    } catch {}
  }
  const approve = async (id: string) => { await api.post(`/leave/requests/${id}/approve`); fetchAll(); };
  const refuse  = async (id: string) => { await api.post(`/leave/requests/${id}/refuse`);  fetchAll(); };

  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/leaves">
      <div style={{ maxWidth: 1100 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Cuti &amp; Izin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola pengajuan cuti karyawan</p>
          </div>
          <div className="flex gap-2">
            {tab === 'requests' && (
              <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Ajukan Cuti</button>
            )}
            {tab === 'types' && (
              <button onClick={() => setShowTypeForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Jenis Cuti</button>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Pengajuan', value: stats.total,    color: '#6366F1' },
              { label: 'Menunggu',        value: stats.pending,  color: '#F59E0B' },
              { label: 'Disetujui',       value: stats.approved, color: '#10B981' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {([['requests','Pengajuan'],['types','Jenis Cuti'],['allocations','Alokasi']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                background: tab === key ? '#6366F1' : 'transparent', color: tab === key ? '#fff' : 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Memuat data…</div>
        ) : (
          <>
            {/* Requests */}
            {tab === 'requests' && (
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Karyawan','Jenis Cuti','Tanggal','Hari','Status','Aksi'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r, i) => {
                      const st = STATUS_MAP[r.status] ?? STATUS_MAP.draft;
                      return (
                        <tr key={r.id} style={{ borderBottom: i < requests.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.employee?.name ?? r.employeeId}</td>
                          <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>{r.leaveType?.name ?? '—'}</td>
                          <td style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.dateFrom).toLocaleDateString('id-ID')} – {new Date(r.dateTo).toLocaleDateString('id-ID')}</td>
                          <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{Number(r.numberOfDays)} hari</td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: st.color, background: st.color + '1A' }}>{st.label}</span>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            {(r.status === 'draft' || r.status === 'confirmed') && (
                              <div className="flex gap-2">
                                <button onClick={() => approve(r.id)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>✓ Setuju</button>
                                <button onClick={() => refuse(r.id)}  style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>✗ Tolak</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {requests.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada pengajuan cuti</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Types */}
            {tab === 'types' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaveTypes.map(t => (
                  <div key={t.id} style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>{t.name}</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Perlu Persetujuan', value: t.requiresApproval ? 'Ya' : 'Tidak' },
                        { label: 'Maks. Hari',         value: t.maxDays ?? 'Tidak terbatas' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between">
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {leaveTypes.length === 0 && (
                  <p style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada jenis cuti.</p>
                )}
              </div>
            )}

            {/* Allocations */}
            {tab === 'allocations' && (
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Karyawan','Jenis Cuti','Tahun','Jatah (Hari)','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: i < allocations.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.employee?.name ?? a.employeeId}</td>
                        <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>{a.leaveType?.name ?? '—'}</td>
                        <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{a.year}</td>
                        <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{Number(a.numberOfDays)}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                    {allocations.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada alokasi cuti</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Ajukan Cuti */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, background: 'rgba(0,0,0,.5)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div className="flex items-center justify-between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Ajukan Cuti</h2>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20 }} className="space-y-3">
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>ID Karyawan *</label><input required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} style={inputStyle} /></div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>Jenis Cuti *</label>
                <select required value={form.leaveTypeId} onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">-- Pilih Jenis --</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>Dari *</label><input required type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} style={inputStyle} /></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>Sampai *</label><input required type="date" value={form.dateTo} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>Jumlah Hari *</label><input required type="number" min="0.5" step="0.5" value={form.numberOfDays} onChange={e => setForm(f => ({ ...f, numberOfDays: e.target.value }))} style={inputStyle} /></div>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>Alasan</label><textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' as const }} /></div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: '9px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ajukan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Jenis Cuti */}
      {showTypeForm && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, background: 'rgba(0,0,0,.5)' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 18, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div className="flex items-center justify-between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Tambah Jenis Cuti</h2>
              <button onClick={() => setShowTypeForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleTypeSubmit} style={{ padding: 20 }} className="space-y-3">
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>Nama *</label><input required value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Cuti Tahunan" /></div>
              <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>Maks. Hari</label><input type="number" value={typeForm.maxDays} onChange={e => setTypeForm(f => ({ ...f, maxDays: e.target.value }))} style={inputStyle} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={typeForm.requiresApproval} onChange={e => setTypeForm(f => ({ ...f, requiresApproval: e.target.checked }))} />
                Perlu persetujuan atasan
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowTypeForm(false)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: '9px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

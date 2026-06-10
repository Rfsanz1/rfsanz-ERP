'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SALES_CONFIG, SALES_NAV } from '../../../lib/nav-configs';
import { Users, Plus, X, Award } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE_TEAMS = [
  { id: 1, name: 'Tim Sales Jakarta', leader: 'Budi Santoso', members: [
    { name: 'Ahmad Fauzi', target: 80000000, achieved: 92000000, leads: 24, deals: 18 },
    { name: 'Siti Rahayu', target: 70000000, achieved: 65000000, leads: 19, deals: 12 },
    { name: 'Hendra W.',   target: 75000000, achieved: 78000000, leads: 22, deals: 15 },
  ], total_target: 225000000, total_achieved: 235000000 },
  { id: 2, name: 'Tim Sales Jabar', leader: 'Dewi Kusuma', members: [
    { name: 'Agus Salim', target: 60000000, achieved: 55000000, leads: 18, deals: 11 },
    { name: 'Rina Wati',  target: 65000000, achieved: 70000000, leads: 20, deals: 14 },
  ], total_target: 125000000, total_achieved: 125000000 },
];

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function SalesTeamsPage() {
  const { token }  = useAuthStore();
  const router     = useRouter();
  const [teams, setTeams]       = useState(SAMPLE_TEAMS as any[]);
  const [selected, setSelected] = useState<any>(SAMPLE_TEAMS[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', leader: '' });

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...SALES_CONFIG} navItems={SALES_NAV} activeHref="/sales/teams">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Tim Penjualan</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola tim penjualan dan pantau performa masing-masing anggota</p>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Tim
          </button>
        </div>

        {/* Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => {
            const achPct   = Math.round(team.total_achieved / team.total_target * 100);
            const isActive = selected?.id === team.id;
            const accent   = achPct >= 100 ? '#10B981' : achPct >= 80 ? '#6366F1' : '#F59E0B';
            return (
              <div key={team.id} onClick={() => setSelected(team)}
                style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, border: `2px solid ${isActive ? '#6366F1' : 'var(--border)'}`, cursor: 'pointer', transition: 'border-color .15s', boxShadow: isActive ? '0 4px 20px rgba(99,102,241,.15)' : 'var(--shadow-sm)' }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 3px' }}>{team.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Leader: {team.leader} • {team.members.length} anggota</p>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: accent }}>{achPct}%</span>
                </div>
                <div>
                  <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                    <span>Target: {fmt(team.total_target)}</span>
                    <span style={{ fontWeight: 600, color: accent }}>Realisasi: {fmt(team.total_achieved)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(achPct, 100)}%`, background: accent, borderRadius: 3, transition: 'width .4s' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Member Detail Table */}
        {selected && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Performa Anggota — {selected.name}</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Salesperson','Target Bulan Ini','Realisasi','Pencapaian','Leads','Deals'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.members.map((m: any, i: number) => {
                    const pct   = Math.round(m.achieved / m.target * 100);
                    const color = pct >= 100 ? '#10B981' : pct >= 80 ? '#6366F1' : '#F59E0B';
                    const isTop = i === 0;
                    return (
                      <tr key={m.name} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-2">
                            {isTop && <Award size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />}
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{m.name.charAt(0)}</div>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{m.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{fmt(m.target)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: pct >= 100 ? '#10B981' : 'var(--text-primary)', fontSize: 13 }}>{fmt(m.achieved)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-2">
                            <div style={{ height: 5, width: 56, borderRadius: 3, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{m.leads}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{m.deals}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Tambah Sales Team</span>
                <button onClick={() => setShowForm(false)} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'name',   label: 'Nama Tim *',    placeholder: 'Tim Sales Jakarta…' },
                  { key: 'leader', label: 'Nama Leader',   placeholder: 'Nama sales leader…' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
                    <input style={inputStyle} placeholder={f.placeholder} value={(form as any)[f.key]}
                      onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                      onFocus={el => { el.target.style.borderColor = '#6366F1'; }} onBlur={el => { el.target.style.borderColor = 'var(--border)'; }} />
                  </div>
                ))}
                <div className="flex justify-end gap-3" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                  <button onClick={() => {
                    if (form.name) {
                      setTeams(t => [...t, { id: t.length + 1, name: form.name, leader: form.leader, members: [], total_target: 0, total_achieved: 0 }]);
                      setShowForm(false); setForm({ name: '', leader: '' });
                    }
                  }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Users size={13} /> Simpan Tim
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

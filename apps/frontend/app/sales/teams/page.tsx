'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SALES_CONFIG, SALES_NAV } from '../../../lib/nav-configs';
import { Users, Plus, X, TrendingUp, Target, Award } from 'lucide-react';

const C = SALES_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE_TEAMS = [
  {
    id: 1, name: 'Tim Sales Jakarta', leader: 'Budi Santoso', members: [
      { name: 'Ahmad Fauzi', target: 80000000, achieved: 92000000, leads: 24, deals: 18 },
      { name: 'Siti Rahayu', target: 70000000, achieved: 65000000, leads: 19, deals: 12 },
      { name: 'Hendra W.', target: 75000000, achieved: 78000000, leads: 22, deals: 15 },
    ],
    total_target: 225000000, total_achieved: 235000000,
  },
  {
    id: 2, name: 'Tim Sales Jabar', leader: 'Dewi Kusuma', members: [
      { name: 'Agus Salim', target: 60000000, achieved: 55000000, leads: 18, deals: 11 },
      { name: 'Rina Wati', target: 65000000, achieved: 70000000, leads: 20, deals: 14 },
    ],
    total_target: 125000000, total_achieved: 125000000,
  },
];

export default function SalesTeamsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [teams, setTeams] = useState(SAMPLE_TEAMS);
  const [selected, setSelected] = useState(SAMPLE_TEAMS[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', leader: '' });

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...SALES_CONFIG} navItems={SALES_NAV} activeHref="/sales/teams">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Sales Team</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola tim penjualan dan pantau performa masing-masing anggota</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Tim
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {teams.map(team => {
            const achPct = Math.round(team.total_achieved / team.total_target * 100);
            const isSelected = selected.id === team.id;
            return (
              <div key={team.id} onClick={() => setSelected(team)} className="bg-white rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md" style={{ border: `2px solid ${isSelected ? C : '#EDE8F5'}`, boxShadow: isSelected ? `0 4px 16px ${C}20` : '0 1px 4px rgba(47,43,61,.06)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold" style={{ color: '#1E1B4B' }}>{team.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Leader: {team.leader} • {team.members.length} anggota</p>
                  </div>
                  <span className="text-xl font-bold" style={{ color: achPct >= 100 ? '#4CAF50' : achPct >= 80 ? C : '#FF9800' }}>{achPct}%</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: '#6B7280' }}>
                    <span>Target: {fmt(team.total_target)}</span>
                    <span className="font-semibold" style={{ color: achPct >= 100 ? '#4CAF50' : C }}>Achieved: {fmt(team.total_achieved)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(achPct, 100)}%`, backgroundColor: achPct >= 100 ? '#4CAF50' : C }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Performa Anggota — {selected.name}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                    {['Salesperson', 'Target Bulan Ini', 'Achieved', 'Achievement', 'Leads', 'Deals Closed'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.members.map((m, i) => {
                    const pct = Math.round(m.achieved / m.target * 100);
                    const isTop = i === 0;
                    return (
                      <tr key={m.name} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {isTop && <Award className="h-4 w-4 flex-shrink-0" style={{ color: '#FF9800' }} />}
                            <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: C }}>{m.name.charAt(0)}</div>
                            <span className="font-medium" style={{ color: '#1E1B4B' }}>{m.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3" style={{ color: '#6B7280' }}>{fmt(m.target)}</td>
                        <td className="px-6 py-3 font-semibold" style={{ color: pct >= 100 ? '#4CAF50' : '#1E1B4B' }}>{fmt(m.achieved)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? '#4CAF50' : C }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: pct >= 100 ? '#4CAF50' : pct >= 80 ? C : '#FF9800' }}>{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center font-semibold" style={{ color: '#1E1B4B' }}>{m.leads}</td>
                        <td className="px-6 py-3 text-center font-semibold" style={{ color: '#1E1B4B' }}>{m.deals}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Sales Team</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'name', label: 'Nama Tim *', placeholder: 'Tim Sales Jakarta...' },
                  { key: 'leader', label: 'Nama Leader', placeholder: 'Nama sales leader...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Users className="h-4 w-4" /> Simpan Tim
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

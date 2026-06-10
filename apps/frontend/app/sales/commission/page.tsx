'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SALES_CONFIG, SALES_NAV } from '../../../lib/nav-configs';
import { Percent, Plus, Download, X, Award } from 'lucide-react';

const C = SALES_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 1, salesperson: 'Ahmad Fauzi', period: 'Juni 2025', target: 80000000, achieved: 92000000, rate: 3, bonus_rate: 5, commission: 2760000, bonus: 600000, total: 3360000, status: 'approved' },
  { id: 2, salesperson: 'Siti Rahayu', period: 'Juni 2025', target: 70000000, achieved: 65000000, rate: 3, bonus_rate: 5, commission: 1950000, bonus: 0, total: 1950000, status: 'pending' },
  { id: 3, salesperson: 'Hendra W.', period: 'Juni 2025', target: 75000000, achieved: 78000000, rate: 3, bonus_rate: 5, commission: 2340000, bonus: 150000, total: 2490000, status: 'approved' },
  { id: 4, salesperson: 'Agus Salim', period: 'Juni 2025', target: 60000000, achieved: 55000000, rate: 2.5, bonus_rate: 4, commission: 1375000, bonus: 0, total: 1375000, status: 'pending' },
];

const SCHEME = [
  { label: '< 80% Target', rate: 0, note: 'Tidak dapat komisi' },
  { label: '80% - 99% Target', rate: 2.5, note: 'Komisi standar dari omzet' },
  { label: '100% - 119% Target', rate: 3, note: 'Komisi standar + bonus 2%' },
  { label: '≥ 120% Target', rate: 3, note: 'Komisi standar + bonus 5%' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Menunggu',   color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  approved: { label: 'Disetujui', color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  paid:     { label: 'Dibayar',   color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
};

export default function CommissionPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [period, setPeriod] = useState('Juni 2025');
  const [showScheme, setShowScheme] = useState(false);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const totalCommission = SAMPLE.reduce((s, i) => s + i.total, 0);
  const paid = SAMPLE.filter(i => i.status === 'approved').reduce((s, i) => s + i.total, 0);

  return (
    <AppShell {...SALES_CONFIG} navItems={SALES_NAV} activeHref="/sales/commission">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Komisi Sales</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Hitung dan kelola komisi berdasarkan pencapaian target</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowScheme(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
              <Percent className="h-4 w-4" /> Skema Komisi
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Komisi', value: fmt(totalCommission), color: C },
            { label: 'Disetujui', value: fmt(paid), color: '#4CAF50' },
            { label: 'Menunggu', value: fmt(totalCommission - paid), color: '#FF9800' },
            { label: 'Jumlah Salesperson', value: SAMPLE.length, color: '#2196F3' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Periode:</label>
          <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={period} onChange={e => setPeriod(e.target.value)}>
            {['Juni 2025', 'Mei 2025', 'April 2025', 'Q1 2025'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Salesperson', 'Periode', 'Target', 'Achieved', 'Achievement', 'Tarif Komisi', 'Komisi', 'Bonus', 'Total', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE.map(item => {
                  const pct = Math.round(item.achieved / item.target * 100);
                  const s = STATUS_MAP[item.status];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: C }}>{item.salesperson.charAt(0)}</div>
                          <span className="font-medium" style={{ color: '#1E1B4B' }}>{item.salesperson}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.period}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{fmt(item.target)}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: pct >= 100 ? '#4CAF50' : '#1E1B4B' }}>{fmt(item.achieved)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? '#4CAF50' : C }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: pct >= 100 ? '#4CAF50' : pct >= 80 ? C : '#FF9800' }}>{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{item.rate}%</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#1E1B4B' }}>{fmt(item.commission)}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: item.bonus > 0 ? '#4CAF50' : '#9CA3AF' }}>{item.bonus > 0 ? fmt(item.bonus) : '-'}</td>
                      <td className="px-4 py-3 font-bold text-sm" style={{ color: C }}>{fmt(item.total)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'pending' && (
                          <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#388E3C' }}>Setujui</button>
                        )}
                        {item.status === 'approved' && (
                          <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(33,150,243,.1)', color: '#1976D2' }}>Bayar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  <td colSpan={8} className="px-4 py-3 font-bold text-sm" style={{ color: '#1E1B4B' }}>TOTAL</td>
                  <td className="px-4 py-3 font-bold text-sm" style={{ color: C }}>{fmt(totalCommission)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {showScheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Skema Komisi Sales</h2>
                <button onClick={() => setShowScheme(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-3">
                {SCHEME.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE8F5' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{s.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{s.note}</p>
                    </div>
                    <span className="text-xl font-bold" style={{ color: s.rate > 0 ? C : '#9E9E9E' }}>{s.rate}%</span>
                  </div>
                ))}
                <button onClick={() => setShowScheme(false)} className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

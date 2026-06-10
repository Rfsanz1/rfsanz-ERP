'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { Star, Plus } from 'lucide-react';

const APPRAISALS = [
  { name: 'Rudi Hartono',  dept: 'Sales',    period: 'Q1 2026', score: 88, status: 'done' },
  { name: 'Sari Dewi',     dept: 'Finance',  period: 'Q1 2026', score: 92, status: 'done' },
  { name: 'Agus Wijaya',   dept: 'Warehouse',period: 'Q1 2026', score: 0,  status: 'pending' },
  { name: 'Rina Kusuma',   dept: 'HR',       period: 'Q1 2026', score: 85, status: 'done' },
  { name: 'Budi Prasetyo', dept: 'Delivery', period: 'Q1 2026', score: 0,  status: 'pending' },
];

export default function HrAppraisalsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/appraisals">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Penilaian Karyawan</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Performance appraisal per periode</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: HR_CONFIG.appColor }}><Plus className="h-4 w-4" /> Penilaian Baru</button>
        </div>
        <div className="grid gap-3">
          {APPRAISALS.map((a) => (
            <div key={a.name} className="bg-white rounded-2xl p-5 flex items-center justify-between" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: HR_CONFIG.appColor }}>{a.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{a.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{a.dept} · {a.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {a.status === 'done' ? (
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => <Star key={n} className="h-4 w-4" style={{ fill: n <= Math.round(a.score / 20) ? '#FF9800' : 'none', color: '#FF9800' }} />)}
                    </div>
                    <p className="text-xs mt-1 font-semibold" style={{ color: '#1E1B4B' }}>{a.score}/100</p>
                  </div>
                ) : (
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: HR_CONFIG.appColor }}>Mulai Penilaian</button>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ color: a.status === 'done' ? '#4CAF50' : '#FF9800', backgroundColor: a.status === 'done' ? 'rgba(76,175,80,.1)' : 'rgba(255,152,0,.1)' }}>
                  {a.status === 'done' ? 'Selesai' : 'Belum dinilai'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

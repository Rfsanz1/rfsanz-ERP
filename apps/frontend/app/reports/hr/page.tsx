'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { REPORTS_CONFIG, REPORTS_NAV } from '../../../lib/nav-configs';
import { UserCheck, Calendar, DollarSign, Star } from 'lucide-react';

const DEPT_DATA = [
  { dept: 'Sales',      karyawan: 24, hadir: '96%', avg_gaji: 'Rp 4.2 Jt', cuti: 3 },
  { dept: 'Warehouse',  karyawan: 32, hadir: '94%', avg_gaji: 'Rp 3.8 Jt', cuti: 5 },
  { dept: 'Delivery',   karyawan: 18, hadir: '98%', avg_gaji: 'Rp 3.5 Jt', cuti: 1 },
  { dept: 'Finance',    karyawan: 12, hadir: '97%', avg_gaji: 'Rp 4.8 Jt', cuti: 2 },
  { dept: 'HR',         karyawan: 6,  hadir: '100%',avg_gaji: 'Rp 4.5 Jt', cuti: 0 },
  { dept: 'IT',         karyawan: 4,  hadir: '95%', avg_gaji: 'Rp 5.2 Jt', cuti: 1 },
];

export default function ReportsHrPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...REPORTS_CONFIG} navItems={REPORTS_NAV} activeHref="/reports/hr">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan SDM</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Absensi, gaji, dan kinerja karyawan</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Karyawan',  value: '148',    icon: UserCheck,  color: '#C2185B', bg: 'rgba(194,24,91,.1)' },
            { label: 'Avg Kehadiran',   value: '97%',    icon: Calendar,   color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
            { label: 'Total Payroll',   value: 'Rp 412 Jt',icon: DollarSign,color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
            { label: 'Avg Kinerja',     value: '86/100', icon: Star,       color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-start justify-between">
                <div><p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p><p className="text-xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{s.value}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}><h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Ringkasan per Departemen</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Departemen', 'Karyawan', 'Tingkat Kehadiran', 'Avg Gaji', 'Cuti Aktif'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DEPT_DATA.map((d, i) => (
                  <tr key={d.dept} style={{ borderBottom: i < DEPT_DATA.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{d.dept}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.karyawan}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{d.hadir}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.avg_gaji}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: d.cuti > 0 ? '#FF9800' : '#4CAF50' }}>{d.cuti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

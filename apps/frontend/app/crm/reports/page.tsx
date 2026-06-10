'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { TrendingUp, Users, Star, DollarSign } from 'lucide-react';

const MONTHLY = [
  { bulan: 'Jan', baru: 14, kualifikasi: 9,  won: 5,  nilai: 'Rp 98 Jt' },
  { bulan: 'Feb', baru: 18, kualifikasi: 12, won: 7,  nilai: 'Rp 124 Jt' },
  { bulan: 'Mar', baru: 16, kualifikasi: 10, won: 6,  nilai: 'Rp 112 Jt' },
  { bulan: 'Apr', baru: 21, kualifikasi: 14, won: 9,  nilai: 'Rp 148 Jt' },
  { bulan: 'Mei', baru: 24, kualifikasi: 18, won: 23, nilai: 'Rp 156 Jt' },
];

export default function CrmReportsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/reports">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan CRM</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Performa pipeline dan konversi prospek</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Prospek (YTD)', value: '93',       icon: Star,       color: '#8E24AA', bg: 'rgba(142,36,170,.1)' },
            { label: 'Won (YTD)',           value: '50',       icon: TrendingUp, color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
            { label: 'Conversion Rate',    value: '53.8%',    icon: Users,      color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
            { label: 'Revenue Pipeline',   value: 'Rp 638 Jt',icon: DollarSign, color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Pipeline per Bulan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Bulan', 'Prospek Baru', 'Kualifikasi', 'Won', 'Nilai Tertutup'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {MONTHLY.map((m, i) => (
                  <tr key={m.bulan} style={{ borderBottom: i < MONTHLY.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{m.bulan}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{m.baru}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{m.kualifikasi}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{m.won}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{m.nilai}</td>
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

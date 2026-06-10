'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Star, Gift, Crown } from 'lucide-react';

const LOYALTY = [
  { name: 'Budi Santoso',  company: 'PT Maju Jaya',     tier: 'Gold',    points: 4820, spend: 'Rp 48.2 Jt' },
  { name: 'Siti Rahayu',   company: 'CV Berkah Utama',  tier: 'Silver',  points: 2340, spend: 'Rp 23.4 Jt' },
  { name: 'Ahmad Fauzi',   company: 'UD Karya Bersama', tier: 'Silver',  points: 1890, spend: 'Rp 18.9 Jt' },
  { name: 'Dewi Kusuma',   company: 'PT Global Mandiri',tier: 'Bronze',  points: 980,  spend: 'Rp 9.8 Jt' },
  { name: 'Hari Pratama',  company: 'CV Sentosa Jaya',  tier: 'Bronze',  points: 450,  spend: 'Rp 4.5 Jt' },
];

const TIER_STYLE: Record<string, { color: string; bg: string; icon: any }> = {
  Gold:   { color: '#F59E0B', bg: 'rgba(245,158,11,.1)',  icon: Crown },
  Silver: { color: '#607D8B', bg: 'rgba(96,125,139,.1)',  icon: Star },
  Bronze: { color: '#795548', bg: 'rgba(121,85,72,.1)',   icon: Gift },
};

export default function LoyaltyPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers/loyalty">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Loyalty Points</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Program poin reward pelanggan setia</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Member Gold',   value: '12',  color: '#F59E0B', bg: 'rgba(245,158,11,.1)', icon: Crown },
            { label: 'Member Silver', value: '34',  color: '#607D8B', bg: 'rgba(96,125,139,.1)', icon: Star },
            { label: 'Member Bronze', value: '48',  color: '#795548', bg: 'rgba(121,85,72,.1)',  icon: Gift },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-start justify-between">
                <div><p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p><p className="text-2xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{s.value}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Pelanggan', 'Perusahaan', 'Tier', 'Poin', 'Total Belanja'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {LOYALTY.map((l, i) => {
                  const tier = TIER_STYLE[l.tier];
                  return (
                    <tr key={l.name} style={{ borderBottom: i < LOYALTY.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-6 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{l.name}</td>
                      <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{l.company}</td>
                      <td className="px-6 py-3.5"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: tier.color, backgroundColor: tier.bg }}><tier.icon className="h-3 w-3" />{l.tier}</span></td>
                      <td className="px-6 py-3.5 text-sm font-bold" style={{ color: tier.color }}>{l.points.toLocaleString()} pts</td>
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{l.spend}</td>
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

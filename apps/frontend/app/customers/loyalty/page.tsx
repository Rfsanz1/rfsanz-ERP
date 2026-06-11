'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Star, Gift, Crown } from 'lucide-react';

const LOYALTY = [
  { name: 'Budi Santoso',  company: 'PT Maju Jaya',      tier: 'Gold',   points: 4820, spend: 'Rp 48.2 Jt' },
  { name: 'Siti Rahayu',   company: 'CV Berkah Utama',   tier: 'Silver', points: 2340, spend: 'Rp 23.4 Jt' },
  { name: 'Ahmad Fauzi',   company: 'UD Karya Bersama',  tier: 'Silver', points: 1890, spend: 'Rp 18.9 Jt' },
  { name: 'Dewi Kusuma',   company: 'PT Global Mandiri', tier: 'Bronze', points: 980,  spend: 'Rp 9.8 Jt' },
  { name: 'Hari Pratama',  company: 'CV Sentosa Jaya',   tier: 'Bronze', points: 450,  spend: 'Rp 4.5 Jt' },
];

const TIER: Record<string, { color: string; icon: any }> = {
  Gold:   { color: '#F59E0B', icon: Crown },
  Silver: { color: '#607D8B', icon: Star },
  Bronze: { color: '#795548', icon: Gift },
};

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function LoyaltyPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers/loyalty">
      <div style={{ maxWidth: 1000 }} className="space-y-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Loyalty Points</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Program poin reward pelanggan setia</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Member Gold',   value: '12', icon: Crown, accent: '#F59E0B' },
            { label: 'Member Silver', value: '34', icon: Star,  accent: '#607D8B' },
            { label: 'Member Bronze', value: '48', icon: Gift,  accent: '#795548' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: s.accent, margin: 0 }}>{s.value}</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.accent + '1A' }}>
                  <s.icon size={16} style={{ color: s.accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Pelanggan','Perusahaan','Tier','Poin','Total Belanja'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOYALTY.map((l, i) => {
                  const tier = TIER[l.tier];
                  const TierIcon = tier.icon;
                  return (
                    <tr key={l.name} style={{ borderBottom: i < LOYALTY.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{l.company}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span className="flex items-center gap-1.5" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: tier.color, background: tier.color + '1A' }}>
                          <TierIcon size={11} /> {l.tier}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: tier.color }}>{l.points.toLocaleString()} pts</td>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{l.spend}</td>
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

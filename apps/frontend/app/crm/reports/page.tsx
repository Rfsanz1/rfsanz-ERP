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

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function CrmReportsPage() {
  const { token } = useAuthStore();
  const router    = useRouter();


  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/reports">
      <div style={{ maxWidth: 1000 }} className="space-y-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Laporan CRM</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Performa pipeline dan konversi prospek</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Prospek (YTD)', value: '93',        icon: Star,       accent: '#8B5CF6' },
            { label: 'Won (YTD)',           value: '50',        icon: TrendingUp, accent: '#10B981' },
            { label: 'Conversion Rate',     value: '53.8%',     icon: Users,      accent: '#3B82F6' },
            { label: 'Revenue Pipeline',    value: 'Rp 638 Jt', icon: DollarSign, accent: '#F59E0B' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: s.accent, margin: 0 }}>{s.value}</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.accent + '1A' }}>
                  <s.icon size={16} style={{ color: s.accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Pipeline per Bulan</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Bulan','Prospek Baru','Kualifikasi','Won','Nilai Tertutup'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHLY.map((m, i) => (
                  <tr key={m.bulan} style={{ borderBottom: i < MONTHLY.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{m.bulan}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{m.baru}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{m.kualifikasi}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#10B981' }}>{m.won}</td>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{m.nilai}</td>
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

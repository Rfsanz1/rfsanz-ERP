'use client';
import { useState } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Plus, Search, Phone, Mail, TrendingUp } from 'lucide-react';

const LEADS = [
  { name: 'Budi Santoso',  company: 'PT Maju Sejahtera',  stage: 'Negosiasi',   value: 'Rp 24 Jt', prob: 80, phone: '0812-3456-7890', email: 'budi@maju.co.id' },
  { name: 'Siti Rahayu',   company: 'CV Berkah Utama',    stage: 'Proposal',    value: 'Rp 18 Jt', prob: 60, phone: '0813-2345-6789', email: 'siti@berkah.com' },
  { name: 'Ahmad Fauzi',   company: 'UD Karya Bersama',   stage: 'Kualifikasi', value: 'Rp 9 Jt',  prob: 35, phone: '0815-3456-7891', email: 'ahmad@karya.id' },
  { name: 'Dewi Kusuma',   company: 'PT Global Mandiri',  stage: 'Proposal',    value: 'Rp 32 Jt', prob: 55, phone: '0811-4567-8902', email: 'dewi@global.co.id' },
  { name: 'Hari Pratama',  company: 'CV Sentosa Jaya',    stage: 'Baru',        value: 'Rp 12 Jt', prob: 20, phone: '0817-5678-9013', email: 'hari@sentosa.com' },
  { name: 'Lestari Wulan', company: 'PT Nusantara Abadi', stage: 'Kualifikasi', value: 'Rp 45 Jt', prob: 40, phone: '0819-6789-0124', email: 'lestari@nusantara.co.id' },
];

const STAGE: Record<string, { color: string; bg: string }> = {
  'Baru':        { color: '#94A3B8', bg: 'rgba(148,163,184,.12)' },
  'Kualifikasi': { color: '#3B82F6', bg: 'rgba(59,130,246,.10)' },
  'Proposal':    { color: '#F59E0B', bg: 'rgba(245,158,11,.10)' },
  'Negosiasi':   { color: '#8B5CF6', bg: 'rgba(139,92,246,.10)' },
  'Menang':      { color: '#10B981', bg: 'rgba(16,185,129,.10)' },
};

const TH_STYLE: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function CrmLeadsPage() {
  const [search, setSearch] = useState('');
  const filtered = LEADS.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/leads">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Prospek (Leads)</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola pipeline prospek penjualan Anda</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={15} /> Prospek Baru
          </button>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Semua',        count: LEADS.length,                                        color: '#6366F1' },
            { label: 'Proposal',     count: LEADS.filter(l => l.stage === 'Proposal').length,    color: '#F59E0B' },
            { label: 'Negosiasi',    count: LEADS.filter(l => l.stage === 'Negosiasi').length,   color: '#8B5CF6' },
            { label: 'Kualifikasi',  count: LEADS.filter(l => l.stage === 'Kualifikasi').length, color: '#3B82F6' },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 100, background: p.color + '12', border: '1px solid ' + p.color + '30' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.count}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nama / perusahaan…" />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Kontak', 'Perusahaan', 'Stage', 'Nilai', 'Probabilitas', 'Aksi'].map(h => (
                    <th key={h} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const st = STAGE[l.stage] ?? STAGE['Baru'];
                  return (
                    <tr key={l.name} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div className="flex items-center gap-2.5">
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6366F11A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#6366F1', flexShrink: 0 }}>
                            {l.name.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{l.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{l.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{l.company}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: st.color, background: st.bg }}>{l.stage}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{l.value}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div className="flex items-center gap-2">
                          <div style={{ height: 6, width: 64, borderRadius: 100, background: 'var(--border)' }}>
                            <div style={{ height: '100%', borderRadius: 100, background: l.prob >= 60 ? '#10B981' : l.prob >= 35 ? '#F59E0B' : '#94A3B8', width: `${l.prob}%` }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: l.prob >= 60 ? '#10B981' : l.prob >= 35 ? '#F59E0B' : '#94A3B8', minWidth: 32 }}>{l.prob}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div className="flex gap-2">
                          <button style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }} title="Telepon"><Phone size={13} /></button>
                          <button style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }} title="Email"><Mail size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada prospek ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} prospek
          </div>
        </div>
      </div>
    </AppShell>
  );
}

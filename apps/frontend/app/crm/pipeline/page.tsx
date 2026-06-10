'use client';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Plus } from 'lucide-react';

const STAGES = [
  { label: 'Baru',        color: '#94A3B8', bg: 'rgba(148,163,184,.08)', leads: [
    { name: 'Hari P.',    company: 'CV Sentosa',    value: 'Rp 12 Jt' },
    { name: 'Lestari W.', company: 'PT Nusantara',  value: 'Rp 45 Jt' },
  ]},
  { label: 'Kualifikasi', color: '#3B82F6', bg: 'rgba(59,130,246,.08)', leads: [
    { name: 'Ahmad F.',   company: 'UD Karya',      value: 'Rp 9 Jt' },
    { name: 'Nur H.',     company: 'PT Sukses',     value: 'Rp 28 Jt' },
    { name: 'Rini S.',    company: 'CV Maju',       value: 'Rp 15 Jt' },
  ]},
  { label: 'Proposal',    color: '#F59E0B', bg: 'rgba(245,158,11,.08)', leads: [
    { name: 'Siti R.',    company: 'CV Berkah',     value: 'Rp 18 Jt' },
    { name: 'Dewi K.',    company: 'PT Global',     value: 'Rp 32 Jt' },
  ]},
  { label: 'Negosiasi',   color: '#8B5CF6', bg: 'rgba(139,92,246,.08)', leads: [
    { name: 'Budi S.',    company: 'PT Maju',       value: 'Rp 24 Jt' },
  ]},
  { label: 'Menang',      color: '#10B981', bg: 'rgba(16,185,129,.08)', leads: [
    { name: 'Toni H.',    company: 'UD Karya',      value: 'Rp 8 Jt' },
    { name: 'Maya A.',    company: 'PT Prima',      value: 'Rp 19 Jt' },
    { name: 'Dian P.',    company: 'CV Barokah',    value: 'Rp 11 Jt' },
  ]},
];

export default function CrmPipelinePage() {
  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/pipeline">
      <div style={{ maxWidth: '100%' }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Pipeline Penjualan</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Tampilan Kanban pipeline CRM</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Prospek
          </button>
        </div>

        {/* Kanban columns */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>
          {STAGES.map(stage => (
            <div key={stage.label} style={{ flexShrink: 0, width: 240 }}>

              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, color: stage.color, background: stage.bg, letterSpacing: '0.02em' }}>
                  {stage.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 100, padding: '2px 8px' }}>
                  {stage.leads.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stage.leads.map(l => (
                  <div key={l.name} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = stage.color + '80'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-xs)'; }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{l.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 8px' }}>{l.company}</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: stage.color, margin: 0 }}>{l.value}</p>
                  </div>
                ))}
                <button style={{ width: '100%', padding: '8px', borderRadius: 10, border: `1px dashed ${stage.color}60`, background: stage.bg, color: stage.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = stage.bg.replace('.08', '.14'); }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = stage.bg; }}>
                  + Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

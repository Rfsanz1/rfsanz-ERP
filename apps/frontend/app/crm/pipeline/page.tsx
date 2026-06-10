'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Plus } from 'lucide-react';

const STAGES = [
  { label: 'Baru',        color: '#9CA3AF', bg: 'rgba(165,163,174,.08)', leads: [
    { name: 'Hari P.',   company: 'CV Sentosa',    value: 'Rp 12 Jt' },
    { name: 'Lestari W.', company: 'PT Nusantara', value: 'Rp 45 Jt' },
  ]},
  { label: 'Kualifikasi', color: '#2196F3', bg: 'rgba(33,150,243,.08)', leads: [
    { name: 'Ahmad F.',  company: 'UD Karya',      value: 'Rp 9 Jt' },
    { name: 'Nur H.',    company: 'PT Sukses',     value: 'Rp 28 Jt' },
    { name: 'Rini S.',   company: 'CV Maju',       value: 'Rp 15 Jt' },
  ]},
  { label: 'Proposal',    color: '#FF9800', bg: 'rgba(255,152,0,.08)', leads: [
    { name: 'Siti R.',   company: 'CV Berkah',     value: 'Rp 18 Jt' },
    { name: 'Dewi K.',   company: 'PT Global',     value: 'Rp 32 Jt' },
  ]},
  { label: 'Negosiasi',   color: '#8E24AA', bg: 'rgba(142,36,170,.08)', leads: [
    { name: 'Budi S.',   company: 'PT Maju',       value: 'Rp 24 Jt' },
  ]},
  { label: 'Won',         color: '#4CAF50', bg: 'rgba(76,175,80,.08)', leads: [
    { name: 'Toni H.',   company: 'UD Karya',      value: 'Rp 8 Jt' },
    { name: 'Maya A.',   company: 'PT Prima',      value: 'Rp 19 Jt' },
    { name: 'Dian P.',   company: 'CV Barokah',    value: 'Rp 11 Jt' },
  ]},
];

export default function CrmPipelinePage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/pipeline">
      <div className="p-6 space-y-6 max-w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pipeline Penjualan</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kanban view pipeline CRM</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: CRM_CONFIG.appColor }}>
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage.label} className="flex-shrink-0 w-60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: stage.color, backgroundColor: stage.bg }}>{stage.label}</span>
                <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{stage.leads.length}</span>
              </div>
              <div className="space-y-2">
                {stage.leads.map((l) => (
                  <div key={l.name} className="bg-white rounded-xl p-3.5 cursor-pointer transition" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE8F5'; }}>
                    <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{l.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{l.company}</p>
                    <p className="text-xs font-bold mt-2" style={{ color: stage.color }}>{l.value}</p>
                  </div>
                ))}
                <button className="w-full py-2 rounded-xl text-xs text-center transition" style={{ border: `1px dashed ${stage.color}`, color: stage.color, backgroundColor: stage.bg }}>
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

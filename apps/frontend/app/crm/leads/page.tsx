'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Star, Plus, Search, Phone, Mail } from 'lucide-react';

const LEADS = [
  { name: 'Budi Santoso',   company: 'PT Maju Sejahtera',  stage: 'Negosiasi',   value: 'Rp 24 Jt', prob: 80, phone: '0812-3456-7890', email: 'budi@majusejahtera.co.id' },
  { name: 'Siti Rahayu',    company: 'CV Berkah Utama',    stage: 'Proposal',    value: 'Rp 18 Jt', prob: 60, phone: '0813-2345-6789', email: 'siti@berkahutama.com' },
  { name: 'Ahmad Fauzi',    company: 'UD Karya Bersama',   stage: 'Kualifikasi', value: 'Rp 9 Jt',  prob: 35, phone: '0815-3456-7891', email: 'ahmad@karyabersama.id' },
  { name: 'Dewi Kusuma',    company: 'PT Global Mandiri',  stage: 'Proposal',    value: 'Rp 32 Jt', prob: 55, phone: '0811-4567-8902', email: 'dewi@globalmandiri.co.id' },
  { name: 'Hari Pratama',   company: 'CV Sentosa Jaya',    stage: 'Baru',        value: 'Rp 12 Jt', prob: 20, phone: '0817-5678-9013', email: 'hari@sentosajaya.com' },
  { name: 'Lestari Wulan',  company: 'PT Nusantara Abadi', stage: 'Kualifikasi', value: 'Rp 45 Jt', prob: 40, phone: '0819-6789-0124', email: 'lestari@nusantara.co.id' },
];

const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  'Baru':        { color: '#9CA3AF', bg: 'rgba(165,163,174,.12)' },
  'Kualifikasi': { color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  'Proposal':    { color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  'Negosiasi':   { color: '#8E24AA', bg: 'rgba(142,36,170,.1)' },
  'Won':         { color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
};

export default function CrmLeadsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/leads">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Prospek (Leads)</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola pipeline prospek penjualan</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: CRM_CONFIG.appColor }}>
            <Plus className="h-4 w-4" /> Prospek Baru
          </button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari prospek..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                  {['Kontak', 'Perusahaan', 'Stage', 'Nilai', 'Probabilitas', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEADS.map((l, i) => {
                  const st = STAGE_STYLE[l.stage] ?? STAGE_STYLE['Baru'];
                  return (
                    <tr key={l.name} style={{ borderBottom: i < LEADS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: CRM_CONFIG.appColor }}>{l.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{l.name}</p>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>{l.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{l.company}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>{l.stage}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{l.value}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: '#F5F2FB' }}>
                            <div className="h-1.5 rounded-full" style={{ backgroundColor: '#4CAF50', width: `${l.prob}%` }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: '#4CAF50' }}>{l.prob}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }} title="Telepon"><Phone className="h-3.5 w-3.5" /></button>
                          <button className="p-1.5 rounded-lg" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }} title="Email"><Mail className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
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

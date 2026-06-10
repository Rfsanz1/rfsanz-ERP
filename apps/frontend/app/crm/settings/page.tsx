'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Save } from 'lucide-react';

const FIELDS = [
  { label: 'Stage Pipeline Default',   placeholder: 'Prospek, Kualifikasi, Proposal, Won' },
  { label: 'Target Revenue Bulanan',   placeholder: 'Rp 500.000.000' },
  { label: 'Rotasi Lead Otomatis',     placeholder: 'Aktif / Nonaktif' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, outline: 'none',
  border: '1px solid var(--border)', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function CrmSettingsPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/settings">
      <div style={{ maxWidth: 640 }} className="space-y-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Pengaturan CRM</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Konfigurasi modul CRM dan pipeline</p>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
              <input style={inputStyle} placeholder={f.placeholder}
                onFocus={e => { e.target.style.borderColor = CRM_CONFIG.appColor; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: 'none', background: CRM_CONFIG.appColor, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            <Save size={13} /> Simpan
          </button>
        </div>
      </div>
    </AppShell>
  );
}

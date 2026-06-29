'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';
import {
  Building2, Users, Globe2, Hash, Mail, Smartphone,
  HardDrive, Link2, FileSearch, Save, RefreshCw,
  ChevronRight, Check, AlertCircle, Tags, FolderOpen,
} from 'lucide-react';

const MENU_CARDS = [
  { href: '/settings/users',            label: 'Users & Roles',    icon: Users,      color: '#6366F1', bg: '#F0F0FE' },
  { href: '/settings/companies',        label: 'Multi Perusahaan', icon: Globe2,     color: '#0EA5E9', bg: '#F0F9FF' },
  { href: '/settings/document-numbers', label: 'Nomor Dokumen',    icon: Hash,       color: '#D97706', bg: '#FFFBEB' },
  { href: '/settings/email-gateway',    label: 'Email Gateway',    icon: Mail,       color: '#059669', bg: '#F0FDF4' },
  { href: '/settings/wa-gateway',       label: 'WA Gateway',       icon: Smartphone, color: '#16A34A', bg: '#F0FDF4' },
  { href: '/settings/api-integration',  label: 'API & Integrasi',  icon: Link2,      color: '#7C3AED', bg: '#F5F3FF' },
  { href: '/settings/kategori-produk',   label: 'Kategori Produk',  icon: FolderOpen, color: '#7C3AED', bg: '#F5F3FF' },
  { href: '/settings/keywords',         label: 'Deteksi Produk',   icon: Tags,       color: '#F59E0B', bg: '#FFFBEB' },
  { href: '/settings/backup',           label: 'Backup & Restore', icon: HardDrive,  color: '#DC2626', bg: '#FEF2F2' },
  { href: '/settings/audit-log',        label: 'Audit Log',        icon: FileSearch, color: '#6B7280', bg: '#F9FAFB' },
];

const COMPANY_FIELDS = [
  { key: 'company_name',     label: 'Nama Perusahaan',   type: 'text',  wide: true  },
  { key: 'company_address',  label: 'Alamat',            type: 'text',  wide: true  },
  { key: 'company_phone',    label: 'Telepon',           type: 'text',  wide: false },
  { key: 'company_email',    label: 'Email',             type: 'email', wide: false },
  { key: 'company_npwp',     label: 'NPWP',              type: 'text',  wide: false },
  { key: 'company_website',  label: 'Website',           type: 'text',  wide: false },
  { key: 'company_currency', label: 'Mata Uang',         type: 'text',  wide: false },
  { key: 'fiscal_year_start',label: 'Awal Tahun Fiskal', type: 'text',  wide: false },
];

export default function SettingsPage() {
  const { token } = useAuthStore();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/settings'); setSettings(r.data ?? {}); }
    catch {} finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setMsg({ ok: true, text: 'Tersimpan!' });
      setTimeout(() => setMsg(null), 2500);
    } catch {
      setMsg({ ok: false, text: 'Gagal menyimpan.' });
    } finally { setSaving(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);


  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Profil Perusahaan ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 size={15} style={{ color: '#6366F1' }} />
            <span className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Profil Perusahaan</span>
          </div>

          <div className="flex items-center gap-2">
            {msg && (
              <span className="flex items-center gap-1 text-xs font-medium"
                style={{ color: msg.ok ? '#16A34A' : '#DC2626' }}>
                {msg.ok ? <Check size={12} /> : <AlertCircle size={12} />}
                {msg.text}
              </span>
            )}
            <button onClick={load}
              className="p-2 rounded-lg transition"
              style={{ background: '#F3F4F6', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#6366F1', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              Simpan
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 52, borderRadius: 8, background: '#F3F4F6' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {COMPANY_FIELDS.map(f => (
                <div key={f.key} className={`space-y-1 ${f.wide ? 'col-span-2' : ''}`}>
                  <label className="text-xs font-medium" style={{ color: '#6B7280' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={settings[f.key] ?? ''}
                    onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={`${f.label}…`}
                    className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                    style={{ border: '1px solid #E5E7EB', background: '#FAFAFA', color: '#1E1B4B' }}
                    onFocus={e => (e.target.style.borderColor = '#6366F1')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Menu Pengaturan ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            Menu Lainnya
          </span>
          <div className="flex-1 h-px" style={{ background: '#F3F4F6' }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MENU_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
                <div
                  className="flex flex-col items-start gap-2 rounded-xl p-3.5 transition-all hover:shadow-sm cursor-pointer group"
                  style={{ background: '#fff', border: '1px solid #E5E7EB' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = card.color + '55';
                    (e.currentTarget as HTMLElement).style.background = card.bg;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
                    (e.currentTarget as HTMLElement).style.background = '#fff';
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: card.bg }}>
                    <Icon size={15} style={{ color: card.color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold leading-tight" style={{ color: '#374151' }}>
                      {card.label}
                    </span>
                    <ChevronRight size={12} style={{ color: '#D1D5DB' }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}

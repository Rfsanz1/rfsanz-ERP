'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';
import {
  Building2, Users, Globe2, Hash, Mail, Smartphone,
  HardDrive, Link2, FileSearch, Save, RefreshCw,
  ChevronRight, Check, AlertCircle,
} from 'lucide-react';

const MENU_CARDS = [
  {
    href: '/settings/users',
    label: 'Users & Roles',
    icon: Users,
    color: '#6366F1',
    bg: 'rgba(99,102,241,.08)',
    desc: 'Kelola pengguna, password, dan hak akses tiap role',
  },
  {
    href: '/settings/companies',
    label: 'Multi Perusahaan',
    icon: Globe2,
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,.08)',
    desc: 'Tambah dan kelola cabang atau entitas perusahaan',
  },
  {
    href: '/settings/document-numbers',
    label: 'Nomor Dokumen',
    icon: Hash,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,.08)',
    desc: 'Format prefix SO, PO, Invoice, dan dokumen lainnya',
  },
  {
    href: '/settings/email-gateway',
    label: 'Email Gateway',
    icon: Mail,
    color: '#10B981',
    bg: 'rgba(16,185,129,.08)',
    desc: 'Konfigurasi SMTP untuk pengiriman email otomatis',
  },
  {
    href: '/settings/wa-gateway',
    label: 'WA Gateway',
    icon: Smartphone,
    color: '#22C55E',
    bg: 'rgba(34,197,94,.08)',
    desc: 'Fonnte WhatsApp untuk notifikasi order dan invoice',
  },
  {
    href: '/settings/api-integration',
    label: 'API & Integrasi',
    icon: Link2,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,.08)',
    desc: 'Hubungkan ke Kledo, Shopee, Tokopedia, TikTok Shop',
  },
  {
    href: '/settings/backup',
    label: 'Backup & Restore',
    icon: HardDrive,
    color: '#EF4444',
    bg: 'rgba(239,68,68,.08)',
    desc: 'Download backup database dan pemulihan data',
  },
  {
    href: '/settings/audit-log',
    label: 'Audit Log',
    icon: FileSearch,
    color: '#6B7280',
    bg: 'rgba(107,114,128,.08)',
    desc: 'Riwayat lengkap aktivitas dan perubahan data pengguna',
  },
];

const COMPANY_FIELDS = [
  { key: 'company_name',     label: 'Nama Perusahaan',   type: 'text'  },
  { key: 'company_address',  label: 'Alamat',            type: 'text'  },
  { key: 'company_phone',    label: 'Telepon',           type: 'text'  },
  { key: 'company_email',    label: 'Email Perusahaan',  type: 'email' },
  { key: 'company_npwp',     label: 'NPWP',              type: 'text'  },
  { key: 'company_website',  label: 'Website',           type: 'text'  },
  { key: 'company_logo',     label: 'URL Logo',          type: 'text'  },
  { key: 'company_currency', label: 'Mata Uang Default', type: 'text'  },
  { key: 'fiscal_year_start',label: 'Awal Tahun Fiskal', type: 'text'  },
];

export default function SettingsPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
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
      setMsg({ ok: true, text: 'Pengaturan berhasil disimpan!' });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg({ ok: false, text: 'Gagal menyimpan pengaturan.' });
    } finally { setSaving(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);
  if (!token) return null;

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Profil Perusahaan ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,.1)' }}>
              <Building2 size={16} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Informasi Perusahaan</h2>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Profil dan identitas bisnis Anda</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: '#6366F1', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div
            className="flex items-center gap-2 mb-4 rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{
              background: msg.ok ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
              color: msg.ok ? '#065F46' : '#991B1B',
            }}
          >
            {msg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}

        {/* Form grid */}
        <div
          className="rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 58, borderRadius: 10, background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
              ))
            : COMPANY_FIELDS.map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={settings[f.key] ?? ''}
                    onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={`Masukkan ${f.label.toLowerCase()}…`}
                    className="w-full text-sm rounded-xl px-3 py-2.5 outline-none transition"
                    style={{ border: '1.5px solid #E5E7EB', background: '#FAFAFA', color: '#1E1B4B' }}
                    onFocus={e => (e.target.style.borderColor = '#6366F1')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              ))}
        </div>
      </section>

      {/* ── Menu pengaturan lainnya ──────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Menu Pengaturan</span>
          <div className="flex-1 h-px" style={{ background: '#EDE9FE' }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {MENU_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
                <div
                  className="flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                  style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: card.bg }}
                  >
                    <Icon size={18} style={{ color: card.color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight" style={{ color: '#1E1B4B' }}>{card.label}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: '#9CA3AF' }}>{card.desc}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: '#D1D5DB', flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}

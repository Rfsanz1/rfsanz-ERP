'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';
import {
  Building2, Users, Globe2, Hash, Mail, Smartphone,
  HardDrive, Link2, FileSearch, Save, RefreshCw,
  ChevronRight, Check, AlertCircle, Shield,
} from 'lucide-react';

const MENU_CARDS = [
  {
    href: '/settings/users',
    label: 'Users & Roles',
    icon: Users,
    color: '#6366F1',
    bg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    lightBg: 'rgba(99,102,241,.08)',
    desc: 'Kelola pengguna dan hak akses',
    stat: 'Manajemen akun',
  },
  {
    href: '/settings/companies',
    label: 'Multi Perusahaan',
    icon: Globe2,
    color: '#0EA5E9',
    bg: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    lightBg: 'rgba(14,165,233,.08)',
    desc: 'Cabang dan entitas bisnis',
    stat: 'Struktur organisasi',
  },
  {
    href: '/settings/document-numbers',
    label: 'Nomor Dokumen',
    icon: Hash,
    color: '#F59E0B',
    bg: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    lightBg: 'rgba(245,158,11,.08)',
    desc: 'Format prefix SO, PO, Invoice',
    stat: 'Penomoran otomatis',
  },
  {
    href: '/settings/email-gateway',
    label: 'Email Gateway',
    icon: Mail,
    color: '#10B981',
    bg: 'linear-gradient(135deg, #10B981, #34D399)',
    lightBg: 'rgba(16,185,129,.08)',
    desc: 'SMTP untuk email otomatis',
    stat: 'Konfigurasi email',
  },
  {
    href: '/settings/wa-gateway',
    label: 'WA Gateway',
    icon: Smartphone,
    color: '#22C55E',
    bg: 'linear-gradient(135deg, #22C55E, #4ADE80)',
    lightBg: 'rgba(34,197,94,.08)',
    desc: 'Notifikasi WhatsApp via Fonnte',
    stat: 'Pesan & notifikasi',
  },
  {
    href: '/settings/api-integration',
    label: 'API & Integrasi',
    icon: Link2,
    color: '#8B5CF6',
    bg: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    lightBg: 'rgba(139,92,246,.08)',
    desc: 'Kledo, Shopee, TikTok Shop',
    stat: 'Koneksi eksternal',
  },
  {
    href: '/settings/backup',
    label: 'Backup & Restore',
    icon: HardDrive,
    color: '#EF4444',
    bg: 'linear-gradient(135deg, #EF4444, #F87171)',
    lightBg: 'rgba(239,68,68,.08)',
    desc: 'Backup dan pemulihan data',
    stat: 'Keamanan data',
  },
  {
    href: '/settings/audit-log',
    label: 'Audit Log',
    icon: FileSearch,
    color: '#6B7280',
    bg: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
    lightBg: 'rgba(107,114,128,.08)',
    desc: 'Riwayat aktivitas pengguna',
    stat: 'Jejak sistem',
  },
];

const COMPANY_FIELDS = [
  { key: 'company_name',     label: 'Nama Perusahaan',   type: 'text',  col: 2 },
  { key: 'company_address',  label: 'Alamat',            type: 'text',  col: 2 },
  { key: 'company_phone',    label: 'Telepon',           type: 'text',  col: 1 },
  { key: 'company_email',    label: 'Email Perusahaan',  type: 'email', col: 1 },
  { key: 'company_npwp',     label: 'NPWP',              type: 'text',  col: 1 },
  { key: 'company_website',  label: 'Website',           type: 'text',  col: 1 },
  { key: 'company_currency', label: 'Mata Uang Default', type: 'text',  col: 1 },
  { key: 'fiscal_year_start',label: 'Awal Tahun Fiskal', type: 'text',  col: 1 },
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

      {/* ── Hero banner ──────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 flex items-center justify-between gap-4 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)' }}
      >
        {/* decorative circles */}
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.04)', top: -60, right: 80 }} />
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.06)', bottom: -40, right: 20 }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} style={{ color: 'rgba(255,255,255,.6)' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,.6)' }}>Konfigurasi Sistem</span>
          </div>
          <h1 className="font-extrabold text-2xl mb-1" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
            Pengaturan ERP
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>
            Kelola profil perusahaan, integrasi, dan konfigurasi sistem
          </p>
        </div>

        <div className="flex-shrink-0 relative z-10 hidden sm:flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: '#fff', color: '#4338CA', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {msg && (
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
          style={{
            background: msg.ok ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
            color: msg.ok ? '#065F46' : '#991B1B',
            border: `1px solid ${msg.ok ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}`,
          }}
        >
          {msg.ok ? <Check size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* ── Form profil perusahaan ───────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 4px 12px rgba(99,102,241,.3)' }}
          >
            <Building2 size={16} style={{ color: '#fff' }} />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Informasi Perusahaan</h2>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Profil dan identitas bisnis Anda</p>
          </div>
          {/* Mobile save buttons */}
          <div className="ml-auto flex gap-2 sm:hidden">
            <button onClick={load} className="p-2 rounded-xl" style={{ background: '#F3F4F6', color: '#6B7280' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: '#6366F1', color: '#fff' }}>
              <Save size={12} /> Simpan
            </button>
          </div>
        </div>

        <div
          className="rounded-3xl p-6"
          style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 1px 8px rgba(99,102,241,.06)' }}
        >
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 58, borderRadius: 12, background: '#F3F4F6', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {COMPANY_FIELDS.map(f => (
                <div key={f.key} className={`space-y-1.5 ${f.col === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={settings[f.key] ?? ''}
                    onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={`${f.label}…`}
                    className="w-full text-sm rounded-xl px-3 py-2.5 outline-none transition"
                    style={{ border: '1.5px solid #E5E7EB', background: '#FAFAFA', color: '#1E1B4B' }}
                    onFocus={e => (e.target.style.borderColor = '#6366F1')}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Menu pengaturan lainnya ──────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            Menu Pengaturan
          </span>
          <div className="flex-1 h-px" style={{ background: '#EDE9FE' }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MENU_CARDS.map(card => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
                <div
                  className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
                  style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}
                >
                  {/* Gradient top strip */}
                  <div style={{ height: 4, background: card.bg }} />

                  <div className="p-4">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: card.lightBg }}
                    >
                      <Icon size={18} style={{ color: card.color }} strokeWidth={1.8} />
                    </div>

                    {/* Label & desc */}
                    <p className="font-bold text-sm leading-tight mb-1" style={{ color: '#1E1B4B' }}>
                      {card.label}
                    </p>
                    <p className="text-xs leading-snug" style={{ color: '#9CA3AF' }}>
                      {card.desc}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: card.lightBg, color: card.color }}>
                        {card.stat}
                      </span>
                      <ChevronRight
                        size={14}
                        style={{ color: card.color, transition: 'transform .15s' }}
                        className="group-hover:translate-x-0.5"
                      />
                    </div>
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

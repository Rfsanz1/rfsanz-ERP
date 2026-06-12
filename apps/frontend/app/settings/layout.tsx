'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Users, Globe2, Hash, Mail, Smartphone,
  HardDrive, Link2, FileSearch, ChevronRight, Wifi,
} from 'lucide-react';

const MENU = [
  { href: '/settings',                  label: 'Umum',             icon: Building2,  desc: 'Profil & informasi perusahaan' },
  { href: '/settings/users',            label: 'Users & Roles',    icon: Users,       desc: 'Kelola pengguna dan hak akses' },
  { href: '/settings/companies',        label: 'Multi Perusahaan', icon: Globe2,      desc: 'Cabang dan entitas perusahaan' },
  { href: '/settings/document-numbers', label: 'Nomor Dokumen',    icon: Hash,        desc: 'Format prefix dokumen otomatis' },
  { href: '/settings/email-gateway',    label: 'Email Gateway',    icon: Mail,        desc: 'Konfigurasi SMTP untuk email' },
  { href: '/settings/wa-gateway',       label: 'WA Gateway',       icon: Smartphone,  desc: 'Fonnte WhatsApp notifikasi' },
  { href: '/settings/api-integration',  label: 'API & Integrasi',  icon: Link2,       desc: 'Kledo, Fonnte, marketplace' },
  { href: '/settings/connection',       label: 'Koneksi Server',   icon: Wifi,        desc: 'URL server untuk app mobile' },
  { href: '/settings/backup',           label: 'Backup & Restore', icon: HardDrive,   desc: 'Backup dan pemulihan data' },
  { href: '/settings/audit-log',        label: 'Audit Log',        icon: FileSearch,  desc: 'Riwayat aktivitas pengguna' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/settings' ? pathname === '/settings' : pathname.startsWith(href);

  return (
    <div className="flex gap-0 min-h-0">
      {/* ── Left menu ─────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: 220,
          background: '#fff',
          borderRight: '1px solid #EDE9FE',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 16px 10px', borderBottom: '1px solid #F3F4F6' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>Pengaturan</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>Konfigurasi sistem ERP</p>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
          {MENU.map(item => {
            const Icon   = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 10, marginBottom: 2,
                    background: active ? 'rgba(99,102,241,.08)' : 'transparent',
                    borderLeft: active ? '3px solid #6366F1' : '3px solid transparent',
                    transition: 'all .14s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon
                    size={15}
                    strokeWidth={active ? 2.2 : 1.8}
                    style={{ color: active ? '#6366F1' : '#9CA3AF', flexShrink: 0 }}
                  />
                  <span style={{
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#1E1B4B' : '#374151',
                    flex: 1,
                  }}>
                    {item.label}
                  </span>
                  {active && <ChevronRight size={12} style={{ color: '#6366F1', flexShrink: 0 }} />}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Content ───────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, padding: '24px 28px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

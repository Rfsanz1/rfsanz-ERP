'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Package, ClipboardList, User } from 'lucide-react';

const C = '#475569';

const NAV_ITEMS = [
  { href: '/driver',            label: 'Beranda',  icon: Home },
  { href: '/driver/deliveries', label: 'Tugas',    icon: Package },
  { href: '/driver/history',    label: 'Riwayat',  icon: ClipboardList },
  { href: '/driver/profile',    label: 'Profil',   icon: User },
];

export default function DriverBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,.08)' }}>
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href || (item.href !== '/driver' && pathname?.startsWith(item.href));
        return (
          <button key={item.href} onClick={() => router.push(item.href)}
            style={{ flex: 1, padding: '10px 0 8px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all .15s' }}>
            <div style={{ width: 36, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: active ? `${C}15` : 'transparent', transition: 'background .2s' }}>
              <item.icon size={20} style={{ color: active ? C : '#94A3B8' }} />
            </div>
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color: active ? C : '#94A3B8' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

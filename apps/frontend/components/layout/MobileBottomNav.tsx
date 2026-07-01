'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Users, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',      label: 'Beranda',  icon: LayoutDashboard },
  { href: '/sales/smart-order', label: 'Buat Order', icon: ShoppingCart },
  { href: '/sales/orders',   label: 'Pesanan',  icon: ClipboardList },
  { href: '/sales/customers',label: 'Pelanggan',icon: Users },
  { href: '/settings',       label: 'Pengaturan',icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        backgroundColor: 'var(--surface)',
        borderTop: '1.5px solid var(--border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
      }}
      className="lg:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 4px 10px',
              gap: 4,
              textDecoration: 'none',
              color: active ? '#6366F1' : '#94A3B8',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute',
                width: 36,
                height: 3,
                borderRadius: '0 0 6px 6px',
                background: '#6366F1',
                top: 0,
              }} />
            )}
            <Icon size={24} strokeWidth={active ? 2.4 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, lineHeight: 1 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

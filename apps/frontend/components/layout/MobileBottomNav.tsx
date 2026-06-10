'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, DollarSign, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales/orders',       label: 'Penjualan',  icon: ShoppingCart },
  { href: '/inventory/products', label: 'Stok',       icon: Package },
  { href: '/accounting',         label: 'Keuangan',   icon: DollarSign },
  { href: '/settings',           label: 'Pengaturan', icon: Settings },
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
        borderTop: '1px solid var(--border)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }}
      className="lg:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const base = href.split('/').slice(0, 2).join('/');
        const active = pathname === href || pathname.startsWith(base + '/') || pathname === base;
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
              padding: '10px 4px 8px',
              gap: 3,
              textDecoration: 'none',
              color: active ? '#6366F1' : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute',
                width: 32,
                height: 3,
                borderRadius: '0 0 4px 4px',
                background: '#6366F1',
                top: 0,
              }} />
            )}
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, lineHeight: 1 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

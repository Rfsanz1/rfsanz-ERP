'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, DollarSign, Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales',       label: 'Penjualan',  icon: ShoppingCart },
  { href: '/inventory/products', label: 'Stok', icon: Package },
  { href: '/finance/cash', label: 'Keuangan',  icon: DollarSign },
  { href: '/settings',    label: 'Pengaturan', icon: Settings },
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
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
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
              padding: '10px 4px 8px',
              gap: 3,
              textDecoration: 'none',
              color: active ? '#7367F0' : '#9CA3AF',
              transition: 'color 0.15s',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, lineHeight: 1 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

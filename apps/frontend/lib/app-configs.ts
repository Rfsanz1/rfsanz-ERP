import { BarChart2, Package, ShoppingCart, Truck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AppRole = 'Super Admin' | 'Owner' | 'Admin' | 'Sales' | 'Gudang' | 'Driver';

export interface AppLaunchCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[];
  color: string;
}

export const APPS: AppLaunchCard[] = [
  {
    title: 'ERP Core',
    description: 'Panel Owner dan Admin untuk monitoring, laporan, dan manajemen seluruh operasi.',
    href: '/dashboard',
    icon: BarChart2,
    roles: ['Super Admin', 'Owner', 'Admin'],
    color: '#7B1FA2',
  },
  {
    title: 'Sales App',
    description: 'Aplikasi mobile-first untuk input order cepat, quotation, CRM, dan target sales.',
    href: '/sales',
    icon: ShoppingCart,
    roles: ['Super Admin', 'Owner', 'Admin', 'Sales'],
    color: '#00ACC1',
  },
  {
    title: 'Gudang App',
    description: 'Aplikasi gudang untuk picking order, barang masuk/keluar, transfer, dan stock opname.',
    href: '/gudang',
    icon: Package,
    roles: ['Super Admin', 'Owner', 'Admin', 'Gudang'],
    color: '#F57C00',
  },
  {
    title: 'Driver App',
    description: 'Aplikasi delivery untuk melihat tugas, maps, upload bukti, dan tanda tangan pelanggan.',
    href: '/driver',
    icon: Truck,
    roles: ['Super Admin', 'Owner', 'Admin', 'Driver'],
    color: '#1565C0',
  },
];

export function canAccessApp(userRoles: string[] = [], appRoles: string[]) {
  const normalizedUserRoles = userRoles.map((r) => r.toLowerCase());
  return appRoles.some((role) => normalizedUserRoles.includes(role.toLowerCase()));
}

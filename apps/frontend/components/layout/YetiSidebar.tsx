'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ShoppingCart, Package, FileText,
  BarChart2, Settings, Bell, ChevronDown, ChevronRight,
  Truck, DollarSign, UserCheck, Building2,
  BookOpen, CreditCard, Target, Brain, Megaphone, Globe,
  Car, Navigation,
} from 'lucide-react';

interface NavChild {
  href: string;
  label: string;
}

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  children?: NavChild[];
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'MENU UTAMA',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'PENJUALAN',
    items: [
      {
        label: 'Penjualan', icon: ShoppingCart,
        children: [
          { href: '/sales/quotations', label: 'Quotation' },
          { href: '/sales/orders', label: 'Sales Orders' },
          { href: '/sales/pricelists', label: 'Price List' },
          { href: '/sales/teams', label: 'Sales Team' },
          { href: '/sales/targets', label: 'Sales Target' },
          { href: '/sales/commission', label: 'Komisi Sales' },
          { href: '/reports/sales', label: 'Laporan' },
        ],
      },
      {
        label: 'Pembelian', icon: Truck,
        children: [
          { href: '/purchasing/purchase-orders', label: 'Purchase Orders' },
          { href: '/purchasing/rfq', label: 'RFQ' },
          { href: '/purchasing/suppliers', label: 'Supplier' },
          { href: '/purchasing/reports', label: 'Laporan' },
        ],
      },
      {
        label: 'Invoice', icon: FileText,
        children: [
          { href: '/invoice/list', label: 'Daftar Invoice' },
          { href: '/invoice/down-payment', label: 'Down Payment' },
          { href: '/invoice/recurring', label: 'Recurring Invoice' },
          { href: '/invoice/payments', label: 'Pembayaran' },
          { href: '/invoice/aging', label: 'Aging Report' },
          { href: '/invoice/credit-notes', label: 'Kredit Nota' },
        ],
      },
      {
        label: 'Inventory', icon: Package,
        children: [
          { href: '/inventory/products', label: 'Produk' },
          { href: '/inventory/lots', label: 'Lot & Serial' },
          { href: '/inventory/transfers', label: 'Transfer Stok' },
          { href: '/inventory/stock-opnames', label: 'Stock Opname' },
          { href: '/inventory/warehouses', label: 'Multi Gudang' },
          { href: '/inventory/reorder-rules', label: 'Reorder Rules' },
          { href: '/inventory/reports', label: 'Laporan' },
        ],
      },
      { href: '/gudang', label: 'Gudang', icon: Building2 },
      { href: '/inventory/deliveries', label: 'Pengiriman', icon: Navigation },
    ],
  },
  {
    label: 'KEUANGAN',
    items: [
      {
        label: 'Keuangan', icon: DollarSign,
        children: [
          { href: '/finance/journal-entries', label: 'Jurnal' },
          { href: '/accounting/chart-of-accounts', label: 'Bagan Akun' },
          { href: '/keuangan/rekonsiliasi', label: 'Rekonsiliasi Bank' },
          { href: '/finance/cash', label: 'Kas & Bank' },
          { href: '/finance/budget', label: 'Anggaran' },
          { href: '/finance/fixed-assets', label: 'Aset Tetap' },
          { href: '/finance/expenses', label: 'Pengeluaran' },
        ],
      },
      {
        label: 'Laporan', icon: BarChart2,
        children: [
          { href: '/keuangan/laporan/laba-rugi', label: 'Laba & Rugi' },
          { href: '/keuangan/laporan/neraca', label: 'Neraca' },
          { href: '/keuangan/laporan/arus-kas', label: 'Arus Kas' },
          { href: '/keuangan/laporan/buku-besar', label: 'Buku Besar' },
          { href: '/finance/reports', label: 'Laporan Keuangan' },
        ],
      },
    ],
  },
  {
    label: 'SDM & OPERASI',
    items: [
      {
        label: 'Karyawan', icon: Users,
        children: [
          { href: '/hr/employees', label: 'Data Karyawan' },
          { href: '/hr/attendances', label: 'Absensi' },
          { href: '/hr/leaves', label: 'Cuti & Izin' },
          { href: '/hr/organization', label: 'Struktur Organisasi' },
          { href: '/hr/reports', label: 'Laporan SDM' },
        ],
      },
      {
        label: 'Payroll', icon: BookOpen,
        children: [
          { href: '/hr/payrolls/periods', label: 'Periode Gaji' },
          { href: '/hr/payrolls/slips', label: 'Slip Gaji' },
          { href: '/hr/payrolls/batch', label: 'Slip Massal' },
          { href: '/hr/payrolls/bank-export', label: 'Export Bank' },
          { href: '/hr/payrolls/reports', label: 'Laporan Payroll' },
        ],
      },
      { href: '/pos/cashier', label: 'Point of Sale', icon: CreditCard },
      {
        label: 'CRM', icon: Target,
        children: [
          { href: '/crm/leads', label: 'Leads' },
          { href: '/crm/pipeline', label: 'Pipeline' },
          { href: '/crm/opportunities', label: 'Opportunity' },
          { href: '/crm/activities', label: 'Aktivitas' },
          { href: '/customers', label: 'Pelanggan' },
        ],
      },
    ],
  },
  {
    label: 'DIGITAL',
    items: [
      { href: '/ai', label: 'AI Assistant', icon: Brain, badge: 'AI', badgeColor: '#8B5CF6' },
      { href: '/marketing', label: 'Marketing', icon: Megaphone },
      { href: '/website', label: 'Website', icon: Globe },
      { href: '/notifications', label: 'Notifikasi', icon: Bell, badge: '5', badgeColor: '#EA5455' },
    ],
  },
  {
    label: 'SISTEM',
    items: [
      {
        label: 'Pengaturan', icon: Settings,
        children: [
          { href: '/settings', label: 'Umum' },
          { href: '/settings/roles', label: 'Users & Roles' },
          { href: '/settings/companies', label: 'Multi Perusahaan' },
          { href: '/settings/document-numbers', label: 'Nomor Dokumen' },
          { href: '/settings/email-gateway', label: 'Email Gateway' },
          { href: '/settings/wa-gateway', label: 'WA Gateway' },
          { href: '/settings/backup', label: 'Backup & Restore' },
          { href: '/settings/audit-log', label: 'Audit Log' },
        ],
      },
    ],
  },
];

const LS_KEY = 'yeti_sidebar_open';

function loadOpenGroups(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveOpenGroups(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(state));
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function YetiSidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // Load localStorage only after mount (avoid SSR mismatch)
  useEffect(() => {
    const saved = loadOpenGroups();
    // Also auto-open group containing active child
    const autoOpen: Record<string, boolean> = { ...saved };
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children?.some((c) => pathname.startsWith(c.href))) {
          autoOpen[item.label] = true;
        }
      });
    });
    setOpenGroups(autoOpen);
    setMounted(true);
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      saveOpenGroups(next);
      return next;
    });
  };

  const isActive = (href?: string) =>
    href ? pathname === href || pathname.startsWith(href + '/') : false;
  const isChildActive = (children?: NavChild[]) =>
    children?.some((c) => isActive(c.href));

  return (
    <aside
      className={[
        'fixed top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 ease-in-out',
        'lg:relative lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'lg:w-[64px]' : 'lg:w-[240px]',
        'w-[240px]',
      ].join(' ')}
      style={{ backgroundColor: '#1B2A3B', color: '#CBD5E1' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b flex-shrink-0"
        style={{ borderColor: '#243447', minHeight: '64px' }}
      >
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #8C57FF)' }}
        >
          GM
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Gentong Mas</p>
            <p className="text-[10px] truncate" style={{ color: '#64748B' }}>Enterprise ERP</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-0.5">
            {!collapsed && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest" style={{ color: '#475569' }}>
                {group.label}
              </p>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const hasChildren = !!item.children?.length;
              const childActive = isChildActive(item.children);
              const active = hasChildren ? childActive : isActive(item.href);
              const isOpen = mounted ? (openGroups[item.label] ?? false) : childActive;

              if (hasChildren) {
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
                      style={
                        active
                          ? { backgroundColor: 'rgba(59,130,246,0.15)', color: '#93C5FD', borderLeft: '3px solid #3B82F6' }
                          : { color: '#94A3B8' }
                      }
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <Icon
                        className="h-[18px] w-[18px] flex-shrink-0"
                        style={{ color: active ? '#60A5FA' : '#64748B' }}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left" style={{ color: active ? '#93C5FD' : '#94A3B8' }}>
                            {item.label}
                          </span>
                          {isOpen
                            ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#475569' }} />
                            : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#475569' }} />
                          }
                        </>
                      )}
                    </button>

                    {!collapsed && isOpen && (
                      <div style={{ backgroundColor: '#162031' }}>
                        {item.children!.map((child) => {
                          const ca = isActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onMobileClose}
                              className="flex items-center gap-2.5 pl-11 pr-4 py-2 text-[13px] transition-colors duration-150"
                              style={{ color: ca ? '#60A5FA' : '#64748B' }}
                              onMouseEnter={(e) => { if (!ca) e.currentTarget.style.color = '#CBD5E1'; }}
                              onMouseLeave={(e) => { if (!ca) e.currentTarget.style.color = '#64748B'; }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: ca ? '#60A5FA' : '#334155' }}
                              />
                              <span className={ca ? 'font-medium' : ''}>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Leaf item
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={onMobileClose}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150"
                  style={
                    active
                      ? { backgroundColor: 'rgba(59,130,246,0.15)', color: '#93C5FD', borderLeft: '3px solid #3B82F6' }
                      : { color: '#94A3B8' }
                  }
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = active ? 'rgba(59,130,246,0.15)' : 'transparent'; }}
                >
                  <Icon
                    className="h-[18px] w-[18px] flex-shrink-0"
                    style={{ color: active ? '#60A5FA' : '#64748B' }}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: item.badgeColor ?? '#3B82F6' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Mode Simpel Button */}
      {!collapsed && (
        <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: '#243447' }}>
          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ backgroundColor: '#243447', color: '#94A3B8' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2D3F55'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#243447'; }}
          >
            <ChevronDown className="h-4 w-4" />
            <span>Mode Simpel</span>
          </button>
        </div>
      )}

    </aside>
  );
}

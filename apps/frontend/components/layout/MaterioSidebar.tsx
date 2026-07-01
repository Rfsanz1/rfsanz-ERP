'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import {
  LayoutDashboard, ShoppingCart, Settings, ChevronDown,
  Warehouse, PanelLeftClose, PanelLeftOpen,
  Truck, Receipt, Package, Navigation, DollarSign,
  BarChart2, Users, BookOpen, CreditCard, UserCheck,
  Brain, Megaphone, Globe, Bell, ChevronUp,
} from 'lucide-react';

export const SIDEBAR_WIDTH           = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

interface NavChild { href: string; label: string; }
interface NavItem  {
  href?: string; label: string; icon: React.ElementType;
  children?: NavChild[]; badge?: string; categoryLabel?: string;
}

/* ── Menu simpel (tampilan default) ─────────────────── */
const NAV_SIMPLE: NavItem[] = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard, categoryLabel: 'MENU UTAMA' },
  {
    label: 'Penjualan', icon: ShoppingCart, categoryLabel: 'OPERASIONAL',
    children: [
      { href: '/sales/smart-order', label: 'Buat Order Baru'   },
      { href: '/sales/orders',      label: 'Daftar Pesanan'    },
      { href: '/sales/customers',   label: 'Data Pelanggan'    },
      { href: '/sales/reports',     label: 'Laporan Penjualan' },
    ],
  },
  {
    label: 'Gudang & Stok', icon: Warehouse,
    children: [
      { href: '/gudang',          label: 'Dashboard Gudang' },
      { href: '/gudang/inbound',  label: 'Barang Masuk'     },
      { href: '/gudang/outbound', label: 'Barang Keluar'    },
    ],
  },
  {
    label: 'Pengaturan', icon: Settings, categoryLabel: 'SISTEM',
    children: [
      { href: '/settings',                 label: 'Pengaturan Umum' },
      { href: '/settings/api-integration', label: 'Integrasi'       },
      { href: '/help',                     label: 'Bantuan'         },
    ],
  },
];

/* ── Menu lengkap admin ─────────────────────────────── */
const NAV_FULL: NavItem[] = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard, categoryLabel: 'UTAMA' },
  {
    label: 'Penjualan', icon: ShoppingCart, categoryLabel: 'OPERASIONAL',
    children: [
      { href: '/sales/smart-order', label: 'Smart Order'       },
      { href: '/sales/quotations',  label: 'Penawaran'         },
      { href: '/sales/orders',      label: 'Pesanan Penjualan' },
      { href: '/sales/invoices',    label: 'Invoice'           },
      { href: '/sales/returns',     label: 'Retur Penjualan'   },
      { href: '/customers',         label: 'Pelanggan'         },
      { href: '/sales/reports',     label: 'Laporan'           },
    ],
  },
  {
    label: 'Pembelian', icon: Truck,
    children: [
      { href: '/purchasing/purchase-orders', label: 'Pesanan Pembelian'    },
      { href: '/purchasing/rfq',             label: 'Permintaan Penawaran' },
      { href: '/purchasing/vendors',         label: 'Vendor'               },
    ],
  },
  {
    label: 'Invoice', icon: Receipt,
    children: [
      { href: '/invoice/list',         label: 'Daftar Invoice' },
      { href: '/invoice/down-payment', label: 'Down Payment'   },
      { href: '/invoice/payments',     label: 'Pembayaran'     },
      { href: '/invoice/aging',        label: 'Aging Report'   },
      { href: '/invoice/credit-notes', label: 'Kredit Nota'    },
    ],
  },
  {
    label: 'Inventory', icon: Package,
    children: [
      { href: '/inventory/products',      label: 'Produk'        },
      { href: '/inventory/lots',          label: 'Lot & Serial'  },
      { href: '/inventory/transfers',     label: 'Transfer Stok' },
      { href: '/inventory/stock-opnames', label: 'Stock Opname'  },
      { href: '/inventory/warehouses',    label: 'Multi Gudang'  },
      { href: '/inventory/reorder-rules', label: 'Reorder Rules' },
    ],
  },
  {
    label: 'Gudang', icon: Warehouse,
    children: [
      { href: '/gudang',              label: 'Dashboard Gudang' },
      { href: '/gudang/picking',      label: 'Picking Order'    },
      { href: '/gudang/inbound',      label: 'Barang Masuk'     },
      { href: '/gudang/outbound',     label: 'Barang Keluar'    },
      { href: '/gudang/transfer',     label: 'Transfer Stok'    },
      { href: '/gudang/stock-opname', label: 'Stock Opname'     },
    ],
  },
  {
    label: 'Pengiriman', icon: Navigation,
    children: [
      { href: '/driver',              label: 'Dashboard Driver'   },
      { href: '/driver/deliveries',   label: 'Daftar Pengiriman'  },
      { href: '/delivery/areas',      label: 'Wilayah Pengiriman' },
      { href: '/fleet/vehicles',      label: 'Armada Kendaraan'   },
      { href: '/fleet/drivers',       label: 'Manajemen Driver'   },
      { href: '/fleet/shipments',     label: 'Shipment'           },
      { href: '/fleet/fuel-tracking', label: 'Tracking BBM'       },
      { href: '/fleet/gps',           label: 'GPS Tracking'       },
    ],
  },
  {
    label: 'Keuangan', icon: DollarSign, categoryLabel: 'KEUANGAN',
    children: [
      { href: '/finance/journal',             label: 'Jurnal'            },
      { href: '/accounting',                  label: 'Chart of Accounts' },
      { href: '/finance/bank-reconciliation', label: 'Rekonsiliasi Bank' },
      { href: '/finance/cash',                label: 'Kas & Bank'        },
      { href: '/finance/budget',              label: 'Anggaran'          },
    ],
  },
  {
    label: 'Laporan', icon: BarChart2,
    children: [
      { href: '/reports/sales',     label: 'Laporan Penjualan' },
      { href: '/finance/reports',   label: 'Laporan Keuangan'  },
      { href: '/reports/inventory', label: 'Laporan Stok'      },
    ],
  },
  { href: '/hr',         label: 'Karyawan',     icon: Users,     categoryLabel: 'SDM & OPERASI' },
  { href: '/payroll',    label: 'Payroll',       icon: BookOpen },
  { href: '/pos/orders', label: 'Point of Sale', icon: CreditCard },
  {
    label: 'CRM', icon: UserCheck,
    children: [
      { href: '/crm/leads',         label: 'Leads'       },
      { href: '/crm/pipeline',      label: 'Pipeline'    },
      { href: '/crm/opportunities', label: 'Opportunity' },
    ],
  },
  { href: '/ai',            label: 'AI Assistant', icon: Brain,    badge: 'AI', categoryLabel: 'DIGITAL' },
  { href: '/marketing',     label: 'Marketing',    icon: Megaphone },
  { href: '/website',       label: 'Website',      icon: Globe     },
  { href: '/notifications', label: 'Notifikasi',   icon: Bell      },
  {
    label: 'Pengaturan', icon: Settings, categoryLabel: 'SISTEM',
    children: [
      { href: '/settings',                 label: 'Pengaturan Umum' },
      { href: '/settings/wa-gateway',      label: 'WA Gateway'      },
      { href: '/settings/api-integration', label: 'API & Integrasi' },
      { href: '/settings/workflow',        label: 'Workflow Config'  },
      { href: '/help',                     label: 'FAQ / Bantuan'    },
    ],
  },
];

const LS_MODE_KEY = 'erp_sidebar_mode';
function loadMode(): 'simple' | 'full' {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem(LS_MODE_KEY) : null;
    return v === 'full' ? 'full' : 'simple';
  } catch { return 'simple'; }
}
function saveMode(m: 'simple' | 'full') {
  if (typeof window !== 'undefined') window.localStorage.setItem(LS_MODE_KEY, m);
}

const LS_KEY = 'erp_sidebar_open_v2';
function loadOpen(): Record<string, boolean> {
  try { return JSON.parse(typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) ?? '{}' : '{}'); } catch { return {}; }
}
function saveOpen(s: Record<string, boolean>) {
  if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, JSON.stringify(s));
}

/* ══════════════════════════════════════════════════════════════════════════
   SIDEBAR CONTENT
══════════════════════════════════════════════════════════════════════════ */
interface ContentProps {
  collapsed: boolean;
  onToggle?: () => void;
  onMobileClose: () => void;
}

function SidebarContent({ collapsed, onToggle, onMobileClose }: ContentProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'simple' | 'full'>('simple');

  const NAV = sidebarMode === 'full' ? NAV_FULL : NAV_SIMPLE;

  useEffect(() => {
    setSidebarMode(loadMode());
  }, []);

  useEffect(() => {
    const saved = loadOpen();
    const auto: Record<string, boolean> = { ...saved };
    NAV.forEach(item => {
      if (item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))) {
        auto[item.label] = true;
      }
    });
    setOpen(auto);
    setMounted(true);
  }, [pathname, sidebarMode]);

  const toggleMode = () => {
    const next = sidebarMode === 'simple' ? 'full' : 'simple';
    setSidebarMode(next);
    saveMode(next);
  };

  const toggle = (label: string) => {
    if (collapsed) return;
    setOpen(prev => {
      const next = { ...prev, [label]: !prev[label] };
      saveOpen(next);
      return next;
    });
  };

  const isActive = (href?: string) =>
    href ? (pathname === href || pathname.startsWith(href + '/')) : false;

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#fff', borderRight: '1px solid #F0F0F5', overflow: 'hidden',
    }}>
      {/* ── Logo + toggle button ────────────────────────────────────── */}
      {collapsed ? (
        /* Collapsed: hanya tombol expand di tengah */
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 56, borderBottom: '1px solid #F0F0F5', flexShrink: 0,
          width: '100%',
        }}>
          {onToggle ? (
            <button
              onClick={onToggle}
              title="Buka sidebar"
              style={{
                width: 36, height: 36, borderRadius: 9,
                border: '1px solid #E5E7EB',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6366F1', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <PanelLeftOpen size={16} strokeWidth={2} />
            </button>
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 10 }}>GM</span>
            </div>
          )}
        </div>
      ) : (
        /* Expanded: logo + nama + tombol collapse */
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 12px 0 16px',
          height: 56, borderBottom: '1px solid #F0F0F5', flexShrink: 0,
        }}>
          {/* Collapse button — di sebelah KIRI logo GM */}
          {onToggle && (
            <button
              onClick={onToggle}
              title="Tutup sidebar"
              style={{
                width: 28, height: 28, borderRadius: 7, border: '1px solid #E5E7EB',
                background: 'transparent', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9CA3AF', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,.08)';
                (e.currentTarget as HTMLElement).style.color = '#6366F1';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
              }}
            >
              <PanelLeftClose size={14} strokeWidth={2} />
            </button>
          )}

          {/* Logo mark */}
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 10, letterSpacing: 0.3 }}>GM</span>
          </div>

          {/* App name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1E1B4B', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              Gentong Mas
            </p>
            <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', lineHeight: 1, fontWeight: 500 }}>
              ERP System
            </p>
          </div>
        </div>
      )}

      {/* ── Nav list ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {NAV.map((item) => {
          const Icon      = item.icon;
          const hasCh     = !!item.children?.length;
          const anyActive = item.children?.some(c => isActive(c.href));
          const active    = hasCh ? !!anyActive : isActive(item.href);
          const isOpen    = mounted ? (open[item.label] ?? false) : (anyActive ?? false);

          /* ── Icon-only collapsed mode ───────────────────────────── */
          if (collapsed) {
            const iconEl = (
              <div style={{
                width: 40, height: 36, borderRadius: 8,
                background: active ? 'rgba(99,102,241,.1)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', cursor: 'pointer', transition: 'background 0.15s',
              }}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8}
                  style={{ color: active ? '#6366F1' : '#9CA3AF' }} />
              </div>
            );

            return (
              <div key={item.label} style={{ padding: '1px 12px' }}>
                {item.categoryLabel && (
                  <div style={{ height: 1, background: '#F3F4F6', margin: '6px 0 4px' }} />
                )}
                <Tooltip title={item.label} placement="right" arrow>
                  {hasCh ? (
                    <div>{iconEl}</div>
                  ) : (
                    <Link href={item.href!} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                      {iconEl}
                    </Link>
                  )}
                </Tooltip>
              </div>
            );
          }

          /* ── Full expanded mode ─────────────────────────────────── */
          return (
            <div key={item.label}>
              {item.categoryLabel && (
                <div style={{ padding: '10px 16px 3px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: '#9CA3AF', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>
                    {item.categoryLabel}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
                </div>
              )}

              {hasCh ? (
                <button
                  onClick={() => toggle(item.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '11px 16px',
                    background: active ? 'rgba(99,102,241,.06)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    borderLeft: active ? '3px solid #6366F1' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8}
                    style={{ color: active ? '#6366F1' : '#9CA3AF', flexShrink: 0 }} />
                  <span style={{
                    flex: 1, textAlign: 'left', fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#1E1B4B' : '#374151',
                  }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 100, flexShrink: 0,
                      background: item.badge === 'AI' ? 'rgba(139,92,246,.12)' : 'rgba(99,102,241,.1)',
                      color: item.badge === 'AI' ? '#8B5CF6' : '#6366F1',
                    }}>{item.badge}</span>
                  )}
                  <ChevronDown size={13} strokeWidth={2}
                    style={{
                      color: '#9CA3AF', flexShrink: 0, transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }} />
                </button>
              ) : (
                <Link href={item.href!} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 16px',
                      background: active ? 'rgba(99,102,241,.06)' : 'transparent',
                      borderLeft: active ? '3px solid #6366F1' : '3px solid transparent',
                      transition: 'all 0.15s', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8}
                      style={{ color: active ? '#6366F1' : '#9CA3AF', flexShrink: 0 }} />
                    <span style={{
                      flex: 1, fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? '#1E1B4B' : '#374151',
                    }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 100,
                        background: item.badge === 'AI' ? 'rgba(139,92,246,.12)' : 'rgba(239,68,68,.1)',
                        color: item.badge === 'AI' ? '#8B5CF6' : '#EF4444',
                      }}>{item.badge}</span>
                    )}
                  </div>
                </Link>
              )}

              {hasCh && isOpen && (
                <div style={{ paddingBottom: 2 }}>
                  {item.children!.map((child) => {
                    const ca = isActive(child.href);
                    return (
                      <Link key={child.href} href={child.href} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 16px 10px 44px',
                            background: ca ? 'rgba(99,102,241,.06)' : 'transparent',
                            transition: 'background 0.12s', cursor: 'pointer',
                          }}
                          onMouseEnter={e => { if (!ca) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                          onMouseLeave={e => { if (!ca) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div style={{
                            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                            background: ca ? '#6366F1' : '#D1D5DB', transition: 'all 0.15s',
                          }} />
                          <span style={{
                            fontSize: 14, fontWeight: ca ? 600 : 400,
                            color: ca ? '#6366F1' : '#4B5563',
                          }}>
                            {child.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height: 8 }} />
      </div>

      {/* ── Mode toggle button ─────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid #F0F0F5', flexShrink: 0 }}>
          <button
            onClick={toggleMode}
            aria-pressed={sidebarMode === 'full'}
            title={sidebarMode === 'full' ? 'Kembali ke tampilan simpel' : 'Buka semua menu admin'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              border: '1.5px solid',
              borderColor: sidebarMode === 'full' ? '#6366F1' : '#E5E7EB',
              background: sidebarMode === 'full' ? 'rgba(99,102,241,.07)' : '#F9FAFB',
              transition: 'all 0.2s',
            }}
          >
            {sidebarMode === 'full'
              ? <ChevronUp size={15} strokeWidth={2.5} style={{ color: '#6366F1' }} />
              : <ChevronDown size={15} strokeWidth={2.5} style={{ color: '#6B7280' }} />
            }
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: sidebarMode === 'full' ? '#6366F1' : '#6B7280',
            }}>
              {sidebarMode === 'full' ? 'Mode Simpel' : 'Mode Admin (Semua Menu)'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════════════════ */
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function MaterioSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const w = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <>
      {/* Desktop — position:fixed, no layout placeholder */}
      <div
        suppressHydrationWarning
        className="hidden lg:block"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: w, transition: 'width 0.25s ease',
          zIndex: 200, overflow: 'hidden',
        }}
      >
        <SidebarContent collapsed={collapsed} onToggle={onToggle} onMobileClose={() => {}} />
      </div>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH, border: 'none',
            background: '#fff', overflow: 'hidden', height: '100%',
          },
        }}
      >
        <SidebarContent collapsed={false} onMobileClose={onMobileClose} />
      </Drawer>
    </>
  );
}

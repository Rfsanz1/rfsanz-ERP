'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import {
  LayoutDashboard, Users, ShoppingCart, Package, FileText,
  BarChart2, Settings, Bell, ChevronDown,
  Truck, DollarSign, UserCheck, BookOpen, CreditCard,
  Brain, Megaphone, Globe, Warehouse, Navigation, HelpCircle,
  Receipt,
} from 'lucide-react';

export const SIDEBAR_WIDTH           = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

interface NavChild { href: string; label: string; }
interface NavItem  { href?: string; label: string; icon: React.ElementType; children?: NavChild[]; badge?: string; categoryLabel?: string; }

const NAV: NavItem[] = [
  { href: '/dashboard',  label: 'Beranda', icon: LayoutDashboard, categoryLabel: 'UTAMA' },
  {
    label: 'Penjualan', icon: ShoppingCart, categoryLabel: 'OPERASIONAL',
    children: [
      { href: '/sales/smart-order', label: 'Smart Order'      },
      { href: '/sales/quotations',  label: 'Penawaran'        },
      { href: '/sales/orders',      label: 'Pesanan Penjualan'},
      { href: '/sales/invoices',    label: 'Invoice'          },
      { href: '/sales/returns',     label: 'Retur Penjualan'  },
      { href: '/customers',         label: 'Pelanggan'        },
      { href: '/sales/reports',     label: 'Laporan'          },
    ],
  },
  {
    label: 'Pembelian', icon: Truck,
    children: [
      { href: '/purchasing/purchase-orders', label: 'Pesanan Pembelian' },
      { href: '/purchasing/rfq',             label: 'Permintaan Penawaran' },
      { href: '/purchasing/vendors',         label: 'Vendor'             },
    ],
  },
  {
    label: 'Invoice', icon: Receipt,
    children: [
      { href: '/invoice/list',         label: 'Daftar Invoice'    },
      { href: '/invoice/down-payment', label: 'Down Payment'      },
      { href: '/invoice/payments',     label: 'Pembayaran'        },
      { href: '/invoice/aging',        label: 'Aging Report'      },
      { href: '/invoice/credit-notes', label: 'Kredit Nota'       },
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
      { href: '/finance/journal',            label: 'Jurnal'             },
      { href: '/accounting',                  label: 'Chart of Accounts'  },
      { href: '/finance/bank-reconciliation', label: 'Rekonsiliasi Bank'  },
      { href: '/finance/cash',                label: 'Kas & Bank'         },
      { href: '/finance/budget',              label: 'Anggaran'           },
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
  { href: '/hr',         label: 'Karyawan',     icon: Users,      categoryLabel: 'SDM & OPERASI' },
  { href: '/payroll',    label: 'Payroll',      icon: BookOpen },
  { href: '/pos/orders', label: 'Point of Sale',icon: CreditCard },
  {
    label: 'CRM', icon: UserCheck,
    children: [
      { href: '/crm/leads',         label: 'Leads'      },
      { href: '/crm/pipeline',      label: 'Pipeline'   },
      { href: '/crm/opportunities', label: 'Opportunity'},
    ],
  },
  { href: '/ai',            label: 'AI Assistant', icon: Brain,    badge: 'AI', categoryLabel: 'DIGITAL' },
  { href: '/marketing',     label: 'Marketing',    icon: Megaphone },
  { href: '/website',       label: 'Website',      icon: Globe     },
  { href: '/notifications', label: 'Notifikasi',   icon: Bell,     badge: '5'  },
  {
    label: 'Pengaturan', icon: Settings, categoryLabel: 'SISTEM',
    children: [
      { href: '/settings',          label: 'Pengaturan Umum' },
      { href: '/settings/workflow', label: 'Workflow Config' },
      { href: '/help',              label: 'FAQ / Bantuan'   },
    ],
  },
];

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
function SidebarContent({ collapsed, onMobileClose }: { collapsed: boolean; onMobileClose: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

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
  }, [pathname]);

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
      {/* ── Logo ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '0 15px' : '0 16px',
        minHeight: 56, borderBottom: '1px solid #F0F0F5', flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(99,102,241,0.3)',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: 0.3 }}>GM</span>
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1E1B4B', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              Gentong Mas
            </p>
            <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', lineHeight: 1, fontWeight: 500 }}>
              ERP System
            </p>
          </div>
        )}
      </div>

      {/* ── Nav list ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {NAV.map((item) => {
          const Icon    = item.icon;
          const hasCh   = !!item.children?.length;
          const anyActive = item.children?.some(c => isActive(c.href));
          const active  = hasCh ? !!anyActive : isActive(item.href);
          const isOpen  = mounted ? (open[item.label] ?? false) : (anyActive ?? false);

          /* ── Icon-only mode (collapsed) ─────────────────────────── */
          if (collapsed) {
            const IconEl = (
              <Tooltip title={item.label} placement="right" arrow>
                {hasCh ? (
                  <button
                    onClick={() => {}}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 40, height: 40, borderRadius: 10, border: 'none',
                      background: active ? 'rgba(99,102,241,.1)' : 'transparent',
                      cursor: 'pointer', margin: '0 auto',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8}
                      style={{ color: active ? '#6366F1' : '#9CA3AF' }} />
                  </button>
                ) : (
                  <Link href={item.href!} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 40, height: 40, borderRadius: 10,
                      background: active ? 'rgba(99,102,241,.1)' : 'transparent',
                      cursor: 'pointer', margin: '0 auto',
                      transition: 'all 0.15s',
                    }}>
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8}
                        style={{ color: active ? '#6366F1' : '#9CA3AF' }} />
                    </div>
                  </Link>
                )}
              </Tooltip>
            );

            return (
              <div key={item.label} style={{ padding: '2px 12px' }}>
                {item.categoryLabel && (
                  <div style={{ height: 1, background: '#F3F4F6', margin: '8px 0 6px' }} />
                )}
                {IconEl}
              </div>
            );
          }

          /* ── Full mode (expanded) ───────────────────────────────── */
          return (
            <div key={item.label}>
              {/* Category label */}
              {item.categoryLabel && (
                <div style={{
                  padding: '12px 16px 4px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: '#9CA3AF', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.categoryLabel}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
                </div>
              )}

              {/* ── Parent item ───────────────────────────────────── */}
              {hasCh ? (
                <button
                  onClick={() => toggle(item.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '8px 16px',
                    background: active ? 'rgba(99,102,241,.06)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    borderLeft: active ? '3px solid #6366F1' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon
                    size={16} strokeWidth={active ? 2.2 : 1.8}
                    style={{ color: active ? '#6366F1' : '#9CA3AF', flexShrink: 0 }}
                  />
                  <span style={{
                    flex: 1, textAlign: 'left', fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#1E1B4B' : '#374151',
                  }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px',
                      borderRadius: 100, flexShrink: 0,
                      background: item.badge === 'AI' ? 'rgba(139,92,246,.12)' : 'rgba(99,102,241,.1)',
                      color: item.badge === 'AI' ? '#8B5CF6' : '#6366F1',
                    }}>{item.badge}</span>
                  )}
                  <ChevronDown
                    size={13} strokeWidth={2}
                    style={{
                      color: '#9CA3AF', flexShrink: 0,
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                  />
                </button>
              ) : (
                <Link href={item.href!} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px',
                    background: active ? 'rgba(99,102,241,.06)' : 'transparent',
                    borderLeft: active ? '3px solid #6366F1' : '3px solid transparent',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <Icon
                      size={16} strokeWidth={active ? 2.2 : 1.8}
                      style={{ color: active ? '#6366F1' : '#9CA3AF', flexShrink: 0 }}
                    />
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

              {/* ── Sub items (collapsible) ──────────────────────── */}
              {hasCh && isOpen && (
                <div style={{ paddingBottom: 2 }}>
                  {item.children!.map((child) => {
                    const ca = isActive(child.href);
                    return (
                      <Link key={child.href} href={child.href} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px 6px 44px',
                            background: ca ? 'rgba(99,102,241,.06)' : 'transparent',
                            transition: 'background 0.12s', cursor: 'pointer',
                          }}
                          onMouseEnter={e => { if (!ca) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                          onMouseLeave={e => { if (!ca) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div style={{
                            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                            background: ca ? '#6366F1' : '#D1D5DB',
                            transition: 'all 0.15s',
                          }} />
                          <span style={{
                            fontSize: 12.5,
                            fontWeight: ca ? 600 : 400,
                            color: ca ? '#6366F1' : '#6B7280',
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

        {/* Bottom padding */}
        <div style={{ height: 72, flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════════════════ */
interface SidebarProps { collapsed: boolean; mobileOpen: boolean; onMobileClose: () => void; }

export function MaterioSidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const w = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  return (
    <>
      {/* Desktop — fixed sidebar, no placeholder <aside> */}
      <div
        suppressHydrationWarning
        className="hidden lg:block"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: w,
          transition: 'width 0.25s ease',
          zIndex: 100, overflow: 'hidden',
        }}
      >
        <SidebarContent collapsed={collapsed} onMobileClose={() => {}} />
      </div>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 'none', background: '#fff', overflow: 'hidden', height: '100%' },
        }}
      >
        <SidebarContent collapsed={false} onMobileClose={onMobileClose} />
      </Drawer>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import {
  LayoutDashboard, Users, ShoppingCart, Package, FileText,
  BarChart2, Settings, Bell, ChevronDown, ChevronRight,
  Truck, DollarSign, UserCheck, BookOpen, CreditCard, Target,
  Brain, Megaphone, Globe, Warehouse, Navigation,
} from 'lucide-react';

export const SIDEBAR_WIDTH          = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 0;

interface NavChild { href: string; label: string; }
interface NavItem  { href?: string; label: string; icon: React.ElementType; children?: NavChild[]; badge?: string; }
interface NavGroup { label: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    label: 'MENU UTAMA',
    items: [
      { href: '/dashboard',      label: 'Dashboard',  icon: LayoutDashboard },
      { href: '/notifications',  label: 'Notifikasi', icon: Bell, badge: '5' },
    ],
  },
  {
    label: 'CRM & PENJUALAN',
    items: [
      {
        label: 'CRM', icon: Users,
        children: [
          { href: '/crm/leads',        label: 'Leads'     },
          { href: '/crm/pipeline',     label: 'Pipeline'  },
          { href: '/crm/opportunities',label: 'Opportunity'},
          { href: '/crm/activities',   label: 'Aktivitas' },
        ],
      },
      {
        label: 'Penjualan', icon: ShoppingCart,
        children: [
          { href: '/sales/smart-order',  label: 'Smart Order Input'},
          { href: '/sales/quotations',   label: 'Quotation'        },
          { href: '/sales/orders',       label: 'Sales Orders'     },
          { href: '/sales/invoices',     label: 'Invoice Penjualan'},
          { href: '/sales/returns',      label: 'Retur Penjualan'  },
          { href: '/sales/pricelists',   label: 'Price List'       },
          { href: '/sales/teams',        label: 'Sales Team'       },
          { href: '/sales/targets',      label: 'Sales Target'     },
          { href: '/sales/commission',   label: 'Komisi Sales'     },
          { href: '/sales/products',     label: 'Produk'           },
          { href: '/sales/reports',      label: 'Laporan'          },
        ],
      },
      {
        label: 'Invoice', icon: FileText,
        children: [
          { href: '/invoice/list',         label: 'Daftar Invoice'   },
          { href: '/invoice/down-payment', label: 'Down Payment'     },
          { href: '/invoice/recurring',    label: 'Recurring Invoice'},
          { href: '/invoice/payments',     label: 'Pembayaran'       },
          { href: '/invoice/aging',        label: 'Aging Report'     },
          { href: '/invoice/credit-notes', label: 'Kredit Nota'      },
        ],
      },
      { href: '/customers', label: 'Pelanggan', icon: UserCheck },
    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      {
        label: 'Inventory', icon: Package,
        children: [
          { href: '/inventory/products',     label: 'Produk'        },
          { href: '/inventory/lots',         label: 'Lot & Serial'  },
          { href: '/inventory/transfers',    label: 'Transfer Stok' },
          { href: '/inventory/stock-opnames',label: 'Stock Opname'  },
          { href: '/inventory/warehouses',   label: 'Multi Gudang'  },
          { href: '/inventory/reorder-rules',label: 'Reorder Rules' },
        ],
      },
      {
        label: 'Pembelian', icon: Truck,
        children: [
          { href: '/purchasing/purchase-orders', label: 'Purchase Orders' },
          { href: '/purchasing/vendors',          label: 'Vendor'          },
          { href: '/purchasing/rfq',              label: 'RFQ'             },
        ],
      },
      { href: '/pos/orders', label: 'Point of Sale', icon: CreditCard },
      {
        label: 'Gudang', icon: Warehouse,
        children: [
          { href: '/gudang',              label: 'Dashboard Gudang' },
          { href: '/gudang/picking',      label: 'Picking Order'    },
          { href: '/gudang/inbound',      label: 'Barang Masuk'     },
          { href: '/gudang/outbound',     label: 'Barang Keluar'    },
          { href: '/gudang/transfer',     label: 'Transfer Stok'    },
          { href: '/gudang/stock-opname', label: 'Stock Opname'     },
          { href: '/gudang/products',     label: 'Produk Gudang'    },
          { href: '/gudang/history',      label: 'Riwayat'          },
        ],
      },
      {
        label: 'Pengiriman & Driver', icon: Navigation,
        children: [
          { href: '/driver',              label: 'Dashboard Driver'    },
          { href: '/driver/deliveries',   label: 'Daftar Pengiriman'   },
          { href: '/driver/history',      label: 'Riwayat Pengiriman'  },
          { href: '/driver/profile',      label: 'Profil Driver'       },
          { href: '/delivery/areas',      label: 'Wilayah Pengiriman'  },
          { href: '/fleet/vehicles',      label: 'Armada Kendaraan'    },
          { href: '/fleet/assignments',   label: 'Penugasan Driver'    },
          { href: '/fleet/fuel-tracking', label: 'Tracking BBM'        },
        ],
      },
    ],
  },
  {
    label: 'KEUANGAN',
    items: [
      {
        label: 'Finance', icon: DollarSign,
        children: [
          { href: '/finance/journal',            label: 'Jurnal'              },
          { href: '/accounting',                  label: 'Chart of Accounts'   },
          { href: '/finance/bank-reconciliation', label: 'Rekonsiliasi Bank'   },
          { href: '/finance/cash',                label: 'Kas & Bank'          },
          { href: '/finance/budget',              label: 'Anggaran'            },
        ],
      },
      {
        label: 'Laporan', icon: BarChart2,
        children: [
          { href: '/reports/sales',     label: 'Laporan Penjualan'  },
          { href: '/finance/reports',   label: 'Laporan Keuangan'   },
          { href: '/reports/inventory', label: 'Laporan Stok'       },
        ],
      },
    ],
  },
  {
    label: 'HR & PAYROLL',
    items: [
      { href: '/hr',      label: 'Karyawan', icon: Users    },
      { href: '/payroll', label: 'Payroll',  icon: BookOpen },
    ],
  },
  {
    label: 'LAINNYA',
    items: [
      { href: '/ai',        label: 'AI Assistant', icon: Brain,    badge: 'AI' },
      { href: '/marketing', label: 'Marketing',    icon: Megaphone },
      { href: '/website',   label: 'Website',      icon: Globe     },
      {
        label: 'Pengaturan', icon: Settings,
        children: [
          { href: '/settings',                    label: 'Umum'              },
          { href: '/settings/users',              label: 'Users & Roles'     },
          { href: '/settings/companies',          label: 'Multi Perusahaan'  },
          { href: '/settings/document-numbers',   label: 'Nomor Dokumen'     },
          { href: '/settings/email-gateway',      label: 'Email Gateway'     },
          { href: '/settings/wa-gateway',         label: 'WA Gateway'        },
          { href: '/settings/api-integration',    label: 'API & Integrasi'   },
          { href: '/settings/backup',             label: 'Backup & Restore'  },
          { href: '/settings/audit-log',          label: 'Audit Log'         },
        ],
      },
    ],
  },
];

const LS_KEY = 'erp_sidebar_open';
function loadOpen():  Record<string, boolean> { try { return JSON.parse(typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) ?? '{}' : '{}'); } catch { return {}; } }
function saveOpen(s:  Record<string, boolean>) { if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, JSON.stringify(s)); }

interface SidebarProps { collapsed: boolean; mobileOpen: boolean; onMobileClose: () => void; }

/* ── Sidebar content ─────────────────────────────────────────────────── */
function SidebarContent({ collapsed, onMobileClose }: { collapsed: boolean; onMobileClose: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = loadOpen();
    const auto: Record<string, boolean> = { ...saved };
    navGroups.forEach(g => g.items.forEach(item => {
      if (item.children?.some(c => pathname.startsWith(c.href))) auto[item.label] = true;
    }));
    setOpen(auto);
    setMounted(true);
  }, [pathname]);

  const toggle = (label: string) => {
    setOpen(prev => { const next = { ...prev, [label]: !prev[label] }; saveOpen(next); return next; });
  };

  const isActive   = (href?: string) => href ? (pathname === href || pathname.startsWith(href + '/')) : false;
  const childActive = (children?: NavChild[]) => children?.some(c => isActive(c.href));

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '0 14px' : '0 20px',
          minHeight: 64,
          borderBottom: '1px solid var(--sidebar-border)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}>GM</span>
        </div>
        {!collapsed && (
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              Gentong Mas
            </p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1, fontWeight: 500 }}>
              Enterprise ERP
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 8px' : '8px 10px' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <p
                style={{
                  margin: '12px 8px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </p>
            )}
            {collapsed && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}

            <List dense disablePadding>
              {group.items.map((item) => {
                const Icon  = item.icon;
                const hasCh = !!item.children?.length;
                const ca    = childActive(item.children);
                const active= hasCh ? ca : isActive(item.href);
                const isOpen= mounted ? (open[item.label] ?? false) : (ca ?? false);

                const btnSx = {
                  borderRadius: '8px',
                  mb: '2px',
                  px: collapsed ? '14px' : '10px',
                  py: '8px',
                  minHeight: 36,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'rgba(99,102,241,0.10)' : 'transparent',
                  '&:hover': { background: active ? 'rgba(99,102,241,0.14)' : 'var(--brand-hover)' },
                } as const;

                if (hasCh) return (
                  <div key={item.label}>
                    <Tooltip title={collapsed ? item.label : ''} placement="right">
                      <ListItemButton onClick={() => !collapsed && toggle(item.label)} sx={btnSx}>
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 32, color: active ? '#6366F1' : 'var(--text-muted)' }}>
                          <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                        </ListItemIcon>
                        {!collapsed && (
                          <>
                            <ListItemText
                              disableTypography
                              primary={<span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#6366F1' : 'var(--text-secondary)' }}>{item.label}</span>}
                            />
                            {item.badge && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                                {item.badge}
                              </span>
                            )}
                            {isOpen ? <ChevronDown size={13} style={{ color: 'var(--text-muted)', marginLeft: 4 }} /> : <ChevronRight size={13} style={{ color: 'var(--text-muted)', marginLeft: 4 }} />}
                          </>
                        )}
                      </ListItemButton>
                    </Tooltip>

                    {!collapsed && (
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List dense disablePadding sx={{ pl: '28px', pr: 0 }}>
                          {item.children!.map((child) => {
                            const ca2 = isActive(child.href);
                            return (
                              <Link key={child.href} href={child.href} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                                <ListItemButton
                                  sx={{
                                    borderRadius: '7px', mb: '2px', py: '6px', pl: '12px',
                                    background: ca2 ? 'rgba(99,102,241,0.10)' : 'transparent',
                                    '&:hover': { background: ca2 ? 'rgba(99,102,241,0.14)' : 'var(--brand-hover)' },
                                  }}
                                >
                                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: ca2 ? '#6366F1' : 'var(--text-muted)', marginRight: 10, flexShrink: 0, transition: 'all 0.15s' }} />
                                  <ListItemText
                                    disableTypography
                                    primary={<span style={{ fontSize: 12.5, fontWeight: ca2 ? 600 : 400, color: ca2 ? '#6366F1' : 'var(--text-secondary)' }}>{child.label}</span>}
                                  />
                                </ListItemButton>
                              </Link>
                            );
                          })}
                        </List>
                      </Collapse>
                    )}
                  </div>
                );

                return (
                  <Tooltip key={item.href} title={collapsed ? item.label : ''} placement="right">
                    <Link href={item.href!} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                      <ListItemButton sx={btnSx}>
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 32, color: active ? '#6366F1' : 'var(--text-muted)' }}>
                          <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                        </ListItemIcon>
                        {!collapsed && (
                          <>
                            <ListItemText
                              disableTypography
                              primary={<span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#6366F1' : 'var(--text-secondary)' }}>{item.label}</span>}
                            />
                            {item.badge && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: item.badge === 'AI' ? 'rgba(139,92,246,0.12)' : 'rgba(239,68,68,0.12)', color: item.badge === 'AI' ? '#8B5CF6' : '#EF4444', marginLeft: 4 }}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </ListItemButton>
                    </Link>
                  </Tooltip>
                );
              })}
            </List>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ── Export ──────────────────────────────────────────────────────────── */
export function MaterioSidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside
        style={{
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          flexShrink: 0,
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          position: 'relative',
        }}
        className="hidden lg:block"
      >
        <div
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            transition: 'width 0.25s ease', zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <SidebarContent collapsed={false} onMobileClose={() => {}} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 'none', background: 'var(--sidebar-bg)' },
        }}
      >
        <SidebarContent collapsed={false} onMobileClose={onMobileClose} />
      </Drawer>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import {
  LayoutDashboard, Users, ShoppingCart, Package, FileText,
  BarChart2, Settings, Bell, ChevronDown, ChevronRight,
  Truck, DollarSign, UserCheck, Building2,
  BookOpen, CreditCard, Target, Brain, Megaphone, Globe, LogOut,
  Warehouse, ArrowDownRight, ArrowUpRight, ArrowLeftRight,
  ClipboardCheck, Clock, ClipboardList, Navigation, Car, MapPin,
  FileCheck, Zap, RotateCcw, Tag, Percent, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 68;

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
      { href: '/notifications', label: 'Notifikasi', icon: Bell, badge: '5', badgeColor: 'error' },
    ],
  },
  {
    label: 'CRM & PENJUALAN',
    items: [
      {
        label: 'CRM', icon: Users,
        children: [
          { href: '/crm/leads', label: 'Leads' },
          { href: '/crm/pipeline', label: 'Pipeline' },
          { href: '/crm/opportunities', label: 'Opportunity' },
          { href: '/crm/activities', label: 'Aktivitas' },
        ],
      },
      {
        label: 'Penjualan', icon: ShoppingCart,
        children: [
          { href: '/sales', label: 'Dashboard Sales' },
          { href: '/sales/smart-order', label: 'Smart Order Input' },
          { href: '/sales/quotations', label: 'Quotation' },
          { href: '/sales/orders', label: 'Sales Orders' },
          { href: '/sales/invoices', label: 'Invoice Penjualan' },
          { href: '/sales/returns', label: 'Retur Penjualan' },
          { href: '/sales/pricelists', label: 'Price List' },
          { href: '/sales/teams', label: 'Sales Team' },
          { href: '/sales/targets', label: 'Sales Target' },
          { href: '/sales/commission', label: 'Komisi Sales' },
          { href: '/sales/products', label: 'Produk' },
          { href: '/sales/reports', label: 'Laporan' },
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
      { href: '/customers', label: 'Pelanggan', icon: UserCheck },
    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      {
        label: 'Inventory', icon: Package,
        children: [
          { href: '/inventory/products', label: 'Produk' },
          { href: '/inventory/lots', label: 'Lot & Serial' },
          { href: '/inventory/transfers', label: 'Transfer Stok' },
          { href: '/inventory/stock-opnames', label: 'Stock Opname' },
          { href: '/inventory/warehouses', label: 'Multi Gudang' },
          { href: '/inventory/reorder-rules', label: 'Reorder Rules' },
        ],
      },
      {
        label: 'Pembelian', icon: Truck,
        children: [
          { href: '/purchasing/purchase-orders', label: 'Purchase Orders' },
          { href: '/purchasing/vendors', label: 'Vendor' },
          { href: '/purchasing/rfq', label: 'RFQ' },
        ],
      },
      { href: '/pos/orders', label: 'Point of Sale', icon: CreditCard },
      {
        label: 'Gudang', icon: Warehouse,
        children: [
          { href: '/gudang', label: 'Dashboard Gudang' },
          { href: '/gudang/picking', label: 'Picking Order' },
          { href: '/gudang/inbound', label: 'Barang Masuk' },
          { href: '/gudang/outbound', label: 'Barang Keluar' },
          { href: '/gudang/transfer', label: 'Transfer Stok' },
          { href: '/gudang/stock-opname', label: 'Stock Opname' },
          { href: '/gudang/products', label: 'Produk Gudang' },
          { href: '/gudang/history', label: 'Riwayat' },
        ],
      },
      {
        label: 'Pengiriman & Driver', icon: Navigation,
        children: [
          { href: '/driver', label: 'Dashboard Driver' },
          { href: '/driver/deliveries', label: 'Daftar Pengiriman' },
          { href: '/driver/history', label: 'Riwayat Pengiriman' },
          { href: '/driver/profile', label: 'Profil Driver' },
          { href: '/delivery/areas', label: 'Wilayah Pengiriman' },
          { href: '/fleet/vehicles', label: 'Armada Kendaraan' },
          { href: '/fleet/assignments', label: 'Penugasan Driver' },
          { href: '/fleet/fuel-tracking', label: 'Tracking BBM' },
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
          { href: '/finance/journal', label: 'Jurnal' },
          { href: '/accounting', label: 'Chart of Accounts' },
          { href: '/finance/bank-reconciliation', label: 'Rekonsiliasi Bank' },
          { href: '/finance/cash', label: 'Kas & Bank' },
          { href: '/finance/budget', label: 'Anggaran' },
        ],
      },
      {
        label: 'Laporan', icon: BarChart2,
        children: [
          { href: '/reports/sales', label: 'Laporan Penjualan' },
          { href: '/finance/reports', label: 'Laporan Keuangan' },
          { href: '/reports/inventory', label: 'Laporan Stok' },
        ],
      },
    ],
  },
  {
    label: 'HR & PAYROLL',
    items: [
      { href: '/hr', label: 'Karyawan', icon: Users },
      { href: '/payroll', label: 'Payroll', icon: BookOpen },
    ],
  },
  {
    label: 'LAINNYA',
    items: [
      { href: '/ai', label: 'AI Assistant', icon: Brain, badge: 'AI', badgeColor: 'secondary' },
      { href: '/marketing', label: 'Marketing', icon: Megaphone },
      { href: '/website', label: 'Website', icon: Globe },
      {
        label: 'Pengaturan', icon: Settings,
        children: [
          { href: '/settings', label: 'Umum' },
          { href: '/settings/users', label: 'Users & Roles' },
          { href: '/settings/companies', label: 'Multi Perusahaan' },
          { href: '/settings/document-numbers', label: 'Nomor Dokumen' },
          { href: '/settings/email-gateway', label: 'Email Gateway' },
          { href: '/settings/wa-gateway', label: 'WA Gateway' },
          { href: '/settings/api-integration', label: 'API & Integrasi' },
          { href: '/settings/backup', label: 'Backup & Restore' },
          { href: '/settings/audit-log', label: 'Audit Log' },
        ],
      },
    ],
  },
];

const LS_KEY = 'materio_sidebar_open';

function loadOpenGroups(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem(LS_KEY) ?? '{}'); }
  catch { return {}; }
}
function saveOpenGroups(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(state));
}

interface MaterioSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ collapsed, onMobileClose }: { collapsed: boolean; onMobileClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = loadOpenGroups();
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
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: collapsed ? 1.5 : 2.5,
          py: 0,
          minHeight: 64,
          borderBottom: '1px solid',
          borderColor: 'divider',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7367F0, #CE9FFC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 8px rgba(115,103,240,0.3)',
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 0.5 }}>
            GM
          </Typography>
        </Box>
        {!collapsed && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#433C50', lineHeight: 1.2 }}>
              Gentong Mas
            </Typography>
            <Typography variant="caption" sx={{ color: '#A5A3AE', lineHeight: 1 }}>
              Enterprise ERP
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1, px: collapsed ? 1 : 1.5 }}>
        {navGroups.map((group) => (
          <Box key={group.label} sx={{ mb: 0.5 }}>
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 1,
                  pt: 1.5,
                  pb: 0.5,
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  color: '#A5A3AE',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </Typography>
            )}
            {collapsed && <Divider sx={{ my: 0.5, borderColor: '#F0EDF6' }} />}

            <List dense disablePadding>
              {group.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = !!item.children?.length;
                const childActive = isChildActive(item.children);
                const active = hasChildren ? childActive : isActive(item.href);
                const isOpen = mounted ? (openGroups[item.label] ?? false) : childActive ?? false;

                if (hasChildren) {
                  return (
                    <Box key={item.label}>
                      <Tooltip title={collapsed ? item.label : ''} placement="right">
                        <ListItemButton
                          onClick={() => !collapsed && toggleGroup(item.label)}
                          selected={!!active}
                          sx={{
                            borderRadius: '6px',
                            mb: 0.25,
                            px: collapsed ? 1.25 : 1.5,
                            py: 0.875,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            '&.Mui-selected': {
                              bgcolor: 'rgba(115,103,240,0.08)',
                              '&:hover': { bgcolor: 'rgba(115,103,240,0.12)' },
                              '& .nav-icon': { color: '#7367F0' },
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: collapsed ? 0 : 36,
                              color: active ? '#7367F0' : '#A5A3AE',
                            }}
                            className="nav-icon"
                          >
                            <Icon size={18} />
                          </ListItemIcon>
                          {!collapsed && (
                            <>
                              <ListItemText
                                disableTypography
                                primary={(
                                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: active ? '#7367F0' : '#6D6777' }}>
                                    {item.label}
                                  </Typography>
                                )}
                              />
                              {isOpen
                                ? <ChevronDown size={14} color="#A5A3AE" />
                                : <ChevronRight size={14} color="#A5A3AE" />}
                            </>
                          )}
                        </ListItemButton>
                      </Tooltip>

                      {!collapsed && (
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <List dense disablePadding sx={{ pl: 2.5, pr: 0 }}>
                            {item.children!.map((child) => {
                              const ca = isActive(child.href);
                              return (
                                <Link key={child.href} href={child.href} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                                  <ListItemButton
                                    selected={ca}
                                    sx={{
                                      borderRadius: '6px',
                                      mb: 0.25,
                                      py: 0.625,
                                      pl: 1.5,
                                      '&.Mui-selected': {
                                        bgcolor: 'rgba(115,103,240,0.08)',
                                        '&:hover': { bgcolor: 'rgba(115,103,240,0.12)' },
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: ca ? '#7367F0' : '#D0CCD8',
                                        mr: 1.5,
                                        flexShrink: 0,
                                        transition: 'all 0.2s',
                                      }}
                                    />
                                    <ListItemText
                                      disableTypography
                                      primary={(
                                        <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: ca ? 600 : 400, color: ca ? '#7367F0' : '#6D6777' }}>
                                          {child.label}
                                        </Typography>
                                      )}
                                    />
                                  </ListItemButton>
                                </Link>
                              );
                            })}
                          </List>
                        </Collapse>
                      )}
                    </Box>
                  );
                }

                return (
                  <Tooltip key={item.href} title={collapsed ? item.label : ''} placement="right">
                    <Link href={item.href!} style={{ textDecoration: 'none' }} onClick={onMobileClose}>
                      <ListItemButton
                        selected={active}
                        sx={{
                          borderRadius: '6px',
                          mb: 0.25,
                          px: collapsed ? 1.25 : 1.5,
                          py: 0.875,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(115,103,240,0.08)',
                            '&:hover': { bgcolor: 'rgba(115,103,240,0.12)' },
                            '& .nav-icon': { color: '#7367F0' },
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: collapsed ? 0 : 36,
                            color: active ? '#7367F0' : '#A5A3AE',
                          }}
                          className="nav-icon"
                        >
                          <Icon size={18} />
                        </ListItemIcon>
                        {!collapsed && (
                          <>
                            <ListItemText
                              disableTypography
                              primary={(
                                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: active ? '#7367F0' : '#6D6777' }}>
                                  {item.label}
                                </Typography>
                              )}
                            />
                            {item.badge && (
                              <Chip
                                label={item.badge}
                                size="small"
                                color={item.badgeColor === 'error' ? 'error' : 'secondary'}
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  '& .MuiChip-label': { px: 0.75 },
                                }}
                              />
                            )}
                          </>
                        )}
                      </ListItemButton>
                    </Link>
                  </Tooltip>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* User section */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          p: collapsed ? 1 : 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Tooltip title={collapsed ? (user?.name ?? 'Admin') : ''} placement="right">
          <Avatar
            sx={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #7367F0, #CE9FFC)',
              fontSize: '0.875rem',
              fontWeight: 700,
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </Avatar>
        </Tooltip>
        {!collapsed && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: '#433C50', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user?.name ?? 'Admin'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#A5A3AE', lineHeight: 1 }}>
                {Array.isArray(user?.roles) ? user.roles[0] : 'Administrator'}
              </Typography>
            </Box>
            <Tooltip title="Keluar">
              <IconButton
                size="small"
                onClick={logout}
                sx={{
                  color: '#A5A3AE',
                  '&:hover': { color: '#EA5455', bgcolor: 'rgba(234,84,85,0.08)' },
                }}
              >
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}

export function MaterioSidebar({ collapsed, mobileOpen, onMobileClose }: MaterioSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          flexShrink: 0,
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH, transition: 'width 0.25s ease', zIndex: 100 }}>
          <SidebarContent collapsed={collapsed} onMobileClose={() => {}} />
        </Box>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        <SidebarContent collapsed={false} onMobileClose={onMobileClose} />
      </Drawer>
    </>
  );
}

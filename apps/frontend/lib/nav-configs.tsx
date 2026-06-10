import {
  ShoppingCart, FileText, Users, BarChart2, TrendingUp, Settings,
  Package, Star, Calendar, Phone,
  DollarSign, BookOpen, Landmark, Receipt, CheckCircle2,
  ArrowLeftRight, Warehouse, ClipboardCheck,
  UserCheck, UserPlus, CalendarX, Bus,
  Truck, Building2, PackageCheck,
  Monitor, ArrowUpRight, ArrowDownRight, Wrench,
  MapPin, Bell, Shield, Zap, BarChart3, MessageSquare, Bot,
  CreditCard, RotateCcw, ChevronRight,
  Target, Award, Percent, PieChart, Activity, FileCheck,
  Layers, Scale, Globe, Database, Key, Mail, Smartphone,
  Hash, HardDrive, Link2, ClipboardList, Factory,
  GitBranch, AlertTriangle, RefreshCw, ShoppingBag,
  Car, Fuel, Navigation, Briefcase, GraduationCap,
  Heart, Clock, User, LayoutGrid, Tag, Megaphone,
  Calculator,
} from 'lucide-react';
import { NavItem } from '../components/layout/AppShell';

export const SALES_CONFIG = { appName: 'Penjualan', appColor: '#00ACC1', appGradient: 'from-cyan-500 to-cyan-700', appIcon: ShoppingCart };
export const SALES_NAV: NavItem[] = [
  { label: 'Smart Order Input', href: '/sales/smart-order',    icon: Zap },
  { label: 'Quotation',        href: '/sales/quotations',      icon: FileText,
    children: [
      { label: 'Semua Quotation', href: '/sales/quotations' },
      { label: 'Draft',           href: '/sales/quotations?status=draft' },
      { label: 'Terkirim',        href: '/sales/quotations?status=sent' },
      { label: 'Terkonfirmasi',   href: '/sales/quotations?status=confirmed' },
    ],
  },
  { label: 'Sales Order',      href: '/sales/orders',          icon: ShoppingCart, badge: 5,
    children: [
      { label: 'Semua Order',    href: '/sales/orders' },
      { label: 'Draft',          href: '/sales/orders?status=draft' },
      { label: 'Dikonfirmasi',   href: '/sales/orders?status=confirmed' },
      { label: 'Terkirim',       href: '/sales/orders?status=delivered' },
    ],
  },
  { label: 'Invoice',          href: '/sales/invoices',        icon: FileText, badge: 3,
    children: [
      { label: 'Semua Invoice',  href: '/sales/invoices' },
      { label: 'Draft',          href: '/sales/invoices?status=draft' },
      { label: 'Belum Lunas',    href: '/sales/invoices?status=sent' },
      { label: 'Lunas',          href: '/sales/invoices?status=paid' },
      { label: 'Telat Bayar',    href: '/sales/invoices?status=overdue' },
      { label: 'Buat Invoice',   href: '/sales/invoices/new' },
    ],
  },
  { label: 'Retur Penjualan',  href: '/sales/returns',         icon: RotateCcw },
  { label: 'Price List',       href: '/sales/pricelists',      icon: Tag },
  { label: 'Sales Team',       href: '/sales/teams',           icon: Users },
  { label: 'Sales Target',     href: '/sales/targets',         icon: Target },
  { label: 'Komisi Sales',     href: '/sales/commission',      icon: Percent },
  { label: 'Pelanggan',        href: '/customers',             icon: Users },
  { label: 'Produk',           href: '/sales/products',        icon: Package },
  { label: 'Laporan',          href: '/sales/reports',         icon: TrendingUp,
    children: [
      { label: 'Sales by Customer',  href: '/sales/reports?type=customer' },
      { label: 'Sales by Product',   href: '/sales/reports?type=product' },
      { label: 'Sales by Salesman',  href: '/sales/reports?type=salesman' },
    ],
  },
  { label: 'Pengaturan',       href: '/sales/settings',        icon: Settings },
];

export const CRM_CONFIG = { appName: 'CRM', appColor: '#8E24AA', appGradient: 'from-purple-500 to-purple-700', appIcon: Users };
export const CRM_NAV: NavItem[] = [
  { label: 'Pipeline',         href: '/crm/pipeline',          icon: LayoutGrid, badge: 12 },
  { label: 'Leads',            href: '/crm/leads',             icon: Star },
  { label: 'Opportunity',      href: '/crm/opportunities',     icon: TrendingUp },
  { label: 'Lost Reason',      href: '/crm/lost-reasons',      icon: AlertTriangle },
  { label: 'Aktivitas',        href: '/crm/activities',        icon: Calendar },
  { label: 'Follow-up',        href: '/crm/followup',          icon: Phone },
  { label: 'Pelanggan',        href: '/customers',             icon: Users },
  { label: 'Laporan',          href: '/crm/reports',           icon: BarChart2 },
  { label: 'Pengaturan',       href: '/crm/settings',          icon: Settings },
];

export const INVOICE_CONFIG = { appName: 'Invoice', appColor: '#1976D2', appGradient: 'from-blue-500 to-blue-700', appIcon: FileText };
export const INVOICE_NAV: NavItem[] = [
  { label: 'Invoice',            href: '/invoice/list',            icon: FileText, badge: 8,
    children: [
      { label: 'Semua',          href: '/invoice/list' },
      { label: 'Draft',          href: '/invoice/list?status=draft' },
      { label: 'Dikirim',        href: '/invoice/list?status=posted' },
      { label: 'Lunas',          href: '/invoice/list?status=paid' },
      { label: 'Jatuh Tempo',    href: '/invoice/list?status=overdue' },
    ],
  },
  { label: 'Down Payment',       href: '/invoice/down-payment',    icon: DollarSign },
  { label: 'Recurring Invoice',  href: '/invoice/recurring',       icon: RefreshCw },
  { label: 'Kredit Nota',        href: '/invoice/credit-notes',    icon: RotateCcw },
  { label: 'Pembayaran',         href: '/invoice/payments',        icon: CreditCard },
  { label: 'Payment Reminder',   href: '/invoice/reminders',       icon: Bell },
  { label: 'Aging Report',       href: '/invoice/aging',           icon: Clock },
  { label: 'Pengaturan',         href: '/invoice/settings',        icon: Settings },
];

export const ACCOUNTING_CONFIG = { appName: 'Akuntansi', appColor: '#388E3C', appGradient: 'from-green-500 to-emerald-700', appIcon: DollarSign };
export const ACCOUNTING_NAV: NavItem[] = [
  { label: 'Invoice',            href: '/invoice',                        icon: FileText, badge: 8 },
  { label: 'Bagan Akun',         href: '/accounting/chart-of-accounts',  icon: Layers,
    children: [
      { label: 'Semua Akun',     href: '/accounting/chart-of-accounts' },
      { label: 'Aset',           href: '/accounting/chart-of-accounts?type=ASSET' },
      { label: 'Liabilitas',     href: '/accounting/chart-of-accounts?type=LIABILITY' },
      { label: 'Ekuitas',        href: '/accounting/chart-of-accounts?type=EQUITY' },
      { label: 'Pendapatan',     href: '/accounting/chart-of-accounts?type=REVENUE' },
      { label: 'Beban',          href: '/accounting/chart-of-accounts?type=EXPENSE' },
    ],
  },
  { label: 'Jurnal',             href: '/accounting/journal-entry',       icon: BookOpen,
    children: [
      { label: 'Semua Jurnal',   href: '/accounting/journal-entry' },
      { label: 'Buat Jurnal',    href: '/accounting/journal-entry?action=new' },
      { label: 'Draft',          href: '/accounting/journal-entry?status=DRAFT' },
      { label: 'Posted',         href: '/accounting/journal-entry?status=POSTED' },
    ],
  },
  { label: 'Buku Besar',         href: '/accounting/general-ledger',      icon: Database },
  { label: 'Neraca Saldo',       href: '/accounting/trial-balance',       icon: Scale },
  { label: 'Laporan Keuangan',   href: '/keuangan/laporan/laba-rugi',     icon: TrendingUp,
    children: [
      { label: 'Laba & Rugi',       href: '/keuangan/laporan/laba-rugi' },
      { label: 'Neraca',            href: '/keuangan/laporan/neraca' },
      { label: 'Arus Kas',          href: '/keuangan/laporan/arus-kas' },
      { label: 'Buku Besar',        href: '/keuangan/laporan/buku-besar' },
      { label: 'Neraca Saldo',      href: '/keuangan/laporan/trial-balance' },
    ],
  },
  { label: 'Pajak & e-Faktur',   href: '/keuangan/pajak/efaktur',         icon: Receipt,
    children: [
      { label: 'e-Faktur',          href: '/keuangan/pajak/efaktur' },
      { label: 'Laporan Pajak',     href: '/keuangan/pajak/laporan' },
    ],
  },
  { label: 'Rekonsiliasi Bank',  href: '/keuangan/rekonsiliasi',          icon: ArrowLeftRight },
  { label: 'Approval',           href: '/approval',                       icon: CheckCircle2, badge: 0 },
  { label: 'Jurnal',             href: '/finance/journal-entries',        icon: FileText,
    children: [
      { label: 'Semua Jurnal',   href: '/finance/journal-entries' },
      { label: 'Jurnal Umum',    href: '/finance/journal-entries?type=general' },
      { label: 'Penjualan',      href: '/finance/journal-entries?type=sales' },
      { label: 'Pembelian',      href: '/finance/journal-entries?type=purchase' },
    ],
  },
  { label: 'Aset Tetap',         href: '/finance/fixed-assets',           icon: Building2 },
  { label: 'Budget',             href: '/finance/budget',                 icon: Target },
  { label: 'Piutang Aging',      href: '/finance/aged-receivable',        icon: TrendingUp },
  { label: 'Hutang Aging',       href: '/finance/aged-payable',           icon: ArrowDownRight },
  { label: 'Credit Limit',       href: '/finance/credit-limit',           icon: CreditCard },
  { label: 'Pengeluaran',        href: '/finance/expenses',               icon: Receipt },
  { label: 'Kas & Bank',         href: '/finance/bank-accounts',          icon: Landmark },
  { label: 'Konfigurasi Pajak',  href: '/finance/tax-config',             icon: Percent },
  { label: 'Workflow Config',    href: '/settings/workflow',              icon: GitBranch },
  { label: 'Pengaturan',        href: '/accounting/settings',            icon: Settings },
];

export const INVENTORY_CONFIG = { appName: 'Inventaris', appColor: '#F57C00', appGradient: 'from-amber-500 to-orange-600', appIcon: Package };
export const INVENTORY_NAV: NavItem[] = [
  { label: 'Produk',             href: '/inventory/products',          icon: Package,
    children: [
      { label: 'Semua Produk',   href: '/inventory/products' },
      { label: 'Kategori',       href: '/inventory/products/categories' },
    ],
  },
  { label: 'Lot & Serial',       href: '/inventory/lots',              icon: Hash },
  { label: 'Kadaluarsa',         href: '/inventory/expiry',            icon: AlertTriangle },
  { label: 'Penerimaan',         href: '/purchasing/goods-receipts',   icon: ArrowDownRight },
  { label: 'Pengiriman',         href: '/inventory/deliveries',        icon: ArrowUpRight },
  { label: 'Transfer Stok',      href: '/inventory/transfers',         icon: ArrowLeftRight },
  { label: 'Perpindahan Stok',   href: '/inventory/stock-movements',   icon: ArrowLeftRight },
  { label: 'Stock Opname',       href: '/inventory/stock-opnames',     icon: ClipboardCheck },
  { label: 'Gudang',             href: '/inventory/warehouses',        icon: Warehouse },
  { label: 'Reorder Rules',      href: '/inventory/reorder-rules',     icon: RefreshCw },
  { label: 'Putaway Rules',      href: '/inventory/putaway-rules',     icon: Layers },
  { label: 'Laporan',            href: '/inventory/reports',           icon: BarChart2,
    children: [
      { label: 'Kartu Stok',         href: '/inventory/reports?type=card' },
      { label: 'Mutasi Stok',        href: '/inventory/reports?type=movement' },
      { label: 'Inventory Valuation', href: '/inventory/reports?type=valuation' },
    ],
  },
  { label: 'Pengaturan',         href: '/inventory/settings',          icon: Settings },
];

export const HR_CONFIG = { appName: 'Sumber Daya Manusia', appColor: '#C2185B', appGradient: 'from-pink-500 to-rose-600', appIcon: UserCheck };
export const HR_NAV: NavItem[] = [
  { label: 'Karyawan',           href: '/hr/employees',        icon: UserCheck,
    children: [
      { label: 'Data Karyawan',   href: '/hr/employees' },
      { label: 'Dokumen Karyawan', href: '/hr/employees/documents' },
    ],
  },
  { label: 'Struktur Organisasi', href: '/hr/organization',   icon: GitBranch },
  { label: 'Absensi',            href: '/hr/attendances',      icon: Calendar, badge: 3,
    children: [
      { label: 'Rekap Absensi',      href: '/hr/attendances' },
      { label: 'Import Fingerprint', href: '/hr/attendances/import' },
      { label: 'Lap. Keterlambatan', href: '/hr/attendances/late-report' },
    ],
  },
  { label: 'Cuti & Izin',        href: '/hr/leaves',           icon: CalendarX, badge: 5 },
  { label: 'Training',           href: '/hr/training',         icon: GraduationCap },
  { label: 'Sertifikasi',        href: '/hr/certifications',   icon: Award },
  { label: 'Pinjaman Karyawan',  href: '/hr/loans',            icon: DollarSign },
  { label: 'BPJS',              href: '/hr/bpjs',              icon: Heart },
  { label: 'Penilaian (KPI)',    href: '/hr/appraisals',       icon: Star },
  { label: 'Rekrutmen',         href: '/hr/recruitment',       icon: UserPlus },
  { label: 'Laporan SDM',       href: '/hr/reports',           icon: BarChart2,
    children: [
      { label: 'Laporan Absensi',   href: '/hr/reports?type=attendance' },
      { label: 'Turnover Rate',     href: '/hr/reports?type=turnover' },
      { label: 'Headcount',         href: '/hr/reports?type=headcount' },
    ],
  },
  { label: 'Pengaturan',        href: '/hr/settings',          icon: Settings },
];

export const PAYROLL_CONFIG = { appName: 'Penggajian', appColor: '#7B1FA2', appGradient: 'from-purple-600 to-violet-700', appIcon: DollarSign };
export const PAYROLL_NAV: NavItem[] = [
  { label: 'Periode Gaji',       href: '/hr/payrolls/periods',     icon: Calendar },
  { label: 'Slip Gaji',          href: '/hr/payrolls/slips',       icon: FileText,
    children: [
      { label: 'Semua Slip',      href: '/hr/payrolls/slips' },
      { label: 'Draft',           href: '/hr/payrolls/slips?status=draft' },
      { label: 'Dikonfirmasi',    href: '/hr/payrolls/slips?status=done' },
    ],
  },
  { label: 'Slip Massal',        href: '/hr/payrolls/batch',       icon: Users },
  { label: 'Komponen Gaji',      href: '/hr/payrolls/components',  icon: Layers },
  { label: 'Kalkulator BPJS',    href: '/hr/payrolls/bpjs-calc',   icon: Heart },
  { label: 'Kalkulator PPh21',   href: '/hr/payrolls/pph21-calc',  icon: Percent },
  { label: 'Riwayat Gaji',       href: '/hr/payrolls/history',     icon: Clock },
  { label: 'Export Bank',        href: '/hr/payrolls/bank-export', icon: Landmark },
  { label: 'Laporan Payroll',    href: '/hr/payrolls/reports',     icon: BarChart2,
    children: [
      { label: 'Rekap Gaji',     href: '/hr/payrolls/reports?type=summary' },
      { label: 'Laporan PPh21',  href: '/hr/payrolls/reports?type=pph21' },
      { label: 'Laporan BPJS',   href: '/hr/payrolls/reports?type=bpjs' },
    ],
  },
  { label: 'Pengaturan',         href: '/hr/payrolls/settings',    icon: Settings },
];

export const PURCHASING_CONFIG = { appName: 'Pembelian', appColor: '#5D4037', appGradient: 'from-stone-500 to-stone-700', appIcon: Truck };
export const PURCHASING_NAV: NavItem[] = [
  { label: 'RFQ',                 href: '/purchasing/rfq',                      icon: FileText, badge: 4,
    children: [
      { label: 'Semua RFQ',       href: '/purchasing/rfq' },
      { label: 'Draft',           href: '/purchasing/rfq?status=draft' },
      { label: 'Dikirim',         href: '/purchasing/rfq?status=sent' },
    ],
  },
  { label: 'Purchase Order',      href: '/purchasing/purchase-orders',          icon: ShoppingBag,
    children: [
      { label: 'Semua PO',        href: '/purchasing/purchase-orders' },
      { label: 'Menunggu Approval', href: '/purchasing/purchase-orders?status=to_approve' },
      { label: 'Dikonfirmasi',    href: '/purchasing/purchase-orders?status=confirmed' },
    ],
  },
  { label: 'Penerimaan Barang',   href: '/purchasing/goods-receipts',           icon: PackageCheck },
  { label: 'Vendor Bill (AP)',    href: '/purchasing/bills',                    icon: FileText,
    children: [
      { label: 'Semua Bill',        href: '/purchasing/bills' },
      { label: 'Buat Bill',         href: '/purchasing/bills/new' },
      { label: 'AP Aging',          href: '/purchasing/bills?aging=1' },
    ],
  },
  { label: 'Retur Pembelian',     href: '/purchasing/returns',                  icon: RotateCcw },
  { label: 'Perbandingan Harga',  href: '/purchasing/price-comparison',         icon: Scale },
  { label: 'Purchase Agreement',  href: '/purchasing/agreements',               icon: FileCheck },
  { label: 'Approval Matrix',     href: '/purchasing/approval-matrix',          icon: GitBranch },
  { label: 'Supplier',            href: '/purchasing/suppliers',                icon: Building2 },
  { label: 'Laporan',             href: '/purchasing/reports',                  icon: TrendingUp,
    children: [
      { label: 'Hutang Supplier',  href: '/purchasing/reports?type=payable' },
      { label: 'Lap. Pembelian',   href: '/purchasing/reports?type=purchase' },
    ],
  },
  { label: 'Pengaturan',          href: '/purchasing/settings',                 icon: Settings },
];

export const POS_CONFIG = { appName: 'Kasir (POS)', appColor: '#E64A19', appGradient: 'from-orange-500 to-red-600', appIcon: Monitor };
export const POS_NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/pos/management',          icon: BarChart2 },
  { label: 'Buka Kasir',      href: '/pos/cashier',             icon: Monitor },
  { label: 'Sesi Kasir',      href: '/pos/sessions',            icon: Calendar },
  { label: 'Order',           href: '/pos/orders',              icon: ShoppingCart },
  { label: 'Produk POS',      href: '/pos/products',            icon: Package },
  { label: 'Pelanggan',       href: '/customers',               icon: Users },
  { label: 'Laporan',         href: '/pos/reports',             icon: TrendingUp,
    children: [
      { label: 'Ringkasan',       href: '/pos/management?tab=reports' },
      { label: 'Per Kasir',       href: '/pos/management?tab=by-cashier' },
      { label: 'Per Produk',      href: '/pos/management?tab=by-product' },
      { label: 'Per Pembayaran',  href: '/pos/management?tab=by-payment' },
    ],
  },
  { label: 'Pengaturan',      href: '/pos/settings',            icon: Settings },
];

export const DELIVERY_CONFIG = { appName: 'Pengiriman', appColor: '#1565C0', appGradient: 'from-blue-700 to-indigo-700', appIcon: Truck };
export const DELIVERY_NAV: NavItem[] = [
  { label: 'Pengiriman',   href: '/delivery/areas',   icon: Truck },
  { label: 'Wilayah',      href: '/delivery/areas',   icon: MapPin },
  { label: 'Driver',       href: '/driver',           icon: UserCheck },
  { label: 'Pengaturan',   href: '/delivery/settings',icon: Settings },
];

export const WAREHOUSE_CONFIG = { appName: 'Gudang', appColor: '#F57C00', appGradient: 'from-amber-500 to-orange-600', appIcon: Package };
export const WAREHOUSE_NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/gudang',               icon: BarChart2 },
  { label: 'Picking Order',  href: '/gudang/picking',       icon: ClipboardList },
  { label: 'Barang Masuk',   href: '/gudang/inbound',       icon: ArrowDownRight },
  { label: 'Barang Keluar',  href: '/gudang/outbound',      icon: ArrowUpRight },
  { label: 'Transfer',       href: '/gudang/transfer',      icon: ArrowLeftRight },
  { label: 'Stock Opname',   href: '/gudang/stock-opname',  icon: ClipboardCheck },
  { label: 'Riwayat',        href: '/gudang/history',       icon: Clock },
];

export const MANUFACTURING_CONFIG = { appName: 'Manufaktur', appColor: '#6D28D9', appGradient: 'from-violet-600 to-purple-700', appIcon: Factory };
export const MANUFACTURING_NAV: NavItem[] = [
  { label: 'Bill of Material', href: '/manufacturing/bom',                icon: Layers,
    children: [
      { label: 'Semua BOM',    href: '/manufacturing/bom' },
      { label: 'Versi BOM',    href: '/manufacturing/bom/versions' },
      { label: 'Varian BOM',   href: '/manufacturing/bom/variants' },
    ],
  },
  { label: 'Work Order',       href: '/manufacturing/orders',             icon: ClipboardList },
  { label: 'MRP',              href: '/manufacturing/mrp',                icon: Target },
  { label: 'Work Center',      href: '/manufacturing/work-centers',       icon: Factory },
  { label: 'Byproduct',        href: '/manufacturing/byproducts',         icon: Package },
  { label: 'Scrap',            href: '/manufacturing/scrap',              icon: AlertTriangle },
  { label: 'Biaya Produksi',   href: '/manufacturing/production-cost',    icon: DollarSign },
  { label: 'Laporan',          href: '/manufacturing/reports',            icon: BarChart2,
    children: [
      { label: 'Cost Per Unit',      href: '/manufacturing/reports?type=cost' },
      { label: 'BOM Usage',          href: '/manufacturing/reports?type=bom' },
      { label: 'Efisiensi Produksi', href: '/manufacturing/reports?type=efficiency' },
    ],
  },
  { label: 'Pengaturan',       href: '/manufacturing/settings',           icon: Settings },
];

export const SERVICE_CONFIG = { appName: 'Servis', appColor: '#DC2626', appGradient: 'from-red-500 to-rose-700', appIcon: Wrench };
export const SERVICE_NAV: NavItem[] = [
  { label: 'Work Order',       href: '/service/work-orders',       icon: ClipboardList },
  { label: 'Estimasi Biaya',   href: '/service/estimates',         icon: DollarSign },
  { label: 'Riwayat Servis',   href: '/service/history',           icon: Clock },
  { label: 'Garansi Jasa',     href: '/service/warranties',        icon: Shield },
  { label: 'Notifikasi WA',    href: '/service/notifications',     icon: MessageSquare },
  { label: 'Helpdesk',         href: '/helpdesk',                  icon: Phone },
  { label: 'Laporan',          href: '/service/reports',           icon: BarChart2 },
  { label: 'Pengaturan',       href: '/service/settings',          icon: Settings },
];

export const FLEET_CONFIG = { appName: 'Armada', appColor: '#0277BD', appGradient: 'from-blue-600 to-sky-700', appIcon: Car };
export const FLEET_NAV: NavItem[] = [
  { label: 'Kendaraan',         href: '/fleet/vehicles',          icon: Car },
  { label: 'Dokumen Kendaraan', href: '/fleet/documents',         icon: FileText },
  { label: 'Reminder STNK/KIR', href: '/fleet/reminders',        icon: Bell },
  { label: 'Penugasan Driver',  href: '/fleet/assignments',       icon: UserCheck },
  { label: 'Tracking BBM',     href: '/fleet/fuel-tracking',      icon: Fuel },
  { label: 'GPS Tracking',     href: '/fleet/gps',                icon: Navigation },
  { label: 'Biaya per KM',     href: '/fleet/cost-per-km',        icon: DollarSign },
  { label: 'Laporan',          href: '/fleet/reports',            icon: BarChart2 },
  { label: 'Pengaturan',       href: '/fleet/settings',           icon: Settings },
];

export const RECRUITMENT_CONFIG = { appName: 'Rekrutmen', appColor: '#00897B', appGradient: 'from-teal-500 to-teal-700', appIcon: UserPlus };
export const RECRUITMENT_NAV: NavItem[] = [
  { label: 'Lowongan',            href: '/recruitment/positions',             icon: Briefcase },
  { label: 'Pelamar',             href: '/recruitment/applications',          icon: Users },
  { label: 'Scoring Pelamar',     href: '/recruitment/scoring',               icon: Star },
  { label: 'Career Page',         href: '/recruitment/career-page',           icon: Globe },
  { label: 'Biaya Rekrutmen',     href: '/recruitment/costs',                 icon: DollarSign },
  { label: 'Generator Kontrak',   href: '/recruitment/contract-generator',    icon: FileText },
  { label: 'Onboarding',          href: '/recruitment/onboarding',            icon: ClipboardCheck },
  { label: 'Laporan',             href: '/recruitment/reports',               icon: BarChart2 },
  { label: 'Pengaturan',          href: '/recruitment/settings',              icon: Settings },
];

export const MARKETPLACE_CONFIG = { appName: 'Marketplace', appColor: '#E91E63', appGradient: 'from-pink-500 to-rose-600', appIcon: ShoppingBag };
export const MARKETPLACE_NAV: NavItem[] = [
  { label: 'Sinkronisasi Harga',  href: '/marketplace/price-sync',            icon: RefreshCw },
  { label: 'Reservasi Stok',      href: '/marketplace/stock-reservation',     icon: Package },
  { label: 'Retur Marketplace',   href: '/marketplace/returns',               icon: RotateCcw },
  { label: 'Komisi Platform',     href: '/marketplace/commissions',           icon: Percent },
  { label: 'Error Log',           href: '/marketplace/error-log',             icon: AlertTriangle },
  { label: 'Retry Sync',          href: '/marketplace/retry-sync',            icon: RefreshCw },
  { label: 'Pengaturan',          href: '/marketplace/settings',              icon: Settings },
];

export const TAX_CONFIG = { appName: 'Tax Engine', appColor: '#0F766E', appGradient: 'from-teal-600 to-teal-800', appIcon: Calculator };
export const TAX_NAV: NavItem[] = [
  { label: 'Setup Pajak',        href: '/tax/setup',         icon: Settings,
    children: [
      { label: 'Jenis Pajak',    href: '/tax/setup' },
      { label: 'PPN (11%)',      href: '/tax/setup?tipe=PPN' },
      { label: 'PPh 21',         href: '/tax/setup?tipe=PPH21' },
      { label: 'PPh 23',         href: '/tax/setup?tipe=PPH23' },
      { label: 'PPh 4(2)',       href: '/tax/setup?tipe=PPH4A2' },
    ],
  },
  { label: 'E-Faktur',           href: '/tax/efaktur',       icon: FileText, badge: 0,
    children: [
      { label: 'Semua E-Faktur', href: '/tax/efaktur' },
      { label: 'Draft',          href: '/tax/efaktur?status=DRAFT' },
      { label: 'Uploaded',       href: '/tax/efaktur?status=UPLOADED' },
      { label: 'Approved',       href: '/tax/efaktur?status=APPROVED' },
    ],
  },
  { label: 'Rekap PPN',          href: '/tax/rekap-ppn',     icon: PieChart },
  { label: 'Kalkulator Pajak',   href: '/tax/calculator',    icon: Calculator },
  { label: 'PPh 21 Karyawan',    href: '/hr/payrolls/pph21-calc', icon: UserCheck },
  { label: 'Laporan Pajak',      href: '/tax/reports',       icon: BarChart2,
    children: [
      { label: 'Laporan PPN',    href: '/tax/reports?type=ppn' },
      { label: 'Laporan PPh 21', href: '/tax/reports?type=pph21' },
      { label: 'Laporan PPh 23', href: '/tax/reports?type=pph23' },
    ],
  },
  { label: 'Pengaturan',         href: '/tax/settings',      icon: Settings },
];

export const SETTINGS_CONFIG = { appName: 'Pengaturan', appColor: '#546E7A', appGradient: 'from-slate-500 to-slate-700', appIcon: Settings };
export const SETTINGS_NAV: NavItem[] = [
  { label: 'Umum',               href: '/settings',                    icon: Settings },
  { label: 'User Management',    href: '/settings/users',              icon: Users },
  { label: 'Role & Permission',  href: '/settings/roles',              icon: Shield },
  { label: 'Multi Perusahaan',   href: '/settings/companies',          icon: Building2 },
  { label: 'Email Gateway',      href: '/settings/email-gateway',      icon: Mail },
  { label: 'WA Gateway',         href: '/settings/wa-gateway',         icon: Smartphone },
  { label: 'Format Nomor Dok',   href: '/settings/document-numbers',   icon: Hash },
  { label: 'Konfigurasi Pajak',  href: '/settings/tax',                icon: Percent },
  { label: 'Mata Uang',          href: '/settings/currencies',         icon: Globe },
  { label: 'Backup & Restore',   href: '/settings/backup',             icon: HardDrive },
  { label: 'API Integration',    href: '/settings/api',                icon: Link2 },
  { label: 'Activity Log',       href: '/settings/activity-log',       icon: Activity },
  { label: 'Users & Akses',      href: '/access',                      icon: Shield },
  { label: 'Integrasi',          href: '/kledo',                       icon: Zap },
  { label: 'Notifikasi',         href: '/notifications',               icon: Bell },
];

export const REPORTS_CONFIG = { appName: 'Laporan & Analitik', appColor: '#7B1FA2', appGradient: 'from-purple-600 to-violet-700', appIcon: BarChart3 };
export const REPORTS_NAV: NavItem[] = [
  { label: 'Ringkasan',           href: '/reports',                    icon: BarChart2 },
  { label: 'Lap. Penjualan',      href: '/reports/sales',              icon: ShoppingCart,
    children: [
      { label: 'by Customer',      href: '/reports/sales?type=customer' },
      { label: 'by Produk',        href: '/reports/sales?type=product' },
      { label: 'by Salesman',      href: '/reports/sales?type=salesman' },
    ],
  },
  { label: 'Lap. Inventaris',     href: '/reports/inventory',          icon: Package,
    children: [
      { label: 'Kartu Stok',       href: '/reports/inventory?type=card' },
      { label: 'Mutasi Stok',      href: '/reports/inventory?type=movement' },
      { label: 'Penilaian Stok',   href: '/reports/inventory?type=valuation' },
    ],
  },
  { label: 'Lap. Keuangan',       href: '/reports/finance',            icon: DollarSign,
    children: [
      { label: 'Laba & Rugi',      href: '/reports/finance?type=pl' },
      { label: 'Neraca',           href: '/reports/finance?type=bs' },
      { label: 'Cash Flow',        href: '/reports/finance?type=cf' },
      { label: 'Trial Balance',    href: '/reports/finance?type=tb' },
    ],
  },
  { label: 'Lap. SDM',            href: '/reports/hr',                 icon: UserCheck,
    children: [
      { label: 'Absensi',          href: '/reports/hr?type=attendance' },
      { label: 'Turnover Rate',    href: '/reports/hr?type=turnover' },
      { label: 'Headcount',        href: '/reports/hr?type=headcount' },
    ],
  },
  { label: 'Lap. Payroll',        href: '/reports/payroll',            icon: DollarSign,
    children: [
      { label: 'Rekap Gaji',       href: '/reports/payroll?type=summary' },
      { label: 'Laporan PPh21',    href: '/reports/payroll?type=pph21' },
      { label: 'Laporan BPJS',     href: '/reports/payroll?type=bpjs' },
    ],
  },
  { label: 'Lap. Manufaktur',     href: '/reports/manufacturing',      icon: Factory,
    children: [
      { label: 'Cost Per Unit',          href: '/reports/manufacturing?type=cost' },
      { label: 'BOM Usage',              href: '/reports/manufacturing?type=bom' },
      { label: 'Efisiensi Produksi',     href: '/reports/manufacturing?type=efficiency' },
    ],
  },
  { label: 'Lap. Pelanggan',      href: '/reports/customers',          icon: Users },
  { label: 'Lap. Pembelian',      href: '/reports/purchasing',         icon: Truck },
];

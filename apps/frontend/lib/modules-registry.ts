import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, ShoppingCart, ShoppingBag, Package,
  Factory, DollarSign, UserCheck, Megaphone,
  Wrench, Users, Globe, Settings, Building2, Calculator,
} from 'lucide-react';

export type ModuleStatus = 'core' | 'coming-soon' | null;

export interface ERP_Module {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  longDesc: string;
  features: string[];
  icon: LucideIcon;
  color: string;
  bgColor: string;
  gradient: string;
  version: string;
  installs: string;
  rating: number;
  deps: string[];
  featured?: boolean;
  href?: string;
  isCore?: boolean;
  status?: ModuleStatus;
}

export const MODULES: ERP_Module[] = [
  {
    id: 'dashboard',
    name: 'Dashboard & Reports',
    emoji: '📊',
    desc: 'Pantau bisnis real-time dengan BI, laporan, dan analytics.',
    longDesc: 'Dashboard eksekutif lengkap dengan grafik interaktif, business intelligence, laporan penjualan, analytics marketing, dan activity log seluruh pengguna sistem.',
    features: ['Dashboard Eksekutif', 'BI & Analytics', 'Laporan Penjualan', 'Analytics Marketing', 'Laporan & BI', 'Activity Log'],
    icon: LayoutDashboard,
    color: '#0891B2',
    bgColor: '#CFFAFE',
    gradient: 'linear-gradient(135deg, #0891B2, #0E7490)',
    version: '17.0', installs: '14.2K', rating: 4.8,
    deps: [], href: '/reports', featured: true,
  },
  {
    id: 'sales',
    name: 'Sales',
    emoji: '🛒',
    desc: 'Penjualan, CRM, invoice, POS, marketplace, dan pengiriman.',
    longDesc: 'Modul sales lengkap mencakup semua proses penjualan dari quotation hingga pengiriman, termasuk CRM pipeline, data pelanggan, invoice & piutang, kasir POS, sinkronisasi marketplace, dan manajemen armada pengiriman.',
    features: ['Penjualan (SO & DO)', 'CRM & Pipeline', 'Pelanggan & Membership', 'Invoice & Piutang', 'Point of Sale (POS)', 'Marketplace (Shopee, Tokopedia, TikTok)', 'Pengiriman & Armada'],
    icon: ShoppingCart,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    version: '17.0', installs: '12.4K', rating: 4.9,
    deps: [], href: '/sales', featured: true,
  },
  {
    id: 'purchase',
    name: 'Purchase',
    emoji: '🛍',
    desc: 'Pembelian, RFQ, supplier, dan penerimaan barang.',
    longDesc: 'Kelola seluruh proses pembelian dari permintaan penawaran (RFQ) hingga penerimaan barang. Termasuk manajemen data supplier, purchase order, monitoring hutang, dan retur supplier.',
    features: ['Pembelian & PO', 'RFQ (Request for Quotation)', 'Manajemen Supplier', 'Penerimaan Barang (GR)', 'Retur Supplier', 'Hutang Usaha'],
    icon: ShoppingBag,
    color: '#0D9488',
    bgColor: '#CCFBF1',
    gradient: 'linear-gradient(135deg, #0D9488, #0F766E)',
    version: '17.0', installs: '7.6K', rating: 4.6,
    deps: ['inventory'], href: '/purchasing',
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    emoji: '📦',
    desc: 'Stok, gudang, QC, maintenance, dan aset tetap.',
    longDesc: 'Manajemen inventaris menyeluruh: produk & barcode, multi gudang & stock opname, quality control, maintenance mesin, dan aset tetap dengan depresiasi otomatis.',
    features: ['Produk & Barcode', 'Gudang & Multi Gudang', 'Stock Opname', 'Quality Control (QC)', 'Maintenance Mesin', 'Aset Tetap & Depresiasi'],
    icon: Package,
    color: '#D97706',
    bgColor: '#FEF3C7',
    gradient: 'linear-gradient(135deg, #D97706, #B45309)',
    version: '17.0', installs: '13.8K', rating: 4.9,
    deps: [], href: '/inventory', featured: true,
  },
  {
    id: 'manufacturing',
    name: 'Production / Manufacturing',
    emoji: '🏭',
    desc: 'Manufaktur, BOM, work order, dan perencanaan produksi.',
    longDesc: 'Kelola seluruh proses produksi: bill of materials (BOM) multi-level, work order & assign operator, jadwal produksi, material requirements planning (MRP), dan cost produksi otomatis.',
    features: ['Manufaktur & Produksi', 'Bill of Materials (BOM)', 'Work Order & Operator', 'Production Planning (MRP)', 'Biaya Produksi', 'Work Center'],
    icon: Factory,
    color: '#6D28D9',
    bgColor: '#EDE9FE',
    gradient: 'linear-gradient(135deg, #6D28D9, #5B21B6)',
    version: '17.0', installs: '4.1K', rating: 4.5,
    deps: ['inventory'], href: '/manufacturing',
  },
  {
    id: 'accounting',
    name: 'Accounting & Finance',
    emoji: '💰',
    desc: 'Akuntansi, kas & bank, pajak, pengeluaran, dan approval.',
    longDesc: 'Sistem keuangan lengkap dengan akuntansi double-entry (COA, jurnal, buku besar, neraca, L/R), manajemen kas & bank, perpajakan (PPN, PPh, e-Faktur), pengeluaran & reimbursement, serta approval keuangan multi-level.',
    features: ['Akuntansi (COA & Jurnal)', 'Kas & Bank', 'Pajak (PPN, PPh, e-Faktur)', 'Pengeluaran & Reimburse', 'Approval Keuangan', 'Laporan Keuangan'],
    icon: DollarSign,
    color: '#059669',
    bgColor: '#D1FAE5',
    gradient: 'linear-gradient(135deg, #059669, #047857)',
    version: '17.0', installs: '10.5K', rating: 4.8,
    deps: [], href: '/accounting', featured: true,
  },
  {
    id: 'hrm',
    name: 'Human Resource (HRM)',
    emoji: '👨‍💼',
    desc: 'Karyawan, absensi, cuti, payroll, rekrutmen, dan appraisal.',
    longDesc: 'Manajemen SDM terpadu: data karyawan & struktur organisasi, absensi & shift kerja (fingerprint/face), pengajuan & approval cuti, penggajian otomatis (BPJS, PPh21), rekrutmen & hiring, serta penilaian kinerja 360°.',
    features: ['Data Karyawan & Organisasi', 'Kehadiran / Absensi', 'Cuti & Izin', 'Payroll (BPJS, PPh21)', 'Rekrutmen & Hiring', 'Appraisal & KPI'],
    icon: UserCheck,
    color: '#DB2777',
    bgColor: '#FCE7F3',
    gradient: 'linear-gradient(135deg, #DB2777, #BE185D)',
    version: '17.0', installs: '8.9K', rating: 4.7,
    deps: [], href: '/hr', featured: true,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    emoji: '📢',
    desc: 'WhatsApp, email, campaign, loyalty, voucher, dan survey.',
    longDesc: 'Kelola semua aktivitas pemasaran: blast WhatsApp & auto reply, email marketing dengan template, campaign manager multi-channel, program loyalty & membership, voucher & promo, serta survey kepuasan pelanggan.',
    features: ['WhatsApp Marketing & Blast', 'Email Marketing', 'Campaign Manager', 'Loyalty Program & Membership', 'Voucher & Promo', 'Survey & NPS'],
    icon: Megaphone,
    color: '#EA580C',
    bgColor: '#FFEDD5',
    gradient: 'linear-gradient(135deg, #EA580C, #C2410C)',
    version: '17.0', installs: '4.8K', rating: 4.7,
    deps: [], href: '/marketing',
  },
  {
    id: 'service',
    name: 'Service & Support',
    emoji: '🛠',
    desc: 'Servis elektronik, appointment, helpdesk, dan tiket.',
    longDesc: 'Layanan purna jual lengkap: manajemen servis & garansi elektronik, booking appointment online, helpdesk dengan SLA & eskalasi, dan sistem tiket dukungan pelanggan.',
    features: ['Service Elektronik & Garansi', 'Appointment & Booking', 'Helpdesk & SLA', 'Tiket Support', 'Assign Teknisi', 'Laporan Servis'],
    icon: Wrench,
    color: '#DC2626',
    bgColor: '#FEE2E2',
    gradient: 'linear-gradient(135deg, #DC2626, #B91C1C)',
    version: '17.0', installs: '3.7K', rating: 4.5,
    deps: [], href: '/service',
  },
  {
    id: 'productivity',
    name: 'Productivity & Collaboration',
    emoji: '👥',
    desc: 'Chat, kalender, dokumen, knowledge base, dan workflow.',
    longDesc: 'Tingkatkan kolaborasi tim dengan chat internal real-time, kalender bersama, manajemen dokumen (DMS), knowledge base & wiki, pengumuman perusahaan, approval multi-level, dan workflow engine untuk otomasi proses bisnis.',
    features: ['Chat Internal Real-time', 'Kalender & Agenda Tim', 'Manajemen Dokumen (DMS)', 'Knowledge Base & Wiki', 'Pengumuman Perusahaan', 'Approval Multi-level', 'Workflow Engine & Automasi'],
    icon: Users,
    color: '#2563EB',
    bgColor: '#DBEAFE',
    gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    version: '17.0', installs: '5.1K', rating: 4.7,
    deps: [], href: '/productivity',
  },
  {
    id: 'website',
    name: 'Website & Commerce',
    emoji: '🌐',
    desc: 'Website builder, e-commerce, blog, SEO, dan portal.',
    longDesc: 'Bangun kehadiran digital lengkap: website drag & drop, toko online terintegrasi, blog & artikel, optimasi SEO, live chat pengunjung, banner & slider promosi, serta customer portal mandiri.',
    features: ['Website Builder (Drag & Drop)', 'E-Commerce & Toko Online', 'Blog & Konten', 'SEO Tools', 'Live Chat Pengunjung', 'Banner & Slider', 'Customer Portal'],
    icon: Globe,
    color: '#0891B2',
    bgColor: '#CFFAFE',
    gradient: 'linear-gradient(135deg, #0891B2, #0E7490)',
    version: '17.0', installs: '4.5K', rating: 4.6,
    deps: [], href: '/website',
  },
  {
    id: 'system',
    name: 'System & Administration',
    emoji: '⚙️',
    desc: 'Pengaturan, user & role, integrasi, API, backup, audit.',
    longDesc: 'Administrasi sistem terpusat: konfigurasi perusahaan, manajemen user & role dengan permission granular, integrasi third-party (Kledo, WA Gateway, payment), API management, queue monitor, backup database otomatis, automation, dan audit log.',
    features: ['Pengaturan Sistem', 'User & Role & Permission', 'Integrasi Third-party', 'API Management', 'Queue Monitor', 'Backup Database', 'Automation & Cronjob', 'Audit Log'],
    icon: Settings,
    color: '#475569',
    bgColor: '#F1F5F9',
    gradient: 'linear-gradient(135deg, #475569, #334155)',
    version: '17.0', installs: '15.0K', rating: 4.8,
    deps: [], href: '/settings', isCore: true, status: 'core',
  },
  {
    id: 'tax_engine',
    name: 'Tax Engine',
    emoji: '🧾',
    desc: 'Perpajakan Indonesia: PPN, PPh 21/23/4(2), e-Faktur, rekap DJP.',
    longDesc: 'Modul perpajakan lengkap sesuai regulasi Indonesia: kalkulasi PPN 11%, PPh 21 progresif dengan PTKP, PPh 23 withholding, PPh 4(2) final, penomoran dan export e-Faktur format DJP, serta rekap PPN Masukan vs Keluaran per periode.',
    features: [
      'Kalkulasi PPN 11%',
      'PPh 21 Progresif + PTKP 2024',
      'PPh 23 (Jasa/Dividen/Royalti)',
      'PPh 4(2) Final (Sewa/Konstruksi)',
      'E-Faktur & Penomoran Otomatis',
      'Export CSV Format DJP',
      'Rekap PPN Masukan vs Keluaran',
    ],
    icon: Calculator,
    color: '#0F766E',
    bgColor: '#CCFBF1',
    gradient: 'linear-gradient(135deg, #0F766E, #0D9488)',
    version: '17.0', installs: '6.1K', rating: 4.9,
    deps: ['accounting'], href: '/tax/setup', featured: true,
  },
  {
    id: 'multi_branch',
    name: 'Multi Branch',
    emoji: '🏬',
    desc: 'Kelola semua cabang bisnis dalam satu platform.',
    longDesc: 'Kelola multiple cabang atau lokasi bisnis sekaligus: pemisahan data per cabang, konsolidasi laporan lintas cabang, transfer antar cabang, dan pengaturan hak akses per lokasi.',
    features: ['Manajemen Multi Cabang', 'Pemisahan Data per Cabang', 'Konsolidasi Laporan', 'Transfer Antar Cabang', 'Akses per Lokasi'],
    icon: Building2,
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
    gradient: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
    version: '17.0', installs: '3.8K', rating: 4.6,
    deps: [],
  },
];

export const FEATURED_MODULES = MODULES.filter(m => m.featured);
export const CORE_MODULES = MODULES.filter(m => m.isCore);
export const DEFAULT_INSTALLED_IDS = CORE_MODULES.map(m => m.id);
export const MODULE_CATEGORIES = ['Semua'];
export const APP_STORE_CATEGORIES = MODULES;

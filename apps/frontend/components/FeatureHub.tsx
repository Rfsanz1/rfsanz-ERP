'use client';

import Link from 'next/link';

interface FeatureLink {
  emoji: string;
  label: string;
  href: string;
  desc: string;
}

const MODULE_FEATURES: Record<string, FeatureLink[]> = {
  dashboard: [
    { emoji: '📊', label: 'Dashboard Eksekutif', href: '/reports',                    desc: 'KPI & ringkasan bisnis' },
    { emoji: '📈', label: 'BI & Analytics',       href: '/reports',                    desc: 'Business intelligence' },
    { emoji: '💰', label: 'Laporan Penjualan',    href: '/reports/sales',              desc: 'Revenue per periode' },
    { emoji: '📢', label: 'Analytics Marketing',  href: '/marketing/analytics',        desc: 'Performa campaign' },
    { emoji: '📋', label: 'Semua Laporan',         href: '/reports',                    desc: 'Laporan lengkap & BI' },
    { emoji: '🔔', label: 'Activity Log',          href: '/productivity/activity',      desc: 'Log aktivitas sistem' },
  ],
  sales: [
    { emoji: '🛒', label: 'Order Penjualan',        href: '/sales/orders',    desc: 'Sales Order & Delivery' },
    { emoji: '🤝', label: 'CRM & Pipeline',         href: '/crm',             desc: 'Kelola prospek & deal' },
    { emoji: '👥', label: 'Pelanggan',               href: '/customers',       desc: 'Data & membership' },
    { emoji: '🧾', label: 'Invoice & Piutang',      href: '/invoice',         desc: 'Tagihan & pembayaran' },
    { emoji: '🏪', label: 'Point of Sale',           href: '/pos',             desc: 'Kasir & transaksi tunai' },
    { emoji: '🛍',  label: 'Marketplace',            href: '/marketplace',     desc: 'Shopee, Tokopedia, TikTok' },
    { emoji: '🚚', label: 'Pengiriman & Armada',    href: '/delivery',        desc: 'Pengiriman & driver' },
  ],
  purchase: [
    { emoji: '📝', label: 'Purchase Order',          href: '/purchasing/purchase-orders', desc: 'Buat & kelola PO' },
    { emoji: '💬', label: 'RFQ',                     href: '/purchasing/purchase-orders', desc: 'Request for Quotation' },
    { emoji: '🏭', label: 'Manajemen Supplier',      href: '/purchasing/suppliers',        desc: 'Data & kontrak supplier' },
    { emoji: '📦', label: 'Penerimaan Barang',       href: '/purchasing/goods-receipts',  desc: 'Goods Receipt (GR)' },
    { emoji: '↩️',  label: 'Retur Supplier',          href: '/purchasing/goods-receipts',  desc: 'Pengembalian barang' },
    { emoji: '💳', label: 'Hutang Usaha',             href: '/accounting',                 desc: 'AP & pembayaran supplier' },
  ],
  inventory: [
    { emoji: '📦', label: 'Produk & Barcode',        href: '/inventory/products',        desc: 'Katalog & kode barcode' },
    { emoji: '🏠', label: 'Gudang & Multi Gudang',   href: '/inventory/warehouses',      desc: 'Lokasi & perpindahan stok' },
    { emoji: '📋', label: 'Stock Opname',             href: '/inventory/stock-opnames',  desc: 'Penghitungan fisik stok' },
    { emoji: '✅', label: 'Quality Control',          href: '/quality',                   desc: 'QC & inspeksi barang' },
    { emoji: '🔧', label: 'Maintenance Mesin',        href: '/maintenance',               desc: 'Jadwal & riwayat perawatan' },
    { emoji: '🏢', label: 'Aset Tetap',               href: '/finance',                   desc: 'Aset & depresiasi otomatis' },
  ],
  manufacturing: [
    { emoji: '🏭', label: 'Work Order',               href: '/manufacturing/orders',      desc: 'Order & proses produksi' },
    { emoji: '📐', label: 'Bill of Materials',        href: '/manufacturing/bom',         desc: 'BOM multi-level' },
    { emoji: '⚙️',  label: 'Work Center',             href: '/manufacturing/workcenters', desc: 'Mesin & workstation' },
    { emoji: '📅', label: 'Production Planning',      href: '/manufacturing',             desc: 'MRP & jadwal produksi' },
    { emoji: '💰', label: 'Biaya Produksi',           href: '/manufacturing',             desc: 'Cost produksi otomatis' },
    { emoji: '📦', label: 'Produk Jadi',              href: '/manufacturing/products',    desc: 'Hasil & output produksi' },
  ],
  accounting: [
    { emoji: '📚', label: 'COA & Jurnal',             href: '/finance/coa',              desc: 'Bagan akun & double-entry' },
    { emoji: '🏦', label: 'Kas & Bank',               href: '/finance/bank-accounts',    desc: 'Rekonsiliasi & mutasi' },
    { emoji: '🧾', label: 'Pajak (PPN, PPh)',          href: '/finance',                  desc: 'Kalkulasi & e-Faktur' },
    { emoji: '💸', label: 'Pengeluaran & Reimburse',  href: '/finance/expenses',         desc: 'Klaim & reimbursement' },
    { emoji: '✅', label: 'Approval Keuangan',         href: '/finance',                  desc: 'Multi-level approval' },
    { emoji: '📊', label: 'Laporan Keuangan',          href: '/finance/reports',          desc: 'Neraca, L/R, arus kas' },
  ],
  hrm: [
    { emoji: '👤', label: 'Data Karyawan',             href: '/hr/employees',    desc: 'Profil & struktur org' },
    { emoji: '📅', label: 'Kehadiran / Absensi',       href: '/hr/attendances',  desc: 'Shift & fingerprint' },
    { emoji: '🌴', label: 'Cuti & Izin',               href: '/hr/leaves',       desc: 'Pengajuan & approval cuti' },
    { emoji: '💰', label: 'Payroll',                   href: '/hr/payrolls',     desc: 'Gaji, BPJS, PPh21' },
    { emoji: '🎯', label: 'Rekrutmen & Hiring',        href: '/hr/recruitment',  desc: 'Pipeline & onboarding' },
    { emoji: '⭐', label: 'Appraisal & KPI',           href: '/hr/appraisals',   desc: 'Penilaian kinerja 360°' },
  ],
  marketing: [
    { emoji: '💬', label: 'WhatsApp Marketing',        href: '/marketing/whatsapp',   desc: 'Blast & auto reply WA' },
    { emoji: '📧', label: 'Email Marketing',           href: '/marketing/email',      desc: 'Template & schedule' },
    { emoji: '📢', label: 'Campaign Manager',          href: '/marketing/campaigns',  desc: 'Multi-channel campaign' },
    { emoji: '🎁', label: 'Loyalty & Membership',     href: '/marketing/loyalty',    desc: 'Poin & level member' },
    { emoji: '🏷️',  label: 'Voucher & Promo',          href: '/marketing/vouchers',   desc: 'Kode diskon & promo' },
    { emoji: '⭐', label: 'Survey & NPS',              href: '/marketing/surveys',    desc: 'Kepuasan pelanggan' },
  ],
  service: [
    { emoji: '📱', label: 'Service Elektronik',        href: '/service/repairs',       desc: 'Perbaikan & garansi' },
    { emoji: '📅', label: 'Appointment & Booking',     href: '/service/appointments',  desc: 'Jadwal servis online' },
    { emoji: '🎫', label: 'Unit Masuk',                href: '/service/incoming',      desc: 'Penerimaan unit servis' },
    { emoji: '🔑', label: 'Klaim Garansi',             href: '/service/warranty',      desc: 'Garansi & penggantian' },
    { emoji: '👨‍🔧', label: 'Assign Teknisi',           href: '/service/technicians',   desc: 'Penugasan & monitoring' },
    { emoji: '📊', label: 'Laporan Servis',            href: '/service/reports',       desc: 'Statistik & SLA' },
  ],
  productivity: [
    { emoji: '💬', label: 'Chat Internal',             href: '/productivity/chat',      desc: 'Pesan real-time tim' },
    { emoji: '📅', label: 'Kalender & Agenda',         href: '/productivity/calendar',  desc: 'Jadwal & event tim' },
    { emoji: '📁', label: 'Manajemen Dokumen',         href: '/productivity/documents', desc: 'DMS & file sharing' },
    { emoji: '📖', label: 'Knowledge Base',            href: '/productivity/knowledge', desc: 'Wiki & panduan internal' },
    { emoji: '📣', label: 'Pengumuman',                href: '/productivity/announce',  desc: 'Broadcast perusahaan' },
    { emoji: '✅', label: 'Approval Multi-level',      href: '/productivity/approvals', desc: 'Persetujuan bertingkat' },
    { emoji: '⚡', label: 'Workflow & Automasi',       href: '/productivity/workflows', desc: 'Otomasi proses bisnis' },
  ],
  website: [
    { emoji: '🎨', label: 'Website Builder',           href: '/website/builder',  desc: 'Drag & drop editor' },
    { emoji: '🛒', label: 'E-Commerce',                href: '/ecommerce',        desc: 'Toko online terintegrasi' },
    { emoji: '✏️',  label: 'Blog & Konten',             href: '/website/blog',     desc: 'Artikel & SEO content' },
    { emoji: '🔍', label: 'SEO Tools',                 href: '/website/seo',      desc: 'Optimasi mesin pencari' },
    { emoji: '💬', label: 'Live Chat',                 href: '/website/chat',     desc: 'Chat dengan pengunjung' },
    { emoji: '🖼️',  label: 'Banner & Slider',          href: '/website/banners',  desc: 'Promo visual homepage' },
    { emoji: '👤', label: 'Customer Portal',           href: '/website/portal',   desc: 'Self-service pelanggan' },
  ],
  system: [
    { emoji: '⚙️',  label: 'Pengaturan Sistem',        href: '/settings',   desc: 'Konfigurasi perusahaan' },
    { emoji: '👤', label: 'User & Role',               href: '/access',     desc: 'Hak akses & permission' },
    { emoji: '🔌', label: 'Integrasi',                 href: '/settings',   desc: 'API & third-party' },
    { emoji: '📡', label: 'API Management',            href: '/settings',   desc: 'Endpoint & token' },
    { emoji: '🗄️',  label: 'Backup Database',          href: '/settings',   desc: 'Backup otomatis' },
    { emoji: '🤖', label: 'Automation & Cronjob',      href: '/settings',   desc: 'Jadwal otomasi' },
    { emoji: '📋', label: 'Audit Log',                 href: '/settings',   desc: 'Riwayat aktivitas sistem' },
  ],
  multi_branch: [
    { emoji: '🏬', label: 'Multi Cabang',              href: '/settings',   desc: 'Kelola semua lokasi' },
    { emoji: '🔀', label: 'Transfer Antar Cabang',     href: '/inventory',  desc: 'Perpindahan stok & aset' },
    { emoji: '📊', label: 'Konsolidasi Laporan',       href: '/reports',    desc: 'Laporan gabungan cabang' },
    { emoji: '🔐', label: 'Akses per Lokasi',          href: '/access',     desc: 'Hak akses per cabang' },
    { emoji: '⚙️',  label: 'Pengaturan Cabang',        href: '/settings',   desc: 'Config per cabang' },
  ],
};

interface Props {
  moduleId: string;
  color: string;
  bgColor: string;
  gradient: string;
}

export default function FeatureHub({ moduleId, color, bgColor, gradient }: Props) {
  const features = MODULE_FEATURES[moduleId];
  if (!features?.length) return null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ background: gradient }}>
        <div>
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Fitur Modul</p>
          <p className="text-sm font-bold text-white">{features.length} fitur tersedia</p>
        </div>
        <div className="flex gap-1">
          {[...Array(Math.min(features.length, 5))].map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/40" />
          ))}
          {features.length > 5 && <div className="h-1.5 w-1.5 rounded-full bg-white/80" />}
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0 divide-x divide-y" style={{ borderColor: '#F0EBF8' }}>
        {features.map((f, i) => (
          <Link
            key={i}
            href={f.href}
            className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group"
            style={{ borderColor: '#F0EBF8' }}
          >
            <span className="text-xl flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform inline-block">{f.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight" style={{ color: '#2F2B3D' }}>{f.label}</p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: '#9CA3AF' }}>{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

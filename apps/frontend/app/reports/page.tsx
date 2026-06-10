'use client';
import { useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { REPORTS_CONFIG, REPORTS_NAV } from '../../lib/nav-configs';
import { BarChart3, TrendingUp, FileText, DollarSign, Users, Package, Truck, Calendar, Percent, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

interface ReportItem { name: string; href: string; description: string; }
interface ReportCategory { title: string; icon: any; accent: string; reports: ReportItem[]; }

const CATEGORIES: ReportCategory[] = [
  {
    title: 'Laporan Keuangan', icon: DollarSign, accent: '#3B82F6',
    reports: [
      { name: 'Laba Rugi (P&L)',     href: '/reports/finance?type=pl',             description: 'Pendapatan, biaya, dan keuntungan' },
      { name: 'Neraca Keuangan',     href: '/reports/finance?type=balance',         description: 'Aset, kewajiban, dan ekuitas' },
      { name: 'Arus Kas',            href: '/reports/finance?type=cashflow',        description: 'Pergerakan arus kas' },
      { name: 'Ringkasan Eksekutif', href: '/reports/finance?type=summary',         description: 'Metrik kunci bisnis' },
    ],
  },
  {
    title: 'Laporan Akuntansi', icon: BarChart3, accent: '#8B5CF6',
    reports: [
      { name: 'Buku Besar',        href: '/reports/finance?type=ledger',        description: 'Transaksi semua akun' },
      { name: 'Jurnal Umum',       href: '/reports/finance?type=journal',       description: 'Semua entri jurnal' },
      { name: 'Neraca Saldo',      href: '/reports/finance?type=trial',         description: 'Saldo semua akun' },
      { name: 'Rekonsiliasi Bank', href: '/reports/finance?type=reconciliation',description: 'Pencocokan rekening bank' },
    ],
  },
  {
    title: 'Laporan Penjualan', icon: TrendingUp, accent: '#10B981',
    reports: [
      { name: 'Detail Penjualan',   href: '/reports/sales?type=detail',        description: 'Transaksi individual' },
      { name: 'Aging Piutang',      href: '/reports/sales?type=aging',         description: 'Invoice yang belum lunas' },
      { name: 'Per Produk',         href: '/reports/sales?type=product',       description: 'Penjualan per produk' },
      { name: 'Per Pelanggan',      href: '/reports/sales?type=customer',      description: 'Penjualan per pelanggan' },
      { name: 'Per Salesperson',    href: '/reports/sales?type=salesperson',   description: 'Penjualan per sales' },
      { name: 'Profitabilitas',     href: '/reports/sales?type=profitability', description: 'Margin keuntungan' },
    ],
  },
  {
    title: 'Laporan Pembelian', icon: Truck, accent: '#EF4444',
    reports: [
      { name: 'Detail Pembelian', href: '/reports/purchasing?type=detail',   description: 'Transaksi pembelian' },
      { name: 'Aging Hutang',     href: '/reports/purchasing?type=aging',    description: 'Tagihan yang belum bayar' },
      { name: 'Per Produk',       href: '/reports/purchasing?type=product',  description: 'Pembelian per produk' },
      { name: 'Per Supplier',     href: '/reports/purchasing?type=supplier', description: 'Pembelian per supplier' },
    ],
  },
  {
    title: 'Laporan Inventori', icon: Package, accent: '#F59E0B',
    reports: [
      { name: 'Stok Saat Ini',    href: '/reports/inventory?type=current',    description: 'Level stok terkini' },
      { name: 'Mutasi Stok',      href: '/reports/inventory?type=movement',   description: 'Riwayat masuk/keluar stok' },
      { name: 'Stok Opname',      href: '/reports/inventory?type=opname',     description: 'Penghitungan fisik stok' },
      { name: 'Nilai Persediaan', href: '/reports/inventory?type=valuation',  description: 'Nilai stok saat ini' },
      { name: 'Produk Terlaris',  href: '/reports/inventory?type=topproducts',description: 'Produk paling banyak terjual' },
      { name: 'Stok Menipis',     href: '/reports/inventory?type=lowstock',   description: 'Stok di bawah minimum' },
    ],
  },
  {
    title: 'Laporan HR & Payroll', icon: Users, accent: '#6366F1',
    reports: [
      { name: 'Kehadiran Karyawan', href: '/reports/hr?type=attendance', description: 'Data absensi karyawan' },
      { name: 'Rekap Cuti',         href: '/reports/hr?type=leave',       description: 'Catatan pengambilan cuti' },
      { name: 'Ringkasan Payroll',  href: '/reports/hr?type=payroll',     description: 'Ringkasan penggajian' },
      { name: 'PPh 21',             href: '/reports/hr?type=pph21',       description: 'Pemotongan pajak karyawan' },
      { name: 'BPJS',               href: '/reports/hr?type=bpjs',        description: 'Laporan iuran BPJS' },
    ],
  },
  {
    title: 'Laporan Aset', icon: Calendar, accent: '#8B5CF6',
    reports: [
      { name: 'Daftar Aset',   href: '/reports/finance?type=assetlist',    description: 'Register aset tetap' },
      { name: 'Penyusutan',    href: '/reports/finance?type=depreciation', description: 'Akumulasi penyusutan' },
      { name: 'Nilai Buku',    href: '/reports/finance?type=bookvalue',    description: 'Nilai buku bersih' },
    ],
  },
  {
    title: 'Laporan Pajak', icon: Percent, accent: '#F59E0B',
    reports: [
      { name: 'Rekap PPN',       href: '/reports/finance?type=vat',       description: 'Rekap PPN masukan & keluaran' },
      { name: 'Export e-Faktur', href: '/reports/finance?type=einvoice',  description: 'Faktur pajak digital' },
      { name: 'SPT Tahunan',     href: '/reports/finance?type=annualtax', description: 'Surat pajak tahunan' },
    ],
  },
];

export default function ReportsPage() {
  const [q, setQ] = useState('');

  const filtered = CATEGORIES.map(cat => ({
    ...cat,
    reports: cat.reports.filter(r =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.description.toLowerCase().includes(q.toLowerCase())
    ),
  })).filter(cat => cat.reports.length > 0 || !q);

  return (
    <AppShell {...REPORTS_CONFIG} navItems={REPORTS_NAV} activeHref="/reports">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Pusat Laporan</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Akses semua laporan bisnis Anda dengan mudah</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box', boxShadow: 'var(--shadow-sm)' }}
            placeholder="Cari laporan…" />
        </div>

        {/* Categories */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Tidak ada laporan yang cocok dengan "{q}"</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.title}>
                  {/* Category label */}
                  <div className="flex items-center gap-2 mb-3" style={{ padding: '10px 16px', borderRadius: 12, background: cat.accent + '0D', border: '1px solid ' + cat.accent + '25' }}>
                    <Icon size={16} style={{ color: cat.accent }} strokeWidth={2} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: cat.accent, letterSpacing: '0.02em' }}>{cat.title.toUpperCase()}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{cat.reports.length} laporan</span>
                  </div>

                  {/* Report cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {cat.reports.map(report => (
                      <Link key={report.href} href={report.href}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', transition: 'all 0.15s', boxShadow: 'var(--shadow-xs)', cursor: 'pointer' }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = cat.accent + '66'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: cat.accent + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={15} style={{ color: cat.accent }} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{report.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.3 }} className="truncate">{report.description}</p>
                        </div>
                        <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { REPORTS_CONFIG, REPORTS_NAV } from '../../lib/nav-configs';
import {
  BarChart3, TrendingUp, FileText, DollarSign, Users, Package, Truck, UserCheck,
  Calendar, Percent, ChevronRight, Download, Search
} from 'lucide-react';

interface ReportCategory {
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  reports: {
    name: string;
    href: string;
    description: string;
  }[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    title: 'LAPORAN FINANSIAL',
    icon: DollarSign,
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    reports: [
      { name: 'Laporan Laba Rugi (P&L)', href: '/reports/finance?type=pl', description: 'Revenue, Cost, Profit' },
      { name: 'Neraca Akuntansi', href: '/reports/finance?type=balance', description: 'Assets, Liabilities, Equity' },
      { name: 'Arus Kas', href: '/reports/finance?type=cashflow', description: 'Cash movements' },
      { name: 'Executive Summary', href: '/reports/finance?type=summary', description: 'Key metrics overview' },
    ],
  },
  {
    title: 'LAPORAN AKUNTANSI',
    icon: BarChart3,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    reports: [
      { name: 'Buku Besar', href: '/reports/finance?type=ledger', description: 'GL account transactions' },
      { name: 'Jurnal Umum', href: '/reports/finance?type=journal', description: 'All journal entries' },
      { name: 'Trial Balance', href: '/reports/finance?type=trial', description: 'Account balances' },
      { name: 'Rekonsiliasi Bank', href: '/reports/finance?type=reconciliation', description: 'Bank reconciliation' },
    ],
  },
  {
    title: 'LAPORAN PENJUALAN',
    icon: TrendingUp,
    color: '#059669',
    bgColor: '#DCFCE7',
    reports: [
      { name: 'Detail Penjualan', href: '/reports/sales?type=detail', description: 'Individual transactions' },
      { name: 'Piutang Aging', href: '/reports/sales?type=aging', description: 'Outstanding invoices' },
      { name: 'Per Produk', href: '/reports/sales?type=product', description: 'Sales by product' },
      { name: 'Per Pelanggan', href: '/reports/sales?type=customer', description: 'Sales by customer' },
      { name: 'Per Salesperson', href: '/reports/sales?type=salesperson', description: 'Sales by person' },
      { name: 'Profitabilitas', href: '/reports/sales?type=profitability', description: 'Profit margins' },
    ],
  },
  {
    title: 'LAPORAN PEMBELIAN',
    icon: Truck,
    color: '#DC2626',
    bgColor: '#FEE2E2',
    reports: [
      { name: 'Detail Pembelian', href: '/reports/purchasing?type=detail', description: 'Purchase transactions' },
      { name: 'Hutang Aging', href: '/reports/purchasing?type=aging', description: 'Outstanding bills' },
      { name: 'Per Produk', href: '/reports/purchasing?type=product', description: 'Purchases by product' },
      { name: 'Per Supplier', href: '/reports/purchasing?type=supplier', description: 'Purchases by supplier' },
    ],
  },
  {
    title: 'LAPORAN INVENTORI',
    icon: Package,
    color: '#EA580C',
    bgColor: '#FFEDD5',
    reports: [
      { name: 'Stok Saat Ini', href: '/reports/inventory?type=current', description: 'Current inventory levels' },
      { name: 'Mutasi Stok', href: '/reports/inventory?type=movement', description: 'Stock in/out history' },
      { name: 'Stok Opname', href: '/reports/inventory?type=opname', description: 'Physical count' },
      { name: 'Nilai Persediaan', href: '/reports/inventory?type=valuation', description: 'Inventory value' },
      { name: 'Produk Terlaris', href: '/reports/inventory?type=topproducts', description: 'Best sellers' },
      { name: 'Stok Menipis', href: '/reports/inventory?type=lowstock', description: 'Below minimum' },
    ],
  },
  {
    title: 'LAPORAN HR & PAYROLL',
    icon: Users,
    color: '#2563EB',
    bgColor: '#DBEAFE',
    reports: [
      { name: 'Kehadiran', href: '/reports/hr?type=attendance', description: 'Employee attendance' },
      { name: 'Rekap Cuti', href: '/reports/hr?type=leave', description: 'Leave records' },
      { name: 'Summary Payroll', href: '/reports/hr?type=payroll', description: 'Salary summary' },
      { name: 'PPh 21', href: '/reports/hr?type=pph21', description: 'Tax withholding' },
      { name: 'BPJS', href: '/reports/hr?type=bpjs', description: 'Social security' },
    ],
  },
  {
    title: 'LAPORAN ASET',
    icon: Calendar,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    reports: [
      { name: 'Daftar Aset', href: '/reports/finance?type=assetlist', description: 'Asset register' },
      { name: 'Penyusutan', href: '/reports/finance?type=depreciation', description: 'Depreciation' },
      { name: 'Nilai Buku', href: '/reports/finance?type=bookvalue', description: 'Net asset values' },
    ],
  },
  {
    title: 'LAPORAN PAJAK',
    icon: Percent,
    color: '#EA580C',
    bgColor: '#FFEDD5',
    reports: [
      { name: 'Rekap PPN', href: '/reports/finance?type=vat', description: 'VAT collection' },
      { name: 'Export e-Faktur', href: '/reports/finance?type=einvoice', description: 'Digital invoices' },
      { name: 'SPT Tahunan', href: '/reports/finance?type=annualtax', description: 'Annual tax return' },
    ],
  },
];

export default function ReportsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const filteredCategories = REPORT_CATEGORIES.map(cat => ({
    ...cat,
    reports: cat.reports.filter(report =>
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.reports.length > 0 || !searchQuery);

  return (
    <AppShell {...REPORTS_CONFIG} navItems={REPORTS_NAV} activeHref="/reports">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Pusat Laporan</h1>
          <p className="text-gray-600 text-sm mt-1">Akses semua laporan bisnis Anda dengan mudah</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cari laporan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Report Categories Grid */}
        <div className="space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p>Tidak ada laporan yang sesuai dengan pencarian "{searchQuery}"</p>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.title} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: category.bgColor }}>
                    <Icon size={20} color={category.color} />
                    <h2 className="font-semibold text-sm" style={{ color: category.color }}>
                      {category.title}
                    </h2>
                    <span className="ml-auto text-xs text-gray-600">
                      {category.reports.length} laporan
                    </span>
                  </div>

                  {/* Reports Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.reports.map((report) => (
                      <a
                        key={report.href}
                        href={report.href}
                        className="group flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white"
                      >
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: category.bgColor }}
                        >
                          <FileText size={20} color={category.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 group-hover:text-blue-600">
                            {report.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">{report.description}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVOICE_CONFIG, INVOICE_NAV } from '../../../lib/nav-configs';
import { Clock, Download, AlertTriangle, Send } from 'lucide-react';

const C = INVOICE_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 'INV-0012', customer: 'PT. Maju Jaya', amount: 15000000, due_date: '2025-05-15', days_overdue: 41, status: 'overdue' },
  { id: 'INV-0018', customer: 'CV. Berkah Abadi', amount: 8500000, due_date: '2025-05-25', days_overdue: 31, status: 'overdue' },
  { id: 'INV-0023', customer: 'Toko Sejahtera', amount: 3200000, due_date: '2025-06-01', days_overdue: 24, status: 'overdue' },
  { id: 'INV-0027', customer: 'PT. Karya Mandiri', amount: 22000000, due_date: '2025-06-10', days_overdue: 15, status: 'overdue' },
  { id: 'INV-0031', customer: 'UD. Makmur', amount: 5800000, due_date: '2025-06-20', days_overdue: 5, status: 'overdue' },
];

export default function InvoiceAgingPage() {
  const { token } = useAuthStore();
  const router = useRouter();


  const totalOverdue = SAMPLE.reduce((s, i) => s + i.amount, 0);
  const critical = SAMPLE.filter(i => i.days_overdue > 30).reduce((s, i) => s + i.amount, 0);

  const getBucket = (days: number) => {
    if (days <= 15) return { label: '1-15 Hari', color: '#FF9800' };
    if (days <= 30) return { label: '16-30 Hari', color: '#FF5722' };
    if (days <= 60) return { label: '31-60 Hari', color: '#F44336' };
    return { label: '> 60 Hari', color: '#B71C1C' };
  };

  return (
    <AppShell {...INVOICE_CONFIG} navItems={INVOICE_NAV} activeHref="/invoice/aging">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Aging Invoice Report</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Invoice yang melewati jatuh tempo pembayaran</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
              <Send className="h-4 w-4" /> Kirim Reminder
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Overdue', value: fmt(totalOverdue), color: '#EA5455' },
            { label: 'Invoice Overdue', value: SAMPLE.length, color: '#FF9800' },
            { label: 'Kritis (>30hr)', value: fmt(critical), color: '#B71C1C' },
            { label: 'Rata-rata Hari', value: `${Math.round(SAMPLE.reduce((s, i) => s + i.days_overdue, 0) / SAMPLE.length)} hr`, color: '#1E1B4B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Daftar Invoice Jatuh Tempo</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['No. Invoice', 'Pelanggan', 'Jumlah', 'Jatuh Tempo', 'Hari Lewat', 'Bucket', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE.sort((a, b) => b.days_overdue - a.days_overdue).map(item => {
                  const bucket = getBucket(item.days_overdue);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-xs" style={{ color: C }}>{item.id}</td>
                      <td className="px-6 py-3 font-medium" style={{ color: '#1E1B4B' }}>
                        <div className="flex items-center gap-2">
                          {item.days_overdue > 30 && <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#B71C1C' }} />}
                          {item.customer}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-bold" style={{ color: '#1E1B4B' }}>{fmt(item.amount)}</td>
                      <td className="px-6 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.due_date).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-3">
                        <span className="font-bold" style={{ color: bucket.color }}>{item.days_overdue} hari</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${bucket.color}18`, color: bucket.color }}>{bucket.label}</span>
                      </td>
                      <td className="px-6 py-3">
                        <button className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${C}15`, color: C }}>
                          <Send className="h-3 w-3" /> Kirim Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

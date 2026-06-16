'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVOICE_CONFIG, INVOICE_NAV } from '../../../lib/nav-configs';
import { FileText, Clock, CheckCircle, XCircle, Search, Plus } from 'lucide-react';

const INVOICES = [
  { no: 'INV-2026-0892', customer: 'PT Maju Jaya',       due: '31 Mei 2026', amount: 'Rp 12.400.000', status: 'posted' },
  { no: 'INV-2026-0891', customer: 'CV Berkah Abadi',     due: '28 Mei 2026', amount: 'Rp 6.750.000',  status: 'overdue' },
  { no: 'INV-2026-0890', customer: 'Toko Sumber Rejeki',  due: '25 Mei 2026', amount: 'Rp 3.200.000',  status: 'paid' },
  { no: 'INV-2026-0889', customer: 'UD Karya Mandiri',    due: '20 Jun 2026', amount: 'Rp 9.850.000',  status: 'draft' },
  { no: 'INV-2026-0888', customer: 'PT Global Niaga',     due: '15 Jun 2026', amount: 'Rp 21.000.000', status: 'posted' },
  { no: 'INV-2026-0887', customer: 'CV Sentosa Jaya',     due: '10 Jun 2026', amount: 'Rp 4.500.000',  status: 'paid' },
];
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft:   { label: 'Draft',        color: '#9CA3AF', bg: 'rgba(165,163,174,.12)', icon: FileText },
  posted:  { label: 'Dikirim',      color: '#2196F3', bg: 'rgba(33,150,243,.1)',   icon: Clock },
  paid:    { label: 'Lunas',        color: '#4CAF50', bg: 'rgba(76,175,80,.1)',    icon: CheckCircle },
  overdue: { label: 'Jatuh Tempo',  color: '#EA5455', bg: 'rgba(234,84,85,.1)',    icon: XCircle },
};

export default function InvoiceListPage() {
  const { token } = useAuthStore();
  const router = useRouter();


  return (
    <AppShell {...INVOICE_CONFIG} navItems={INVOICE_NAV} activeHref="/invoice/list">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Daftar Invoice</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Semua tagihan pelanggan</p></div>
          <button onClick={() => router.push('/sales/invoices/new')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: INVOICE_CONFIG.appColor }}><Plus className="h-4 w-4" /> Invoice Baru</button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F5F2FB' }}>
              {['Semua', 'Draft', 'Dikirim', 'Lunas', 'Jatuh Tempo'].map(tab => (
                <button key={tab} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition" style={{ backgroundColor: tab === 'Semua' ? 'white' : 'transparent', color: tab === 'Semua' ? '#1E1B4B' : '#9CA3AF' }}>{tab}</button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="rounded-lg pl-8 pr-3 py-1.5 text-xs" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none', width: 180 }} placeholder="Cari invoice..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['No. Invoice', 'Pelanggan', 'Jatuh Tempo', 'Jumlah', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {INVOICES.map((inv, i) => {
                  const st = STATUS_MAP[inv.status];
                  return (
                    <tr key={inv.no} style={{ borderBottom: i < INVOICES.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: INVOICE_CONFIG.appColor }}>{inv.no}</td>
                      <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{inv.customer}</td>
                      <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{inv.due}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{inv.amount}</td>
                      <td className="px-6 py-3.5"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: st.color, backgroundColor: st.bg }}><st.icon className="h-3 w-3" />{st.label}</span></td>
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

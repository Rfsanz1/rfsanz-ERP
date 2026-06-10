'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { REPORTS_CONFIG, REPORTS_NAV } from '../../../lib/nav-configs';
import { FileText, Building2, TrendingDown, DollarSign } from 'lucide-react';

const DATA = [
  { bulan: 'Jan 2026', po: 28, nilai: 'Rp 142 Jt', supplier: 12, onTime: '96%' },
  { bulan: 'Feb 2026', po: 31, nilai: 'Rp 167 Jt', supplier: 14, onTime: '94%' },
  { bulan: 'Mar 2026', po: 29, nilai: 'Rp 155 Jt', supplier: 13, onTime: '97%' },
  { bulan: 'Apr 2026', po: 38, nilai: 'Rp 189 Jt', supplier: 15, onTime: '95%' },
  { bulan: 'Mei 2026', po: 42, nilai: 'Rp 198 Jt', supplier: 17, onTime: '98%' },
];

export default function ReportsPurchasingPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...REPORTS_CONFIG} navItems={REPORTS_NAV} activeHref="/reports/purchasing">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Pembelian</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>PO, penerimaan barang, dan analisis supplier</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total PO (YTD)',    value: '168',       icon: FileText,     color: '#5D4037', bg: 'rgba(93,64,55,.1)' },
            { label: 'Total Spend (YTD)', value: 'Rp 851 Jt', icon: TrendingDown, color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
            { label: 'Supplier Aktif',    value: '67',        icon: Building2,    color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
            { label: 'On-Time Delivery',  value: '96%',       icon: DollarSign,   color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-start justify-between">
                <div><p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p><p className="text-xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{s.value}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}><s.icon className="h-5 w-5" style={{ color: s.color }} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}><h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Rekap Pembelian per Bulan</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Bulan', 'Jumlah PO', 'Nilai Pembelian', 'Supplier', 'On-Time'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DATA.map((d, i) => (
                  <tr key={d.bulan} style={{ borderBottom: i < DATA.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{d.bulan}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.po}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#EA5455' }}>{d.nilai}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.supplier}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{d.onTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

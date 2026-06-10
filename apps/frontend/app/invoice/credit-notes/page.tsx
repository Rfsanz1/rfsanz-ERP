'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVOICE_CONFIG, INVOICE_NAV } from '../../../lib/nav-configs';
import { RotateCcw, Plus } from 'lucide-react';

const DATA = [
  { no: 'CN-2026-0012', invoice: 'INV-2026-0880', customer: 'CV Berkah Abadi',    amount: 'Rp 1.500.000', reason: 'Retur barang rusak',    date: '20 Mei 2026' },
  { no: 'CN-2026-0011', invoice: 'INV-2026-0872', customer: 'PT Maju Jaya',       amount: 'Rp 3.200.000', reason: 'Kesalahan penagihan',   date: '15 Mei 2026' },
  { no: 'CN-2026-0010', invoice: 'INV-2026-0865', customer: 'Toko Sumber Rejeki', amount: 'Rp 800.000',   reason: 'Diskon tambahan',       date: '10 Mei 2026' },
];

export default function CreditNotesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...INVOICE_CONFIG} navItems={INVOICE_NAV} activeHref="/invoice/credit-notes">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Kredit Nota</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Nota kredit untuk retur dan koreksi invoice</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: INVOICE_CONFIG.appColor }}><Plus className="h-4 w-4" /> Kredit Nota Baru</button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['No. CN', 'Invoice Ref.', 'Pelanggan', 'Jumlah', 'Alasan', 'Tanggal'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DATA.map((d, i) => (
                  <tr key={d.no} style={{ borderBottom: i < DATA.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: INVOICE_CONFIG.appColor }}>{d.no}</td>
                    <td className="px-6 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{d.invoice}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.customer}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#EA5455' }}>-{d.amount}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{d.reason}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{d.date}</td>
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

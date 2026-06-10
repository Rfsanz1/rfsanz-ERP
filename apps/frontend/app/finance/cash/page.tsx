'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';

const TRANSACTIONS = [
  { type: 'in',  ref: 'KAS-0124', desc: 'Penerimaan dari PT Maju Jaya',     amount: 'Rp 12.400.000', date: '24 Mei 2026' },
  { type: 'out', ref: 'KAS-0123', desc: 'Pembayaran listrik & air',          amount: 'Rp 1.200.000',  date: '24 Mei 2026' },
  { type: 'in',  ref: 'KAS-0122', desc: 'Penerimaan dari CV Berkah',         amount: 'Rp 6.750.000',  date: '23 Mei 2026' },
  { type: 'out', ref: 'KAS-0121', desc: 'Pembelian ATK',                     amount: 'Rp 340.000',    date: '23 Mei 2026' },
  { type: 'out', ref: 'KAS-0120', desc: 'Transportasi pengiriman',           amount: 'Rp 850.000',    date: '22 Mei 2026' },
];

export default function FinanceCashPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/cash">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Kas Keluar / Masuk</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Transaksi kas harian</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: ACCOUNTING_CONFIG.appColor }}><Plus className="h-4 w-4" /> Transaksi Baru</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Saldo Kas Saat Ini</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#1E1B4B' }}>Rp 84.760.000</p>
          </div>
          <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Net Kas Bulan Ini</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#4CAF50' }}>+Rp 16.760.000</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Tipe', 'Ref', 'Deskripsi', 'Jumlah', 'Tanggal'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TRANSACTIONS.map((t, i) => (
                  <tr key={t.ref} style={{ borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: t.type === 'in' ? 'rgba(76,175,80,.12)' : 'rgba(234,84,85,.12)' }}>
                        {t.type === 'in' ? <ArrowDownRight className="h-3.5 w-3.5" style={{ color: '#4CAF50' }} /> : <ArrowUpRight className="h-3.5 w-3.5" style={{ color: '#EA5455' }} />}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{t.ref}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{t.desc}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: t.type === 'in' ? '#4CAF50' : '#EA5455' }}>{t.type === 'in' ? '+' : '-'}{t.amount}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{t.date}</td>
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

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Receipt, Plus } from 'lucide-react';

const EXPENSES = [
  { ref: 'EXP-0045', desc: 'Listrik & Air – Mei 2026',        amount: 'Rp 1.200.000', category: 'Utilitas',    date: '24 Mei 2026', paid: true },
  { ref: 'EXP-0044', desc: 'Gaji Karyawan – Mei 2026',        amount: 'Rp 48.500.000', category: 'Gaji',       date: '25 Mei 2026', paid: false },
  { ref: 'EXP-0043', desc: 'Bensin & Transportasi',           amount: 'Rp 850.000',   category: 'Transportasi', date: '23 Mei 2026', paid: true },
  { ref: 'EXP-0042', desc: 'Sewa Gudang – Mei 2026',          amount: 'Rp 8.000.000', category: 'Sewa',        date: '1 Mei 2026',  paid: true },
  { ref: 'EXP-0041', desc: 'ATK & Perlengkapan Kantor',       amount: 'Rp 340.000',   category: 'Operasional', date: '20 Mei 2026', paid: true },
];

export default function FinanceExpensesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  if (!token) return null;
  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/expenses">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pengeluaran</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola biaya operasional dan pengeluaran</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: ACCOUNTING_CONFIG.appColor }}><Plus className="h-4 w-4" /> Catat Pengeluaran</button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Ref', 'Deskripsi', 'Kategori', 'Jumlah', 'Tanggal', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {EXPENSES.map((e, i) => (
                  <tr key={e.ref} style={{ borderBottom: i < EXPENSES.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={ev => { ev.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: ACCOUNTING_CONFIG.appColor }}>{e.ref}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{e.desc}</td>
                    <td className="px-6 py-3.5"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(56,142,60,.1)', color: '#388E3C' }}>{e.category}</span></td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#EA5455' }}>{e.amount}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{e.date}</td>
                    <td className="px-6 py-3.5"><span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: e.paid ? 'rgba(76,175,80,.1)' : 'rgba(255,152,0,.1)', color: e.paid ? '#4CAF50' : '#FF9800' }}>{e.paid ? 'Dibayar' : 'Belum Bayar'}</span></td>
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

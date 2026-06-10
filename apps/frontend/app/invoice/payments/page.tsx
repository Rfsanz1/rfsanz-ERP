'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVOICE_CONFIG, INVOICE_NAV } from '../../../lib/nav-configs';
import { CreditCard, Plus, CheckCircle } from 'lucide-react';

const PAYMENTS = [
  { ref: 'PAY-0124', invoice: 'INV-2026-0890', customer: 'Toko Sumber Rejeki', method: 'Transfer Bank', amount: 'Rp 3.200.000', date: '24 Mei 2026' },
  { ref: 'PAY-0123', invoice: 'INV-2026-0885', customer: 'CV Berkah Abadi',    method: 'Transfer Bank', amount: 'Rp 6.750.000', date: '22 Mei 2026' },
  { ref: 'PAY-0122', invoice: 'INV-2026-0882', customer: 'PT Global Niaga',    method: 'Cek Bilyet',   amount: 'Rp 21.000.000', date: '20 Mei 2026' },
  { ref: 'PAY-0121', invoice: 'INV-2026-0879', customer: 'UD Karya Mandiri',   method: 'Tunai',        amount: 'Rp 4.500.000', date: '18 Mei 2026' },
];

export default function InvoicePaymentsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...INVOICE_CONFIG} navItems={INVOICE_NAV} activeHref="/invoice/payments">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pembayaran</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Riwayat pembayaran invoice</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: INVOICE_CONFIG.appColor }}><Plus className="h-4 w-4" /> Rekam Bayar</button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Ref', 'Invoice', 'Pelanggan', 'Metode', 'Jumlah', 'Tanggal'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {PAYMENTS.map((p, i) => (
                  <tr key={p.ref} style={{ borderBottom: i < PAYMENTS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: INVOICE_CONFIG.appColor }}>{p.ref}</td>
                    <td className="px-6 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{p.invoice}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{p.customer}</td>
                    <td className="px-6 py-3.5 text-xs px-2.5 py-1"><span className="rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(33,150,243,.1)', color: '#2196F3' }}>{p.method}</span></td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{p.amount}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{p.date}</td>
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

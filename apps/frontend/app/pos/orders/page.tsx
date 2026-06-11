'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { POS_CONFIG, POS_NAV } from '../../../lib/nav-configs';
import { ShoppingCart, Search } from 'lucide-react';

const ORDERS = [
  { no: 'POS-0087', kasir: 'Kasir 1 – Andi', customer: 'Walk-in',        method: 'Tunai',    total: 'Rp 135.000', time: '14:32' },
  { no: 'POS-0086', kasir: 'Kasir 2 – Budi', customer: 'Budi Santoso',  method: 'Transfer', total: 'Rp 480.000', time: '14:15' },
  { no: 'POS-0085', kasir: 'Kasir 1 – Andi', customer: 'Walk-in',        method: 'Tunai',    total: 'Rp 200.000', time: '13:58' },
  { no: 'POS-0084', kasir: 'Kasir 3 – Citra',customer: 'Sari Dewi',     method: 'QRIS',     total: 'Rp 275.000', time: '13:45' },
  { no: 'POS-0083', kasir: 'Kasir 2 – Budi', customer: 'Walk-in',        method: 'Tunai',    total: 'Rp 95.000',  time: '13:30' },
];

const METHOD_STYLE: Record<string, { color: string; bg: string }> = {
  'Tunai':    { color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  'Transfer': { color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  'QRIS':     { color: '#9C27B0', bg: 'rgba(156,39,176,.1)' },
};

export default function PosOrdersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  if (!token) return null;
  return (
    <AppShell {...POS_CONFIG} navItems={POS_NAV} activeHref="/pos/orders">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Order POS Hari Ini</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>87 transaksi · Rp 14.2 Jt total</p></div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari order..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['No. Order', 'Kasir', 'Pelanggan', 'Metode', 'Total', 'Waktu'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {ORDERS.map((o, i) => {
                  const ms = METHOD_STYLE[o.method] ?? { color: '#9CA3AF', bg: 'rgba(165,163,174,.12)' };
                  return (
                    <tr key={o.no} style={{ borderBottom: i < ORDERS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: POS_CONFIG.appColor }}>{o.no}</td>
                      <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{o.kasir}</td>
                      <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{o.customer}</td>
                      <td className="px-6 py-3.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: ms.color, backgroundColor: ms.bg }}>{o.method}</span></td>
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{o.total}</td>
                      <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{o.time}</td>
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

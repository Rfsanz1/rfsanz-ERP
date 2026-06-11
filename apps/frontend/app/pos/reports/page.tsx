'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { POS_CONFIG, POS_NAV } from '../../../lib/nav-configs';
import { ShoppingCart, DollarSign, TrendingUp, Users } from 'lucide-react';

const DAILY = [
  { date: '24 Mei', tx: 87,  revenue: 'Rp 14.2 Jt', avg: 'Rp 163 Rb' },
  { date: '23 Mei', tx: 156, revenue: 'Rp 25.3 Jt', avg: 'Rp 162 Rb' },
  { date: '22 Mei', tx: 142, revenue: 'Rp 22.8 Jt', avg: 'Rp 161 Rb' },
  { date: '21 Mei', tx: 168, revenue: 'Rp 27.4 Jt', avg: 'Rp 163 Rb' },
  { date: '20 Mei', tx: 134, revenue: 'Rp 21.6 Jt', avg: 'Rp 161 Rb' },
];

export default function PosReportsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  if (!token) return null;
  return (
    <AppShell {...POS_CONFIG} navItems={POS_NAV} activeHref="/pos/reports">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan POS</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Analitik transaksi kasir per hari</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tx Minggu Ini',   value: '687',       icon: ShoppingCart, color: '#E64A19', bg: 'rgba(230,74,25,.1)' },
            { label: 'Revenue Minggu Ini', value: 'Rp 111 Jt', icon: DollarSign,  color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
            { label: 'Avg / Hari',      value: 'Rp 15.8 Jt', icon: TrendingUp,  color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
            { label: 'Pelanggan Baru',  value: '34',        icon: Users,        color: '#8E24AA', bg: 'rgba(142,36,170,.1)' },
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
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}><h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Rekap Harian</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Tanggal', 'Transaksi', 'Revenue', 'Avg / Transaksi'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DAILY.map((d, i) => (
                  <tr key={d.date} style={{ borderBottom: i < DAILY.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{d.date}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.tx}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{d.revenue}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{d.avg}</td>
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

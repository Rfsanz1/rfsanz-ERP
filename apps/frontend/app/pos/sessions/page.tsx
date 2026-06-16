'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { POS_CONFIG, POS_NAV } from '../../../lib/nav-configs';
import { Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';

const SESSIONS = [
  { date: '24 Mei 2026', kasir: 'Kasir 1 – Andi',  open: '08:00', close: '–',     tx: 34, total: 'Rp 5.240.000', status: 'open' },
  { date: '24 Mei 2026', kasir: 'Kasir 2 – Budi',  open: '08:05', close: '–',     tx: 28, total: 'Rp 4.180.000', status: 'open' },
  { date: '24 Mei 2026', kasir: 'Kasir 3 – Citra', open: '09:30', close: '–',     tx: 25, total: 'Rp 4.780.000', status: 'open' },
  { date: '23 Mei 2026', kasir: 'Kasir 1 – Andi',  open: '08:00', close: '17:05', tx: 82, total: 'Rp 13.420.000', status: 'closed' },
  { date: '23 Mei 2026', kasir: 'Kasir 2 – Budi',  open: '08:10', close: '17:00', tx: 74, total: 'Rp 11.850.000', status: 'closed' },
];

export default function PosSessionsPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  return (
    <AppShell {...POS_CONFIG} navItems={POS_NAV} activeHref="/pos/sessions">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Sesi Kasir</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Riwayat buka-tutup kasir</p></div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Tanggal', 'Kasir', 'Jam Buka', 'Jam Tutup', 'Transaksi', 'Total', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {SESSIONS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: i < SESSIONS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{s.date}</td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{s.kasir}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{s.open}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{s.close}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{s.tx}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{s.total}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ color: s.status === 'open' ? '#4CAF50' : '#9CA3AF', backgroundColor: s.status === 'open' ? 'rgba(76,175,80,.1)' : 'rgba(165,163,174,.12)' }}>
                        {s.status === 'open' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {s.status === 'open' ? 'Buka' : 'Ditutup'}
                      </span>
                    </td>
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

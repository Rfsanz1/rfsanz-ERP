'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { REPORTS_CONFIG, REPORTS_NAV } from '../../../lib/nav-configs';
import { Package, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TOP_MOVES = [
  { name: 'Semen Portland 40kg', masuk: 400, keluar: 320, net: '+80', value: 'Rp 16 Jt' },
  { name: 'Cat Tembok Dulux 5L', masuk: 100, keluar: 112, net: '-12', value: 'Rp 6.16 Jt' },
  { name: 'Pipa PVC 4 inch',     masuk: 200, keluar: 155, net: '+45', value: 'Rp 3.88 Jt' },
  { name: 'Besi Beton 10mm',     masuk: 500, keluar: 430, net: '+70', value: 'Rp 21.5 Jt' },
  { name: 'Keramik 60x60',       masuk: 300, keluar: 268, net: '+32', value: 'Rp 10.72 Jt' },
];

export default function ReportsInventoryPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  return (
    <AppShell {...REPORTS_CONFIG} navItems={REPORTS_NAV} activeHref="/reports/inventory">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Inventaris</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Stok masuk/keluar, nilai inventory, perputaran</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Produk',    value: '1.248',     icon: Package,       color: '#F57C00', bg: 'rgba(245,124,0,.1)' },
            { label: 'Stok Menipis',    value: '34',        icon: AlertTriangle, color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
            { label: 'Total Masuk',     value: '1.500',     icon: ArrowDownRight,color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
            { label: 'Total Keluar',    value: '1.285',     icon: ArrowUpRight,  color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
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
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}><h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Produk dengan Pergerakan Terbanyak (Mei)</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Produk', 'Masuk', 'Keluar', 'Net', 'Nilai Pergerakan'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {TOP_MOVES.map((m, i) => (
                  <tr key={m.name} style={{ borderBottom: i < TOP_MOVES.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{m.name}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{m.masuk}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#EA5455' }}>{m.keluar}</td>
                    <td className="px-6 py-3.5 text-sm font-bold" style={{ color: m.net.startsWith('+') ? '#4CAF50' : '#EA5455' }}>{m.net}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{m.value}</td>
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

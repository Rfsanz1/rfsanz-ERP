'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { ArrowUpRight, Plus, Clock, CheckCircle, Truck } from 'lucide-react';

const DELIVERIES = [
  { no: 'DO-0142', so: 'SO-0128', customer: 'PT Maju Jaya',      driver: 'Andi Santoso',  status: 'ready',     date: '25 Mei 2026', items: 3 },
  { no: 'DO-0141', so: 'SO-0127', customer: 'CV Berkah Abadi',   driver: 'Budi Prasetyo', status: 'delivering', date: '24 Mei 2026', items: 5 },
  { no: 'DO-0140', so: 'SO-0126', customer: 'Toko Sumber',       driver: 'Citra Wulan',   status: 'done',      date: '23 Mei 2026', items: 2 },
  { no: 'DO-0139', so: 'SO-0125', customer: 'UD Karya Mandiri',  driver: 'Deni Hendra',   status: 'done',      date: '22 Mei 2026', items: 8 },
];
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ready:      { label: 'Siap Kirim',   color: '#FF9800', bg: 'rgba(255,152,0,.1)',  icon: Clock },
  delivering: { label: 'Dalam Perjalanan', color: '#2196F3', bg: 'rgba(33,150,243,.1)', icon: Truck },
  done:       { label: 'Terkirim',     color: '#4CAF50', bg: 'rgba(76,175,80,.1)',  icon: CheckCircle },
};

export default function InventoryDeliveriesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  if (!token) return null;
  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/deliveries">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pengiriman Keluar</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Delivery order ke pelanggan</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: INVENTORY_CONFIG.appColor }}><Plus className="h-4 w-4" /> DO Baru</button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['No. DO', 'Ref SO', 'Pelanggan', 'Driver', 'Item', 'Tanggal', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {DELIVERIES.map((d, i) => {
                  const st = STATUS_MAP[d.status];
                  return (
                    <tr key={d.no} style={{ borderBottom: i < DELIVERIES.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: INVENTORY_CONFIG.appColor }}>{d.no}</td>
                      <td className="px-6 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{d.so}</td>
                      <td className="px-6 py-3.5 text-sm" style={{ color: '#1E1B4B' }}>{d.customer}</td>
                      <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{d.driver}</td>
                      <td className="px-6 py-3.5 text-sm text-center" style={{ color: '#1E1B4B' }}>{d.items}</td>
                      <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{d.date}</td>
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

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { MARKETPLACE_CONFIG, MARKETPLACE_NAV } from '../../../lib/nav-configs';
import { Package, AlertTriangle, Check, RefreshCw } from 'lucide-react';

const C = MARKETPLACE_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID');

const SAMPLE = [
  { id: 1, sku: 'PRD-001', product: 'Produk A - 1L', platform: 'Shopee', order_id: 'SHP-123456', reserved_qty: 5, erp_stock: 45, status: 'sufficient', reserved_until: '2025-06-27' },
  { id: 2, sku: 'PRD-002', product: 'Produk B - 5L', platform: 'Tokopedia', order_id: 'TKP-789012', reserved_qty: 8, erp_stock: 20, status: 'sufficient', reserved_until: '2025-06-26' },
  { id: 3, sku: 'PRD-001', product: 'Produk A - 1L', platform: 'TikTok', order_id: 'TTK-345678', reserved_qty: 15, erp_stock: 45, status: 'warning', reserved_until: '2025-06-28' },
  { id: 4, sku: 'PRD-003', product: 'Produk C - 20L', platform: 'Shopee', order_id: 'SHP-901234', reserved_qty: 10, erp_stock: 8, status: 'insufficient', reserved_until: '2025-06-26' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  sufficient:   { label: 'Cukup',       color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  warning:      { label: 'Mepet',       color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  insufficient: { label: 'Kurang',      color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

const PLATFORM_COLORS: Record<string, string> = { Shopee: '#EE4D2D', Tokopedia: '#03AC0E', TikTok: '#000000' };

export default function StockReservationPage() {
  const { token } = useAuthStore();
  const router = useRouter();


  const insufficient = SAMPLE.filter(i => i.status === 'insufficient');
  const totalReserved = SAMPLE.reduce((s, i) => s + i.reserved_qty, 0);

  return (
    <AppShell {...MARKETPLACE_CONFIG} navItems={MARKETPLACE_NAV} activeHref="/marketplace/stock-reservation">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Reservasi Stok Marketplace</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Pantau dan kelola stok yang direservasi untuk pesanan marketplace</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <RefreshCw className="h-4 w-4" /> Sync Reservasi
          </button>
        </div>

        {insufficient.length > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(234,84,85,.06)', border: '1.5px solid rgba(234,84,85,.2)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#EA5455' }} />
            <p className="text-sm" style={{ color: '#C62828' }}>
              <span className="font-bold">{insufficient.length} pesanan</span> tidak dapat dipenuhi karena stok tidak mencukupi. Segera tambah stok.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Pesanan', value: SAMPLE.length, color: C },
            { label: 'Total Qty Direservasi', value: fmt(totalReserved), color: '#2196F3' },
            { label: 'Stok Cukup', value: SAMPLE.filter(i => i.status === 'sufficient').length, color: '#4CAF50' },
            { label: 'Stok Kurang', value: insufficient.length, color: '#EA5455' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['SKU', 'Produk', 'Platform', 'Order ID', 'Qty Direservasi', 'Stok ERP', 'Status', 'Berlaku Hingga', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE.map(item => {
                  const s = STATUS_MAP[item.status];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: C }}>{item.sku}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.product}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: PLATFORM_COLORS[item.platform] ?? '#666' }}>{item.platform}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: '#6B7280' }}>{item.order_id}</td>
                      <td className="px-4 py-3 font-bold text-center" style={{ color: '#1E1B4B' }}>{item.reserved_qty}</td>
                      <td className="px-4 py-3 font-bold text-center" style={{ color: item.erp_stock < item.reserved_qty ? '#EA5455' : '#4CAF50' }}>{item.erp_stock}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.reserved_until).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        {item.status === 'insufficient' && (
                          <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#C62828' }}>
                            Tambah Stok
                          </button>
                        )}
                        {item.status !== 'insufficient' && (
                          <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#388E3C' }}>
                            Proses
                          </button>
                        )}
                      </td>
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

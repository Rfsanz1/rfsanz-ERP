'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Package, AlertTriangle, TrendingUp, RefreshCw, ShoppingCart, CheckCircle } from 'lucide-react';

const INVENTORY_PREDICTIONS = [
  { product: 'Semen Portland 50kg', currentStock: 5, minStock: 50, daysUntilStockout: 2, predictedDemand: 320, reorderQty: 500, urgency: 'critical' },
  { product: 'Cat Tembok Putih 25kg', currentStock: 8, minStock: 20, daysUntilStockout: 4, predictedDemand: 95, reorderQty: 200, urgency: 'high' },
  { product: 'Paku Beton 5cm', currentStock: 2, minStock: 10, daysUntilStockout: 1, predictedDemand: 48, reorderQty: 100, urgency: 'critical' },
  { product: 'Kawat Bendrat', currentStock: 3, minStock: 15, daysUntilStockout: 3, predictedDemand: 28, reorderQty: 80, urgency: 'high' },
  { product: 'Besi Beton 10mm', currentStock: 45, minStock: 30, daysUntilStockout: 12, predictedDemand: 142, reorderQty: 200, urgency: 'medium' },
  { product: 'Pasir Cor (m³)', currentStock: 82, minStock: 50, daysUntilStockout: 18, predictedDemand: 138, reorderQty: 150, urgency: 'low' },
  { product: 'Bata Merah (ikat)', currentStock: 120, minStock: 60, daysUntilStockout: 24, predictedDemand: 156, reorderQty: 200, urgency: 'low' },
];

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Kritis', color: '#EF4444', bg: 'rgba(239,68,68,.1)' },
  high: { label: 'Tinggi', color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
  medium: { label: 'Sedang', color: '#3B82F6', bg: 'rgba(59,130,246,.1)' },
  low: { label: 'Aman', color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
};

export default function AiInventoryPredictionPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  const filtered = filter === 'all' ? INVENTORY_PREDICTIONS : INVENTORY_PREDICTIONS.filter(p => p.urgency === filter);
  const criticalCount = INVENTORY_PREDICTIONS.filter(p => p.urgency === 'critical').length;
  const highCount = INVENTORY_PREDICTIONS.filter(p => p.urgency === 'high').length;

  return (
    <OdooLayout title="AI Inventory Prediction" subtitle="Prediksi kebutuhan stok & reorder otomatis">
      <div className="space-y-6">
        {/* Alert Banner */}
        {criticalCount > 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,.08)', border: '1.5px solid rgba(239,68,68,.3)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#EF4444' }} />
            <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>
              {criticalCount} produk dalam kondisi KRITIS — stok akan habis dalam 1-2 hari. Segera lakukan reorder!
            </p>
            <a href="/purchasing/rfq" className="ml-auto px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: '#EF4444' }}>
              Buat RFQ Sekarang
            </a>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => {
            const count = INVENTORY_PREDICTIONS.filter(p => p.urgency === key).length;
            return (
              <div key={key} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <p className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Status {cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'critical', label: 'Kritis' },
            { key: 'high', label: 'Tinggi' },
            { key: 'medium', label: 'Sedang' },
            { key: 'low', label: 'Aman' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition"
              style={{
                backgroundColor: filter === f.key ? '#5B52D1' : '#FFFFFF',
                color: filter === f.key ? '#FFFFFF' : '#6B7280',
                border: `1.5px solid ${filter === f.key ? '#5B52D1' : '#EDE9FE'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE9FE' }}>
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
              <Package className="h-4 w-4" style={{ color: '#5B52D1' }} /> Prediksi Stok & Reorder
            </h3>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
              <RefreshCw className="h-3.5 w-3.5" /> Perbarui Prediksi
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5F3FF' }}>
                  {['Produk', 'Stok Saat Ini', 'Stok Min', 'Habis Dalam', 'Demand Prediksi', 'Qty Reorder', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const cfg = URGENCY_CONFIG[p.urgency];
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#1E1B4B' }}>{p.product}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-xs" style={{ color: p.urgency === 'critical' ? '#EF4444' : '#1E1B4B' }}>{p.currentStock}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{p.minStock}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-xs" style={{ color: p.daysUntilStockout <= 3 ? '#EF4444' : '#1E1B4B' }}>
                          {p.daysUntilStockout} hari
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{p.predictedDemand.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#5B52D1' }}>{p.reorderQty.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a href="/purchasing/rfq" className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
                          <ShoppingCart className="h-3 w-3" /> RFQ
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

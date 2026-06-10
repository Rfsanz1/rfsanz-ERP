'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { TrendingUp, TrendingDown, Calendar, BarChart2, Package, RefreshCw, AlertCircle } from 'lucide-react';

const FORECAST_DATA = [
  { month: 'Jun 2026', revenue: 318, growth: 12.2, orders: 612, confidence: 92 },
  { month: 'Jul 2026', revenue: 342, growth: 7.5, orders: 658, confidence: 87 },
  { month: 'Agu 2026', revenue: 298, growth: -12.9, orders: 571, confidence: 81 },
  { month: 'Sep 2026', revenue: 365, growth: 22.5, orders: 702, confidence: 76 },
  { month: 'Okt 2026', revenue: 410, growth: 12.3, orders: 789, confidence: 71 },
  { month: 'Nov 2026', revenue: 445, growth: 8.5, orders: 856, confidence: 65 },
];

const PRODUCT_FORECAST = [
  { name: 'Semen Portland 50kg', currentDemand: 840, forecastDemand: 950, change: 13.1 },
  { name: 'Bata Merah', currentDemand: 520, forecastDemand: 480, change: -7.7 },
  { name: 'Pasir Cor', currentDemand: 380, forecastDemand: 420, change: 10.5 },
  { name: 'Cat Tembok 25kg', currentDemand: 290, forecastDemand: 310, change: 6.9 },
  { name: 'Besi Beton 10mm', currentDemand: 210, forecastDemand: 265, change: 26.2 },
];

export default function AiForecastPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  const maxRev = Math.max(...FORECAST_DATA.map(d => d.revenue));

  return (
    <OdooLayout title="AI Forecast" subtitle="Prediksi penjualan & demand planning berbasis AI">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Model Info */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: 'white' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Revenue Forecast — 6 Bulan ke Depan</h2>
            <p className="text-sm opacity-80">Model: SARIMA + Machine Learning · Data Training: 24 bulan · Confidence Interval: 95%</p>
          </div>
          <button
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-sm font-semibold hover:bg-white/30 transition"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Update Model
          </button>
        </div>

        {/* Forecast Chart */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold text-sm mb-5" style={{ color: '#1E1B4B' }}>Proyeksi Revenue (Juta Rupiah)</h3>
          <div className="flex items-end gap-3 h-48 mb-4">
            {FORECAST_DATA.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold" style={{ color: d.growth >= 0 ? '#22C55E' : '#EF4444' }}>
                  {d.growth >= 0 ? '+' : ''}{d.growth}%
                </span>
                <div className="w-full flex flex-col items-center justify-end" style={{ height: '140px' }}>
                  <div
                    className="w-full rounded-t-xl transition-all relative group cursor-default"
                    style={{
                      height: `${(d.revenue / maxRev) * 140}px`,
                      background: `linear-gradient(180deg, ${d.growth >= 0 ? '#3B82F6' : '#EF4444'}, ${d.growth >= 0 ? '#1D4ED8' : '#B91C1C'})`,
                      opacity: 0.7 + i * 0.05,
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                      Rp {d.revenue} jt · {d.orders} order · {d.confidence}% confidence
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold" style={{ color: '#1E1B4B' }}>Rp {d.revenue}jt</p>
                  <p className="text-[9px]" style={{ color: '#9CA3AF' }}>{d.month}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #EDE9FE' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
              <AlertCircle className="h-3.5 w-3.5" />
              Confidence level menurun seiring waktu proyeksi. Data aktual dapat berbeda.
            </div>
            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#3B82F6' }}>
              Export Forecast
            </button>
          </div>
        </div>

        {/* Forecast Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
            <h3 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Detail Proyeksi Bulanan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5F3FF' }}>
                  {['Bulan', 'Revenue Proyeksi', 'Growth', 'Est. Order', 'Confidence', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORECAST_DATA.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                    <td className="px-5 py-3 font-semibold text-xs" style={{ color: '#1E1B4B' }}>{d.month}</td>
                    <td className="px-5 py-3 font-bold text-xs" style={{ color: '#1E1B4B' }}>Rp {d.revenue} jt</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: d.growth >= 0 ? '#22C55E' : '#EF4444' }}>
                        {d.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {d.growth >= 0 ? '+' : ''}{d.growth}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#1E1B4B' }}>{d.orders.toLocaleString()} order</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-20 rounded-full h-1.5" style={{ backgroundColor: '#EDE9FE' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${d.confidence}%`, backgroundColor: d.confidence > 80 ? '#22C55E' : d.confidence > 70 ? '#F59E0B' : '#EF4444' }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{d.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
                        backgroundColor: d.confidence > 80 ? 'rgba(34,197,94,.1)' : d.confidence > 70 ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)',
                        color: d.confidence > 80 ? '#22C55E' : d.confidence > 70 ? '#F59E0B' : '#EF4444',
                      }}>
                        {d.confidence > 80 ? 'Tinggi' : d.confidence > 70 ? 'Sedang' : 'Rendah'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Demand Forecast */}
        <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
              <Package className="h-4 w-4" style={{ color: '#5B52D1' }} /> Demand Forecast per Produk (Bulan Depan)
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {PRODUCT_FORECAST.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{p.name}</p>
                    <span className="flex items-center gap-1 text-xs font-semibold ml-2" style={{ color: p.change >= 0 ? '#22C55E' : '#EF4444' }}>
                      {p.change >= 0 ? '+' : ''}{p.change}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-full h-2" style={{ backgroundColor: '#EDE9FE' }}>
                      <div className="h-2 rounded-full" style={{ width: `${(p.forecastDemand / 1000) * 100}%`, backgroundColor: p.change >= 0 ? '#3B82F6' : '#EF4444' }} />
                    </div>
                    <span className="text-[11px] w-24 text-right" style={{ color: '#9CA3AF' }}>
                      {p.currentDemand} → <strong style={{ color: '#1E1B4B' }}>{p.forecastDemand}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

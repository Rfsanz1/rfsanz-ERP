'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { BarChart2, TrendingUp, TrendingDown, Users, Target, Star } from 'lucide-react';

const SALESMAN_PREDICTION = [
  { name: 'Budi Santoso', currentRevenue: 68, predictedRevenue: 78, target: 80, probability: 87 },
  { name: 'Siti Rahayu', currentRevenue: 54, predictedRevenue: 62, target: 70, probability: 71 },
  { name: 'Ahmad Fauzi', currentRevenue: 47, predictedRevenue: 55, target: 65, probability: 65 },
  { name: 'Dewi Kartika', currentRevenue: 38, predictedRevenue: 41, target: 50, probability: 58 },
  { name: 'Rudi Setiawan', currentRevenue: 31, predictedRevenue: 36, target: 45, probability: 52 },
];

const PRODUCT_PREDICTION = [
  { name: 'Semen Portland 50kg', lastMonth: 840, predicted: 950, category: 'Material Bangunan', growth: 13.1 },
  { name: 'Besi Beton 10mm', lastMonth: 210, predicted: 265, category: 'Material Bangunan', growth: 26.2 },
  { name: 'Pasir Cor (m³)', lastMonth: 380, predicted: 420, category: 'Material Bangunan', growth: 10.5 },
  { name: 'Cat Tembok 25kg', lastMonth: 290, predicted: 310, category: 'Finishing', growth: 6.9 },
  { name: 'Bata Merah (ikat)', lastMonth: 520, predicted: 480, category: 'Material Bangunan', growth: -7.7 },
];

export default function AiSalesPredictionPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI Sales Prediction" subtitle="Prediksi penjualan per produk & per salesman">
      <div className="space-y-6">
        {/* Banner */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #EC4899, #BE185D)', color: 'white' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <BarChart2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Sales Prediction Engine</h2>
              <p className="text-sm opacity-80">Prediksi berbasis regresi ML + seasonal pattern · Data 18 bulan terakhir</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label: 'Revenue Diprediksi (Jun)', value: 'Rp 318 jt' },
              { label: 'Target Bulanan', value: 'Rp 300 jt' },
              { label: 'Probabilitas Target', value: '94%' },
            ].map((s, i) => (
              <div key={i} className="text-center bg-white/15 rounded-xl py-3">
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Salesman Prediction */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <Users className="h-4 w-4" style={{ color: '#5B52D1' }} /> Prediksi per Salesman (Jun 2026)
              </h3>
            </div>
            <div className="p-5 space-y-5">
              {SALESMAN_PREDICTION.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #EC4899, #BE185D)' }}>
                        {s.name.charAt(0)}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: '#EC4899' }}>Rp {s.predictedRevenue}jt</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                        backgroundColor: s.probability >= 75 ? 'rgba(34,197,94,.1)' : 'rgba(245,158,11,.1)',
                        color: s.probability >= 75 ? '#22C55E' : '#F59E0B',
                      }}>
                        {s.probability}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 rounded-full" style={{ backgroundColor: '#EDE9FE' }}>
                    <div className="absolute h-2 rounded-full" style={{ width: `${(s.predictedRevenue / s.target) * 100}%`, backgroundColor: '#EC4899' }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 rounded" style={{ left: '100%', backgroundColor: '#1E1B4B' }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Saat ini: Rp {s.currentRevenue}jt</span>
                    <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Target: Rp {s.target}jt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Prediction */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <Star className="h-4 w-4 text-amber-400" /> Prediksi per Produk (Jun 2026)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F5F3FF' }}>
                    {['Produk', 'Lalu', 'Prediksi', 'Growth'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PRODUCT_PREDICTION.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50" style={{ borderTop: '1px solid #F0EDF8' }}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{p.name}</p>
                        <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{p.category}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{p.lastMonth.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: '#1E1B4B' }}>{p.predicted.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: p.growth >= 0 ? '#22C55E' : '#EF4444' }}>
                          {p.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {p.growth >= 0 ? '+' : ''}{p.growth}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

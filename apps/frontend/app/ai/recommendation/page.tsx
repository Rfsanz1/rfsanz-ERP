'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Lightbulb, TrendingUp, Package, Users, DollarSign, Star, ArrowUpRight, CheckCircle } from 'lucide-react';

const RECOMMENDATIONS = [
  {
    category: 'Penjualan', icon: TrendingUp, color: '#3B82F6', priority: 'Tinggi',
    title: 'Naikkan target penjualan Semen Portland 20%',
    reason: 'Margin 34%, permintaan meningkat 26% bulan depan berdasarkan forecast AI',
    impact: '+Rp 18 jt revenue potensial',
    action: 'Lihat Forecast',
    href: '/ai/forecast',
  },
  {
    category: 'Inventory', icon: Package, color: '#14B8A6', priority: 'Tinggi',
    title: 'Reorder Semen Portland & Cat Tembok segera',
    reason: 'Stok di bawah minimum, demand diprediksi naik 13% bulan depan',
    impact: 'Hindari stockout ~Rp 84 jt kerugian penjualan',
    action: 'Buat Purchase Request',
    href: '/purchasing/rfq',
  },
  {
    category: 'CRM', icon: Users, color: '#8B5CF6', priority: 'Sedang',
    title: 'Follow-up 12 customer B2B yang tidak aktif',
    reason: 'Customer segmen B2B tidak order >30 hari dengan rata-rata order Rp 8,2 jt',
    impact: '+Rp 98 jt revenue potensial jika 50% konversi',
    action: 'Buka CRM Pipeline',
    href: '/crm/pipeline',
  },
  {
    category: 'Keuangan', icon: DollarSign, color: '#22C55E', priority: 'Tinggi',
    title: 'Kirim reminder 7 invoice jatuh tempo',
    reason: 'Total outstanding Rp 24,8 jt, rata-rata keterlambatan 12 hari',
    impact: 'Tingkatkan cash flow Rp 24,8 jt',
    action: 'Buka Invoice',
    href: '/invoice/aging',
  },
  {
    category: 'SDM', icon: Star, color: '#F59E0B', priority: 'Rendah',
    title: 'Berikan bonus Q2 untuk top 3 salesman',
    reason: 'Budi, Siti, Ahmad melampaui target 115%, 108%, 102%',
    impact: 'Tingkatkan retensi dan motivasi tim sales',
    action: 'Lihat Payroll',
    href: '/hr/payrolls/components',
  },
];

const PRIORITY_COLOR: Record<string, string> = { Tinggi: '#EF4444', Sedang: '#F59E0B', Rendah: '#22C55E' };

export default function AiRecommendationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  const active = RECOMMENDATIONS.filter(r => !dismissed.includes(r.title));

  return (
    <OdooLayout title="AI Rekomendasi" subtitle="Saran strategis berbasis analisis data bisnis Anda">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Lightbulb className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI Business Recommendations</h2>
            <p className="text-sm opacity-80">{active.length} rekomendasi aktif · Dianalisis dari seluruh modul ERP · Diperbarui setiap jam</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          {active.map((r, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: r.color + '15' }}>
                    <r.icon className="h-5 w-5" style={{ color: r.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: r.color + '15', color: r.color }}>{r.category}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: PRIORITY_COLOR[r.priority] + '15', color: PRIORITY_COLOR[r.priority] }}>
                        {r.priority}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1" style={{ color: '#1E1B4B' }}>{r.title}</h3>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{r.reason}</p>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl w-fit text-xs font-semibold" style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid rgba(34,197,94,.2)' }}>
                      <TrendingUp className="h-3 w-3" /> {r.impact}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <a
                    href={r.href}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ backgroundColor: r.color + '15', color: r.color }}
                  >
                    {r.action} <ArrowUpRight className="h-3 w-3" />
                  </a>
                  <button
                    onClick={() => setDismissed(d => [...d, r.title])}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition text-xs"
                    title="Abaikan rekomendasi ini"
                    style={{ color: '#9CA3AF' }}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {dismissed.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => setDismissed([])}
              className="text-xs font-semibold"
              style={{ color: '#5B52D1' }}
            >
              Tampilkan {dismissed.length} rekomendasi yang diabaikan
            </button>
          </div>
        )}

        {active.length === 0 && (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#F5F3FF' }}>
            <CheckCircle className="h-12 w-12 mx-auto mb-3" style={{ color: '#22C55E' }} />
            <p className="font-bold" style={{ color: '#1E1B4B' }}>Semua rekomendasi sudah ditandai!</p>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>AI akan menghasilkan rekomendasi baru secara otomatis.</p>
          </div>
        )}
      </div>
    </OdooLayout>
  );
}

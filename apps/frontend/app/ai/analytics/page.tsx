'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { BarChart2, TrendingUp, Brain, ArrowUpRight } from 'lucide-react';

const INSIGHTS = [
  { title: 'Revenue Diprediksi Naik 12%', desc: 'Berdasarkan tren 5 bulan terakhir, Juni 2026 diproyeksikan mencapai Rp 318 Jt.', icon: TrendingUp, color: '#22C55E', action: 'Lihat Forecast', href: '/ai/forecast' },
  { title: 'Segmen Pelanggan Terbesar: B2B', desc: '72% revenue berasal dari pelanggan B2B. Fokus retensi pelanggan korporat sangat disarankan.', icon: BarChart2, color: '#3B82F6', action: 'Lihat CRM', href: '/crm/pipeline' },
  { title: 'Waktu Order Puncak: 09:00-11:00', desc: 'Alokasikan lebih banyak staf sales pada jam tersebut untuk memaksimalkan konversi.', icon: BarChart2, color: '#F59E0B', action: 'Lihat Laporan', href: '/reports/sales' },
  { title: 'Produk dengan ROI Tertinggi: Semen', desc: 'Margin keuntungan semen portland 34%. Pertimbangkan menaikkan target penjualan 20%.', icon: TrendingUp, color: '#8B5CF6', action: 'Lihat Produk', href: '/inventory/products' },
];

const PERFORMANCE = [
  { label: 'Revenue Jan-Mei', value: 'Rp 1,21 M', change: '+18.4%', up: true },
  { label: 'Total Order', value: '3,821', change: '+15.2%', up: true },
  { label: 'Avg Order Value', value: 'Rp 316 rb', change: '+2.8%', up: true },
  { label: 'Customer Retention', value: '78.4%', change: '-1.2%', up: false },
  { label: 'Gross Margin', value: '29.7%', change: '+2.5pp', up: true },
  { label: 'Inventory Turnover', value: '6.1x', change: '-0.7x', up: false },
];

export default function AiAnalyticsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI Business Analytics" subtitle="Analitik prediktif dan rekomendasi bisnis berbasis AI">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #7B1FA2, #4A148C)', color: 'white' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Business Insights</h2>
              <p className="text-sm opacity-80">Analitik prediktif berbasis machine learning · Data Jan-Mei 2026</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PERFORMANCE.map((p, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>{p.label}</p>
              <p className="text-xl font-bold" style={{ color: '#1E1B4B' }}>{p.value}</p>
              <span className="text-xs font-semibold flex items-center gap-0.5 mt-1" style={{ color: p.up ? '#22C55E' : '#EF4444' }}>
                {p.up ? <TrendingUp className="h-3 w-3" /> : null}
                {p.change} vs tahun lalu
              </span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-bold mb-4" style={{ color: '#1E1B4B' }}>AI-Generated Insights</h3>
          <div className="space-y-4">
            {INSIGHTS.map((ins, i) => (
              <div key={i} className="rounded-2xl p-5 flex items-start gap-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: ins.color + '15' }}>
                  <ins.icon className="h-5 w-5" style={{ color: ins.color }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-1" style={{ color: '#1E1B4B' }}>{ins.title}</h4>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{ins.desc}</p>
                </div>
                <a href={ins.href} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0" style={{ backgroundColor: ins.color + '15', color: ins.color }}>
                  {ins.action} <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

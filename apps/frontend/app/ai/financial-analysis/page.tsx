'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { DollarSign, TrendingUp, TrendingDown, BarChart2, PieChart, AlertTriangle, ArrowUpRight } from 'lucide-react';

const FINANCIAL_METRICS = [
  { label: 'Gross Profit Margin', value: '29.7%', prev: '27.2%', up: true, desc: 'Margin kotor meningkat 2.5pp vs bulan lalu' },
  { label: 'Net Profit Margin', value: '14.7%', prev: '13.1%', up: true, desc: 'Laba bersih meningkat setelah efisiensi biaya' },
  { label: 'Current Ratio', value: '2.34', prev: '2.18', up: true, desc: 'Likuiditas jangka pendek sangat sehat' },
  { label: 'Debt to Equity', value: '0.42', prev: '0.48', up: true, desc: 'Leverage menurun, risiko finansial lebih rendah' },
  { label: 'Receivable Turnover', value: '8.2x', prev: '7.9x', up: true, desc: 'Piutang ditagih lebih cepat dari bulan lalu' },
  { label: 'Inventory Turnover', value: '6.1x', prev: '6.8x', up: false, desc: 'Perputaran inventory sedikit melambat' },
];

const AI_INSIGHTS = [
  { type: 'opportunity', msg: 'Gross margin dapat ditingkatkan 3-4% dengan optimasi HPP pada kategori Material Bangunan.', color: '#22C55E' },
  { type: 'risk', msg: 'Piutang PT Sinar Jaya (Rp 18,5 jt) sudah >60 hari — risiko bad debt meningkat.', color: '#EF4444' },
  { type: 'opportunity', msg: 'Budget opex bulan ini underspend 8% — alokasikan ke marketing Q3.', color: '#3B82F6' },
  { type: 'warning', msg: 'Cash conversion cycle naik dari 32 ke 38 hari — perlu percepatan penagihan invoice.', color: '#F59E0B' },
];

const EXPENSE_BREAKDOWN = [
  { category: 'HPP / COGS', pct: 70.3, amount: 'Rp 178,4 jt', color: '#5B52D1' },
  { category: 'Biaya Karyawan', pct: 11.2, amount: 'Rp 28,4 jt', color: '#3B82F6' },
  { category: 'Biaya Operasional', pct: 5.8, amount: 'Rp 14,7 jt', color: '#F59E0B' },
  { category: 'Biaya Marketing', pct: 2.4, amount: 'Rp 6,1 jt', color: '#22C55E' },
  { category: 'Laba Bersih', pct: 10.3, amount: 'Rp 26,1 jt', color: '#8B5CF6' },
];

export default function AiFinancialAnalysisPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI Financial Analysis" subtitle="Analisis keuangan mendalam berbasis AI">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #EF4444, #B91C1C)', color: 'white' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Financial Analysis — Mei 2026</h2>
              <p className="text-sm opacity-80">Analisis komprehensif laporan keuangan · Diperbarui real-time</p>
            </div>
            <a href="/finance/reports" className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-sm font-semibold hover:bg-white/30 transition">
              Laporan Keuangan <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FINANCIAL_METRICS.map((m, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>{m.label}</p>
                <span className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: m.up ? '#22C55E' : '#EF4444' }}>
                  {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {m.prev}
                </span>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: '#1E1B4B' }}>{m.value}</p>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Insights */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>AI Financial Insights</h3>
            </div>
            <div className="p-5 space-y-3">
              {AI_INSIGHTS.map((ins, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: ins.color + '08', border: `1px solid ${ins.color}30` }}>
                  <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ins.color }} />
                  <p className="text-xs" style={{ color: '#1E1B4B' }}>{ins.msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Breakdown Revenue Mei 2026</h3>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Total: Rp 253.800.000</p>
            </div>
            <div className="p-5 space-y-3">
              {EXPENSE_BREAKDOWN.map((e, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: e.color }} />
                      <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{e.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold" style={{ color: '#1E1B4B' }}>{e.pct}%</span>
                      <span className="text-[10px] ml-2" style={{ color: '#9CA3AF' }}>{e.amount}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#EDE9FE' }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${e.pct}%`, backgroundColor: e.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

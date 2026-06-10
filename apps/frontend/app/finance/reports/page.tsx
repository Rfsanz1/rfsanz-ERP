'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { api } from '../../../lib/api';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

const MONTHLY = [
  { bulan: 'Jan 2026', pendapatan: 'Rp 280 Jt', pengeluaran: 'Rp 190 Jt', laba: 'Rp 90 Jt',  margin: '32.1%' },
  { bulan: 'Feb 2026', pendapatan: 'Rp 310 Jt', pengeluaran: 'Rp 205 Jt', laba: 'Rp 105 Jt', margin: '33.9%' },
  { bulan: 'Mar 2026', pendapatan: 'Rp 295 Jt', pengeluaran: 'Rp 198 Jt', laba: 'Rp 97 Jt',  margin: '32.9%' },
  { bulan: 'Apr 2026', pendapatan: 'Rp 330 Jt', pengeluaran: 'Rp 212 Jt', laba: 'Rp 118 Jt', margin: '35.8%' },
  { bulan: 'Mei 2026', pendapatan: 'Rp 348 Jt', pengeluaran: 'Rp 198 Jt', laba: 'Rp 150 Jt', margin: '43.1%' },
];

export default function FinanceReportsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/dashboard');
      return;
    }

    const fetchSummary = async () => {
      try {
        const { data } = await api.get('/finance/reports/executive-summary', {
          params: {
            dateFrom: '2026-01-01',
            dateTo: new Date().toISOString().split('T')[0],
          },
        });

        setSummary(data);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router, token]);

  if (!token) return null;

  const revenue = summary?.incomeStatement?.revenues?.total ?? 'Rp 1.56 M';
  const expense = summary?.incomeStatement?.operationalExpenses?.total ?? 'Rp 1.00 M';
  const netIncome = summary?.netIncome ?? 'Rp 560 Jt';
  const cashFlow = summary?.cashFlow?.netCashFlow ?? 'Rp 120 Jt';

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/reports">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Keuangan</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Ringkasan laba-rugi dan arus kas</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pendapatan YTD', value: typeof revenue === 'string' ? revenue : `Rp ${revenue.toLocaleString('id-ID')}`, icon: TrendingUp, color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
            { label: 'Pengeluaran YTD', value: typeof expense === 'string' ? expense : `Rp ${expense.toLocaleString('id-ID')}`, icon: TrendingDown, color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
            { label: 'Laba Bersih YTD', value: typeof netIncome === 'string' ? netIncome : `Rp ${netIncome.toLocaleString('id-ID')}`, icon: DollarSign, color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: '#1E1B4B' }}>{loading ? 'Memuat...' : s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Laba-Rugi per Bulan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                  {['Bulan', 'Pendapatan', 'Pengeluaran', 'Laba Bersih', 'Margin'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHLY.map((m, i) => (
                  <tr
                    key={m.bulan}
                    style={{ borderBottom: i < MONTHLY.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FDFCFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{m.bulan}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#4CAF50' }}>{m.pendapatan}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#EA5455' }}>{m.pengeluaran}</td>
                    <td className="px-6 py-3.5 text-sm font-bold" style={{ color: '#2196F3' }}>{m.laba}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#4CAF50' }}>{m.margin}</span>
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

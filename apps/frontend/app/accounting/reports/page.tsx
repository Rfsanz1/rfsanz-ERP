'use client';

export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, RefreshCw, Download, CheckCircle } from 'lucide-react';

type Tab = 'balance-sheet' | 'income-statement' | 'cash-flow';

const TABS: { id: Tab; label: string }[] = [
  { id: 'balance-sheet', label: 'Neraca' },
  { id: 'income-statement', label: 'Laba & Rugi' },
  { id: 'cash-flow', label: 'Arus Kas' },
];

function ReportRow({ label, amount, bold, indent, color, separator }: any) {
  if (separator) return <tr className="border-t border-slate-700"><td colSpan={2} className="py-1"></td></tr>;
  return (
    <tr className={bold ? 'border-t border-slate-700' : ''}>
      <td className={`py-2 text-sm ${bold ? 'font-bold text-white' : 'text-slate-300'}`} style={{ paddingLeft: indent ? 24 + indent * 16 : 24 }}>
        {label}
      </td>
      <td className={`py-2 text-right pr-6 text-sm font-mono ${bold ? 'font-bold text-white' : color || 'text-slate-300'}`}>
        {amount !== undefined ? amount.toLocaleString('id-ID', { minimumFractionDigits: 0 }) : ''}
      </td>
    </tr>
  );
}

function FinancialReportsPageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'balance-sheet');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setData(null);
    try {
      let r;
      if (tab === 'balance-sheet') r = await api.get('/finance/reports/balance-sheet', { params: { date } });
      else if (tab === 'income-statement') r = await api.get('/finance/reports/income-statement', { params: { dateFrom, dateTo } });
      else r = await api.get('/finance/reports/cash-flow', { params: { dateFrom, dateTo } });
      setData(r.data);
    } catch { } finally { setLoading(false); }
  }, [tab, date, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const renderBalanceSheet = () => {
    if (!data) return null;
    return (
      <table className="w-full">
        <tbody>
          <ReportRow label="ASET" bold />
          {data.assets.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
          <ReportRow label="Total Aset" amount={data.assets.total} bold color="text-blue-300" />
          <ReportRow separator />
          <ReportRow label="LIABILITAS" bold />
          {data.liabilities.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
          <ReportRow label="Total Liabilitas" amount={data.liabilities.total} bold color="text-red-300" />
          <ReportRow separator />
          <ReportRow label="EKUITAS" bold />
          {data.equity.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
          <ReportRow label="Total Ekuitas" amount={data.equity.total} bold color="text-purple-300" />
          <ReportRow separator />
          <ReportRow label="Total Liabilitas + Ekuitas" amount={data.totalLiabilitiesAndEquity} bold color="text-emerald-300" />
          {data.isBalanced && (
            <tr><td colSpan={2} className="px-6 py-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle className="h-3.5 w-3.5" /> Neraca Seimbang</span>
            </td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderIncomeStatement = () => {
    if (!data) return null;
    return (
      <table className="w-full">
        <tbody>
          <ReportRow label="PENDAPATAN" bold />
          {data.revenues.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} color="text-emerald-300" />)}
          <ReportRow label="Total Pendapatan" amount={data.revenues.total} bold color="text-emerald-400" />
          <ReportRow separator />
          <ReportRow label="HARGA POKOK PENJUALAN (HPP)" bold />
          {data.hpp.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
          <ReportRow label="Total HPP" amount={data.hpp.total} bold color="text-orange-300" />
          <ReportRow separator />
          <ReportRow label="LABA KOTOR" amount={data.grossProfit} bold color={data.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <ReportRow separator />
          <ReportRow label="BEBAN OPERASIONAL" bold />
          {data.operationalExpenses.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
          <ReportRow label="Total Beban Operasional" amount={data.operationalExpenses.total} bold color="text-orange-300" />
          {data.otherExpenses.items.length > 0 && <>
            <ReportRow separator />
            <ReportRow label="BEBAN LAIN-LAIN" bold />
            {data.otherExpenses.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
            <ReportRow label="Total Beban Lain-lain" amount={data.otherExpenses.total} bold color="text-orange-300" />
          </>}
          <ReportRow separator />
          <ReportRow label="LABA / RUGI BERSIH" amount={data.netIncome} bold color={data.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        </tbody>
      </table>
    );
  };

  const renderCashFlow = () => {
    if (!data) return null;
    const { operating, investing, financing, netCashFlow } = data;
    return (
      <table className="w-full">
        <tbody>
          <ReportRow label="AKTIVITAS OPERASI" bold />
          <ReportRow label="Laba Bersih" amount={operating.netIncome} indent={1} />
          <ReportRow label="Perubahan Piutang Dagang" amount={operating.adjustments.perubahanPiutang} indent={1} />
          <ReportRow label="Perubahan Persediaan" amount={operating.adjustments.perubahanPersediaan} indent={1} />
          <ReportRow label="Perubahan Hutang Dagang" amount={operating.adjustments.perubahanHutangDagang} indent={1} />
          <ReportRow label="Kas Bersih dari Aktivitas Operasi" amount={operating.total} bold color={operating.total >= 0 ? 'text-emerald-300' : 'text-red-300'} />
          <ReportRow separator />
          <ReportRow label="AKTIVITAS INVESTASI" bold />
          <ReportRow label="Perubahan Aset Tetap" amount={investing.perubahanAsetTetap} indent={1} />
          <ReportRow label="Kas Bersih dari Aktivitas Investasi" amount={investing.total} bold color={investing.total >= 0 ? 'text-emerald-300' : 'text-red-300'} />
          <ReportRow separator />
          <ReportRow label="AKTIVITAS PENDANAAN" bold />
          <ReportRow label="Perubahan Hutang Bank" amount={financing.perubahanHutangBank} indent={1} />
          <ReportRow label="Kas Bersih dari Aktivitas Pendanaan" amount={financing.total} bold color={financing.total >= 0 ? 'text-emerald-300' : 'text-red-300'} />
          <ReportRow separator />
          <ReportRow label="KENAIKAN (PENURUNAN) BERSIH KAS" amount={netCashFlow} bold color={netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        </tbody>
      </table>
    );
  };

  const periodLabel = tab === 'balance-sheet'
    ? `Per ${new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'long' })}`
    : `Periode ${new Date(dateFrom + 'T00:00:00').toLocaleDateString('id-ID')} — ${new Date(dateTo + 'T00:00:00').toLocaleDateString('id-ID')}`;

  return (
    <ModernLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-400" /> Laporan Keuangan
            </h1>
            <p className="text-slate-400 mt-0.5 text-sm">Neraca, Laba Rugi, dan Arus Kas</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm font-medium text-white transition">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Date filters */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
          <div className="flex items-end gap-4 flex-wrap">
            {tab === 'balance-sheet' ? (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Per Tanggal</label>
                <input type="date" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            ) : <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Dari Tanggal</label>
                <input type="date" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Sampai Tanggal</label>
                <input type="date" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </>}
            {/* Quick period shortcuts */}
            <div className="flex gap-2">
              {[
                { label: 'Jan–Des', from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` },
                { label: 'Q1', from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-03-31` },
                { label: 'Q2', from: `${new Date().getFullYear()}-04-01`, to: `${new Date().getFullYear()}-06-30` },
                { label: 'Bulan Ini', from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
              ].map(p => (
                <button key={p.label} onClick={() => { setDateFrom(p.from); setDateTo(p.to); }} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white border border-slate-700 transition">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20">
            <h2 className="font-bold text-white text-base">
              {tab === 'balance-sheet' ? 'NERACA' : tab === 'income-statement' ? 'LAPORAN LABA & RUGI' : 'LAPORAN ARUS KAS'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">PT Gentong Mas · {periodLabel}</p>
          </div>
          {loading ? (
            <div className="py-20 text-center text-slate-500">Memuat laporan...</div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-500">Pilih periode untuk menampilkan laporan</div>
          ) : (
            <div className="py-2">
              {tab === 'balance-sheet' && renderBalanceSheet()}
              {tab === 'income-statement' && renderIncomeStatement()}
              {tab === 'cash-flow' && renderCashFlow()}
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}

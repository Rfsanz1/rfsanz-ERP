'use client';
import { useEffect, useState, useCallback } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Scale, RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Aset', LIABILITY: 'Liabilitas', EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan', EXPENSE: 'Beban',
};
const TYPE_COLORS: Record<string, string> = {
  ASSET: 'text-blue-400', LIABILITY: 'text-red-400', EQUITY: 'text-purple-400',
  REVENUE: 'text-emerald-400', EXPENSE: 'text-orange-400',
};

export default function TrialBalancePage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/finance/trial-balance', { params: { dateFrom, dateTo } });
      setData(r.data);
    } catch { } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => n === 0 ? '—' : n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Kode', 'Nama Akun', 'Tipe', 'Total Debit', 'Total Kredit', 'Saldo Debit', 'Saldo Kredit'],
      ...filteredAccounts.map((a: any) => [a.code, a.name, TYPE_LABELS[a.type] || a.type,
        a.totalDebit, a.totalKredit, a.debitBalance, a.creditBalance]),
      ['', 'TOTAL', '', data.totals.totalDebit, data.totals.totalKredit, data.totals.totalDebitBalance, data.totals.totalCreditBalance],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `neraca-saldo-${dateFrom}-${dateTo}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const filteredAccounts = data?.accounts?.filter((a: any) => !typeFilter || a.type === typeFilter) ?? [];
  const isBalanced = data && Math.abs(data.totals.totalDebit - data.totals.totalKredit) < 1;

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Scale className="h-6 w-6 text-emerald-400" /> Neraca Saldo (Trial Balance)
            </h1>
            <p className="text-slate-400 mt-0.5 text-sm">Verifikasi keseimbangan debit dan kredit semua akun</p>
          </div>
          {data && <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm font-medium text-white transition"><Download className="h-4 w-4" /> Export CSV</button>}
        </div>

        {/* Filter */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Dari Tanggal</label>
              <input type="date" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Sampai Tanggal</label>
              <input type="date" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Filter Tipe</label>
              <select className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Semua Tipe</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white transition">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Balance indicator */}
        {data && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${isBalanced ? 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400' : 'bg-red-900/20 border-red-800/30 text-red-400'}`}>
            {isBalanced ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {isBalanced
              ? `Neraca saldo seimbang — Total Debit = Total Kredit = ${data.totals.totalDebit.toLocaleString('id-ID')}`
              : `Neraca tidak seimbang — Selisih: ${Math.abs(data.totals.totalDebit - data.totals.totalKredit).toLocaleString('id-ID')}`
            }
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500">Memuat...</div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-500">Pilih periode untuk melihat neraca saldo</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase bg-slate-800/20">
                  <th className="text-left px-4 py-3">Kode</th>
                  <th className="text-left px-4 py-3">Nama Akun</th>
                  <th className="text-left px-4 py-3">Tipe</th>
                  <th className="text-right px-4 py-3">Total Debit</th>
                  <th className="text-right px-4 py-3">Total Kredit</th>
                  <th className="text-right px-4 py-3 bg-blue-900/10">Saldo Debit</th>
                  <th className="text-right px-4 py-3 bg-violet-900/10">Saldo Kredit</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredAccounts.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-500">Tidak ada data untuk periode ini</td></tr>
                  ) : filteredAccounts.map((a: any) => (
                    <tr key={a.accountId} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{a.code}</td>
                      <td className="px-4 py-2.5 text-white">{a.name}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs font-medium ${TYPE_COLORS[a.type] || 'text-slate-400'}`}>{TYPE_LABELS[a.type] || a.type}</span></td>
                      <td className="px-4 py-2.5 text-right text-slate-300">{fmt(a.totalDebit)}</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">{fmt(a.totalKredit)}</td>
                      <td className="px-4 py-2.5 text-right text-blue-300 bg-blue-900/5">{fmt(a.debitBalance)}</td>
                      <td className="px-4 py-2.5 text-right text-violet-300 bg-violet-900/5">{fmt(a.creditBalance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-800/50 font-bold text-sm">
                    <td colSpan={3} className="px-4 py-3 text-slate-400">TOTAL ({filteredAccounts.length} akun)</td>
                    <td className="px-4 py-3 text-right text-white">{data.totals.totalDebit.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right text-white">{data.totals.totalKredit.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right text-blue-300 bg-blue-900/10">{data.totals.totalDebitBalance.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right text-violet-300 bg-violet-900/10">{data.totals.totalCreditBalance.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}

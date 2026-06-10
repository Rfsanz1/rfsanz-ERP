'use client';
import { useEffect, useState, useCallback } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Database, Search, RefreshCw, Download } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Aset', LIABILITY: 'Liabilitas', EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan', EXPENSE: 'Beban',
};

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [accsLoading, setAccsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/finance/accounts', { params: { isActive: 'true' } })
      .then(r => setAccounts(r.data))
      .finally(() => setAccsLoading(false));
  }, []);

  const loadLedger = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const r = await api.get(`/finance/ledger/${selectedAccount}`, { params: { dateFrom, dateTo } });
      setLedger(r.data);
    } catch { setLedger(null); } finally { setLoading(false); }
  }, [selectedAccount, dateFrom, dateTo]);

  useEffect(() => { if (selectedAccount) loadLedger(); }, [selectedAccount, dateFrom, dateTo]);

  const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });
  const fmtBalance = (n: number) => {
    if (n === 0) return '0';
    return (n > 0 ? '' : '-') + Math.abs(n).toLocaleString('id-ID');
  };

  const filteredAccounts = accounts.filter(a =>
    !search || a.code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    if (!ledger) return;
    const rows = [
      ['Tanggal', 'Nomor Jurnal', 'Deskripsi', 'Debit', 'Kredit', 'Saldo'],
      [`Saldo Awal`, '', '', '', '', fmtBalance(ledger.openingBalance)],
      ...ledger.lines.map((l: any) => [
        new Date(l.date).toLocaleDateString('id-ID'),
        l.nomor, l.deskripsi || '', fmt(l.debit), fmt(l.kredit), fmtBalance(l.balance),
      ]),
      [`Saldo Akhir`, '', '', fmt(ledger.totalDebit), fmt(ledger.totalKredit), fmtBalance(ledger.closingBalance)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `buku-besar-${ledger.account.code}-${dateFrom}-${dateTo}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const acc = accounts.find(a => a.id === selectedAccount);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-400" /> Buku Besar (General Ledger)
            </h1>
            <p className="text-slate-400 mt-0.5 text-sm">Lihat riwayat mutasi dan saldo per akun</p>
          </div>
          {ledger && <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm font-medium text-white transition"><Download className="h-4 w-4" /> Export CSV</button>}
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Pilih Akun</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-2" placeholder="Cari akun..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} size={5}>
                <option value="">— Pilih akun —</option>
                {filteredAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name} ({TYPE_LABELS[a.type] || a.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Dari Tanggal</label>
              <input type="date" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Sampai Tanggal</label>
              <input type="date" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Ledger */}
        {!selectedAccount ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 py-20 text-center text-slate-500">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Pilih akun untuk melihat buku besar</p>
          </div>
        ) : loading ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 py-20 text-center text-slate-500">Memuat...</div>
        ) : ledger ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            {/* Account header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/30">
              <div>
                <p className="text-lg font-bold text-white">{ledger.account.code} — {ledger.account.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{TYPE_LABELS[ledger.account.type]} · Saldo Normal: {acc?.normalBalance}</p>
              </div>
              <button onClick={loadLedger} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"><RefreshCw className="h-4 w-4" /></button>
            </div>

            {/* Opening balance */}
            <div className="px-6 py-3 bg-blue-900/10 border-b border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-400">Saldo Awal ({dateFrom ? new Date(dateFrom + 'T00:00:00').toLocaleDateString('id-ID') : 'Awal'})</span>
              <span className="font-semibold text-blue-300">{fmtBalance(ledger.openingBalance)}</span>
            </div>

            {/* Transactions */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase bg-slate-800/20">
                  <th className="text-left px-4 py-3">Tanggal</th>
                  <th className="text-left px-4 py-3">Nomor Jurnal</th>
                  <th className="text-left px-4 py-3">Deskripsi</th>
                  <th className="text-right px-4 py-3">Debit</th>
                  <th className="text-right px-4 py-3">Kredit</th>
                  <th className="text-right px-4 py-3">Saldo</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {ledger.lines.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-500">Tidak ada transaksi dalam periode ini</td></tr>
                  ) : ledger.lines.map((l: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-2.5 text-slate-400 text-xs">{new Date(l.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{l.nomor}</td>
                      <td className="px-4 py-2.5 text-slate-300">{l.deskripsi || '—'}</td>
                      <td className="px-4 py-2.5 text-right text-blue-300">{l.debit > 0 ? fmt(l.debit) : '—'}</td>
                      <td className="px-4 py-2.5 text-right text-violet-300">{l.kredit > 0 ? fmt(l.kredit) : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-white">{fmtBalance(l.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700 bg-slate-800/40 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-slate-400 text-sm">Total Mutasi</td>
                    <td className="px-4 py-3 text-right text-blue-300">{fmt(ledger.totalDebit)}</td>
                    <td className="px-4 py-3 text-right text-violet-300">{fmt(ledger.totalKredit)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 text-base">{fmtBalance(ledger.closingBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </ModernLayout>
  );
}

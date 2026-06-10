'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Landmark, RefreshCw } from 'lucide-react';

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [a, t] = await Promise.all([
        api.get('/finance/bank-accounts'),
        api.get('/finance/bank-transactions', { params: { limit: 20 } }),
      ]);
      setAccounts(a.data ?? []);
      setTransactions(t.data.data ?? []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Landmark className="h-6 w-6 text-cyan-400" /> Bank & Kas</h1><p className="text-slate-400 mt-1">Rekening bank dan transaksi kas</p></div>
          <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
        </div>
        {loading ? <div className="py-12 text-center text-slate-500">Memuat...</div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accounts.length === 0 ? <div className="col-span-3 text-center py-8 text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">Belum ada rekening bank</div>
              : accounts.map((a, i) => (
                <div key={i} className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
                  <p className="text-xs text-slate-500 uppercase">{a.bankName || 'Bank'}</p>
                  <p className="font-semibold text-white mt-1">{a.accountName || a.name}</p>
                  <p className="text-slate-400 text-sm">{a.accountNumber || '-'}</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-3">{Number(a.balance||0).toLocaleString('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800">
              <div className="p-4 border-b border-slate-800"><h2 className="font-semibold text-white">Transaksi Bank Terbaru</h2></div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3">Tanggal</th><th className="text-left px-4 py-3">Keterangan</th><th className="text-right px-4 py-3">Jumlah</th><th className="text-center px-4 py-3">Tipe</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada transaksi</td></tr>
                  : transactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-400">{t.date ? new Date(t.date).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-4 py-3 text-white">{t.description || '-'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${t.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>{Number(t.amount||0).toLocaleString('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 })}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${t.type === 'credit' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>{t.type || '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </>
        )}
      </div>
    </ModernLayout>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { DollarSign, Plus, Search, RefreshCw } from 'lucide-react';

export default function JournalEntriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/finance/journal-entries', { params: { search, page, limit: 20 } }),
        api.get('/finance/stats'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setStats(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, page]);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><DollarSign className="h-6 w-6 text-cyan-400" /> Jurnal Akuntansi</h1><p className="text-slate-400 mt-1">Kelola jurnal entri dan transaksi keuangan</p></div>
          <button className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition"><Plus className="h-4 w-4" /> Buat Jurnal</button>
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4"><p className="text-xs text-slate-500">Total Jurnal</p><p className="text-3xl font-bold text-white mt-1">{stats.totalJurnals}</p></div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4"><p className="text-xs text-slate-500">Saldo Bank</p><p className="text-xl font-bold text-cyan-400 mt-1">{Number(stats.totalBankBalance||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}</p></div>
            <div className="rounded-2xl bg-emerald-900/20 border border-emerald-800/40 p-4"><p className="text-xs text-emerald-500">Cash In</p><p className="text-xl font-bold text-emerald-400 mt-1">{Number(stats.cashIn||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}</p></div>
            <div className="rounded-2xl bg-red-900/20 border border-red-800/40 p-4"><p className="text-xs text-red-500">Cash Out</p><p className="text-xl font-bold text-red-400 mt-1">{Number(stats.cashOut||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}</p></div>
          </div>
        )}
        <div className="rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 p-4 border-b border-slate-800">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="Cari nomor jurnal..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3">No Jurnal</th><th className="text-left px-4 py-3">Tanggal</th><th className="text-left px-4 py-3">Keterangan</th><th className="text-left px-4 py-3">Tipe</th><th className="text-right px-4 py-3">Total</th><th className="text-center px-4 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={6} className="py-12 text-center text-slate-500">Memuat...</td></tr>
              : data.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-slate-500">Belum ada jurnal</td></tr>
              : data.map(j => (
                <tr key={j.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{j.noJurnal}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(j.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-white">{j.keterangan||'-'}</td>
                  <td className="px-4 py-3 text-slate-400">{j.type}</td>
                  <td className="px-4 py-3 text-right text-white font-medium">{Number(j.total||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}</td>
                  <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${j.status==='posted'?'bg-emerald-900/50 text-emerald-400':'bg-slate-800 text-slate-400'}`}>{j.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-sm text-slate-500">
            <span>Total: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40">←</button>
              <span className="px-3 py-1 text-white">Hal {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={data.length<20} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40">→</button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { ArrowLeftRight, Search, RefreshCw } from 'lucide-react';

export default function StockMovementsPage() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/stock-movements', { params: { search, page, limit: 20 } });
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, page]);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><ArrowLeftRight className="h-6 w-6 text-blue-400" /> Mutasi Stok</h1><p className="text-slate-400 mt-1">Riwayat pergerakan stok produk</p></div>
        <div className="rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 p-4 border-b border-slate-800">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="Cari produk..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3">Produk</th><th className="text-left px-4 py-3">Tipe</th><th className="text-right px-4 py-3">Qty</th><th className="text-left px-4 py-3">Referensi</th><th className="text-left px-4 py-3">Tanggal</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Memuat...</td></tr>
              : data.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Belum ada mutasi stok</td></tr>
              : data.map((m, i) => (
                <tr key={i} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-white">{m.product?.name || m.productId || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${m.type === 'in' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>{m.type || '-'}</span></td>
                  <td className={`px-4 py-3 text-right font-medium ${m.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>{m.type === 'in' ? '+' : '-'}{m.quantity || 0}</td>
                  <td className="px-4 py-3 text-slate-400">{m.reference || '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </ModernLayout>
  );
}

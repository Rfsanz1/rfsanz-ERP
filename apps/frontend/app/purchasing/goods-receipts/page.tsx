'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { PackageCheck, Plus, Search, RefreshCw } from 'lucide-react';

export default function GoodsReceiptsPage() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/purchasing/goods-receipts', { params: { search, page, limit: 20 } });
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, page]);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><PackageCheck className="h-6 w-6 text-orange-400" /> Penerimaan Barang</h1><p className="text-slate-400 mt-1">Kelola penerimaan barang dari supplier</p></div>
          <button className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-medium text-white transition"><Plus className="h-4 w-4" /> Buat Penerimaan</button>
        </div>
        <div className="rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 p-4 border-b border-slate-800">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="Cari penerimaan..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3">No. Penerimaan</th><th className="text-left px-4 py-3">PO Ref</th><th className="text-left px-4 py-3">Supplier</th><th className="text-center px-4 py-3">Status</th><th className="text-left px-4 py-3">Tanggal</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Memuat...</td></tr>
              : data.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Belum ada penerimaan barang</td></tr>
              : data.map((g, i) => (
                <tr key={i} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-white">{g.number || g.id}</td>
                  <td className="px-4 py-3 text-slate-400">{g.purchaseOrder?.number || g.purchaseOrderId || '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{g.supplier?.name || '-'}</td>
                  <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300">{g.status || '-'}</span></td>
                  <td className="px-4 py-3 text-slate-400">{g.date ? new Date(g.date).toLocaleDateString('id-ID') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </ModernLayout>
  );
}

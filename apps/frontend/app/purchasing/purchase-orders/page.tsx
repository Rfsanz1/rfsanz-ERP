'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { TrendingUp, Plus, Search, RefreshCw, CheckCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-800 text-slate-400', approved: 'bg-emerald-900/50 text-emerald-400',
  cancelled: 'bg-red-900/50 text-red-400', received: 'bg-blue-900/50 text-blue-400',
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/purchasing/purchase-orders', { params: { search, status, page, limit: 20 } }),
        api.get('/purchasing/stats'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setStats(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, status, page]);

  const approve = async (id: string) => {
    try { await api.post(`/purchasing/purchase-orders/${id}/approve`); load(); } catch (e: any) { alert(e.response?.data?.message || 'Gagal approve'); }
  };

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp className="h-6 w-6 text-orange-400" /> Purchase Orders</h1><p className="text-slate-400 mt-1">Manajemen pembelian & PO</p></div>
          <button onClick={() => router.push('/purchasing/purchase-orders/new')} className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-medium text-white transition"><Plus className="h-4 w-4" /> Buat PO</button>
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4"><p className="text-xs text-slate-500">Total PO</p><p className="text-3xl font-bold text-white mt-1">{stats.total}</p></div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4"><p className="text-xs text-slate-500">Draft</p><p className="text-3xl font-bold text-slate-400 mt-1">{stats.pending}</p></div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4"><p className="text-xs text-slate-500">Approved</p><p className="text-3xl font-bold text-emerald-400 mt-1">{stats.approved}</p></div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4"><p className="text-xs text-slate-500">Total Nilai</p><p className="text-xl font-bold text-orange-400 mt-1">{Number(stats.totalValue||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}</p></div>
          </div>
        )}
        <div className="rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 p-4 border-b border-slate-800">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="Cari nomor PO..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <select className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option><option value="draft">Draft</option><option value="approved">Approved</option><option value="cancelled">Cancelled</option>
            </select>
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3">No PO</th><th className="text-left px-4 py-3">Supplier</th><th className="text-left px-4 py-3">Tanggal</th><th className="text-right px-4 py-3">Total</th><th className="text-center px-4 py-3">Status</th><th className="text-center px-4 py-3">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={6} className="py-12 text-center text-slate-500">Memuat...</td></tr>
              : data.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-slate-500">Belum ada PO</td></tr>
              : data.map(po => (
                <tr key={po.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{po.noPo}</td>
                  <td className="px-4 py-3 font-medium text-white">{po.supplier?.name||'-'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(po.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-white font-medium">{Number(po.totalHarga||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}</td>
                  <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status]||'bg-slate-800 text-slate-400'}`}>{po.status}</span></td>
                  <td className="px-4 py-3 text-center">
                    {po.status === 'draft' && (
                      <button onClick={() => approve(po.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-2 py-1 text-xs text-white transition"><CheckCircle className="h-3 w-3" /> Approve</button>
                    )}
                  </td>
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

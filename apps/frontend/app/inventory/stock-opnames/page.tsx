'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { ClipboardCheck, Plus, RefreshCw } from 'lucide-react';

export default function StockOpnamesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/stock-opnames', { params: { limit: 20 } });
      setData(r.data.data ?? []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><ClipboardCheck className="h-6 w-6 text-blue-400" /> Stock Opname</h1><p className="text-slate-400 mt-1">Rekap stock opname gudang</p></div>
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition"><Plus className="h-4 w-4" /> Buat Opname</button>
        </div>
        <div className="rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-end p-4 border-b border-slate-800">
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3">Tanggal</th><th className="text-left px-4 py-3">Gudang</th><th className="text-left px-4 py-3">Petugas</th><th className="text-center px-4 py-3">Status</th><th className="text-right px-4 py-3">Selisih</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Memuat...</td></tr>
              : data.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Belum ada stock opname</td></tr>
              : data.map((o, i) => (
                <tr key={i} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-400">{o.date ? new Date(o.date).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-4 py-3 font-medium text-white">{o.warehouse?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{o.staff || '-'}</td>
                  <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300">{o.status || '-'}</span></td>
                  <td className={`px-4 py-3 text-right font-medium ${(o.diff||0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{o.diff || 0}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </ModernLayout>
  );
}

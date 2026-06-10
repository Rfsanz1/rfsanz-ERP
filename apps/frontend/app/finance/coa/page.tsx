'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { BookOpen, Plus, Search, RefreshCw } from 'lucide-react';

export default function COAPage() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/finance/coa', { params: { search } });
      const raw = r.data;
      setData(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);

  const TIPE_COLORS: Record<string, string> = {
    aset: 'bg-blue-900/50 text-blue-400', kewajiban: 'bg-red-900/50 text-red-400',
    ekuitas: 'bg-purple-900/50 text-purple-400', pendapatan: 'bg-emerald-900/50 text-emerald-400', beban: 'bg-amber-900/50 text-amber-400',
  };

  return (
    <ModernLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="h-6 w-6 text-cyan-400" /> Chart of Accounts (CoA)</h1><p className="text-slate-400 mt-1">Daftar akun keuangan perusahaan</p></div>
          <button className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition"><Plus className="h-4 w-4" /> Tambah Akun</button>
        </div>
        <div className="rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 p-4 border-b border-slate-800">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="Cari akun..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3">Kode</th><th className="text-left px-4 py-3">Nama Akun</th><th className="text-left px-4 py-3">Tipe</th><th className="text-left px-4 py-3">Kategori</th><th className="text-right px-4 py-3">Saldo</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Memuat...</td></tr>
              : data.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-slate-500">Belum ada akun</td></tr>
              : data.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{a.kode}</td>
                  <td className="px-4 py-3 font-medium text-white">{a.nama}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIPE_COLORS[a.tipe]||'bg-slate-800 text-slate-400'}`}>{a.tipe}</span></td>
                  <td className="px-4 py-3 text-slate-400">{a.kategori||'-'}</td>
                  <td className="px-4 py-3 text-right text-white">{Number(a.saldo||0).toLocaleString('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </ModernLayout>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Warehouse, RefreshCw } from 'lucide-react';

export default function WarehousesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/warehouses');
      setData(r.data ?? []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Warehouse className="h-6 w-6 text-blue-400" /> Gudang</h1><p className="text-slate-400 mt-1">Manajemen gudang penyimpanan</p></div>
          <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
        </div>
        {loading ? <div className="py-12 text-center text-slate-500">Memuat...</div>
        : data.length === 0 ? <div className="py-12 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">Belum ada data gudang</div>
        : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((w, i) => (
              <div key={i} className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
                <p className="font-semibold text-white">{w.name}</p>
                <p className="text-slate-400 text-sm mt-1">{w.address || 'Tidak ada alamat'}</p>
                <p className="text-slate-500 text-xs mt-2">{w.city || ''}</p>
              </div>
            ))}
          </div>
        }
      </div>
    </ModernLayout>
  );
}

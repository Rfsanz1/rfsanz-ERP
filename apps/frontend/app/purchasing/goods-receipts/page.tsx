'use client';
import { useEffect, useState } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { PackageCheck, Plus, Search, RefreshCw } from 'lucide-react';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  received:  'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  draft:     'Draft',
  confirmed: 'Dikonfirmasi',
  received:  'Diterima',
  cancelled: 'Dibatalkan',
};

export default function GoodsReceiptsPage() {
  const [data, setData]       = useState<any[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

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
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-blue-600" /> Penerimaan Barang
            </h1>
            <p className="text-sm text-gray-500 mt-1">Kelola penerimaan barang dari supplier</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Buat Penerimaan
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cari penerimaan..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['No. Penerimaan', 'Referensi PO', 'Supplier', 'Status', 'Tanggal'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Memuat...</td></tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <PackageCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Belum ada penerimaan barang</p>
                    </td>
                  </tr>
                ) : data.map((g, i) => {
                  const st = (g.status ?? '').toLowerCase();
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{g.number || g.id}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{g.purchaseOrder?.number || g.purchaseOrderId || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{g.supplier?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[st] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[st] ?? g.status ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{g.date ? fmtDate(g.date) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>Total: {total} penerimaan</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">←</button>
              <span className="px-3 py-1.5 font-semibold text-gray-700">Hal {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={data.length < 20}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">→</button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}

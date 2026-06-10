'use client';

import { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { DollarSign, Package, TrendingUp, RefreshCw, Search, Download, ChevronDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function fmt(n: number) { return new Intl.NumberFormat('id-ID').format(Math.round(n)); }
function fmtCost(n: number) { return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n); }

const METHOD_LABEL: Record<string, string> = { FIFO: 'FIFO', AVERAGE: 'Average', STANDARD: 'Standard' };
const METHOD_COLOR: Record<string, string> = {
  FIFO: 'bg-blue-100 text-blue-700',
  AVERAGE: 'bg-green-100 text-green-700',
  STANDARD: 'bg-purple-100 text-purple-700',
};

interface ValuationRow {
  productId: string; sku: string; name: string;
  warehouse?: string; category?: string;
  stok: number; unitCost: number; totalValue: number; costingMethod: string;
}

interface ValuationData { asOf: string; totalValue: number; rows: ValuationRow[] }

export default function StockValuationPage() {
  const [data, setData] = useState<ValuationData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'stok'>('value');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = warehouseId ? `?warehouseId=${warehouseId}` : '';
      const [val, st, wh] = await Promise.all([
        fetch(`${API}/inventory/valuation/stock${qs}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/inventory/valuation/stats${qs}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/inventory/warehouses`, { credentials: 'include' }).then(r => r.json()),
      ]);
      setData(val); setStats(st); setWarehouses(Array.isArray(wh) ? wh : []);
    } catch { setData(null); } finally { setLoading(false); }
  }, [warehouseId]);

  useEffect(() => { load(); }, [load]);

  const rows = (data?.rows ?? [])
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'value') return (a.totalValue - b.totalValue) * mul;
      if (sortBy === 'stok') return (a.stok - b.stok) * mul;
      return a.name.localeCompare(b.name) * mul;
    });

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  function exportCSV() {
    if (!rows.length) return;
    const header = 'SKU,Nama Produk,Gudang,Kategori,Metode,Stok,Harga Pokok,Nilai Total';
    const body = rows.map(r =>
      `"${r.sku}","${r.name}","${r.warehouse ?? ''}","${r.category ?? ''}","${r.costingMethod}",${r.stok},${r.unitCost},${r.totalValue}`
    ).join('\n');
    const blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'stock-valuation.csv'; a.click();
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <ChevronDown className={`w-3 h-3 inline ml-0.5 transition-transform ${sortBy === col && sortDir === 'asc' ? 'rotate-180' : ''} ${sortBy === col ? 'text-blue-600' : 'text-gray-300'}`} />
  );

  return (
    <ModernLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Valuation</h1>
            <p className="text-sm text-gray-500 mt-0.5">Nilai total persediaan berdasarkan harga pokok (FIFO / Average / Standard)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} disabled={!rows.length}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-sm rounded-lg disabled:opacity-40">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Nilai Persediaan', value: `Rp ${fmt(data?.totalValue ?? 0)}`, icon: DollarSign, color: 'blue', sub: `per ${data?.asOf ? new Date(data.asOf).toLocaleDateString('id-ID') : '-'}` },
            { label: 'Total Produk Aktif', value: fmt(stats?.totalProducts ?? 0), icon: Package, color: 'indigo', sub: 'dengan stok > 0' },
            { label: 'Lot Kritis', value: fmt(stats?.criticalLots ?? 0), icon: TrendingUp, color: 'red', sub: 'umur > 180hr / hampir exp.' },
            { label: 'Lot Lambat', value: fmt(stats?.slowLots ?? 0), icon: TrendingUp, color: 'amber', sub: 'umur 90 - 180 hari' },
          ].map(c => (
            <div key={c.label} className={`bg-${c.color}-50 border border-${c.color}-100 rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`w-4 h-4 text-${c.color}-600`} />
                <span className={`text-xs font-semibold text-${c.color}-600 uppercase tracking-wide`}>{c.label}</span>
              </div>
              <div className={`text-xl font-bold text-${c.color}-800`}>{c.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari SKU atau nama produk..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Semua Gudang</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Menghitung nilai persediaan...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Tidak ada data persediaan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                    <th onClick={() => toggleSort('name')} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700">
                      Produk <SortIcon col="name" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gudang</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Metode</th>
                    <th onClick={() => toggleSort('stok')} className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700">
                      Stok <SortIcon col="stok" />
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga Pokok</th>
                    <th onClick={() => toggleSort('value')} className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700">
                      Nilai Total <SortIcon col="value" />
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map(r => (
                    <tr key={r.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.sku}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.name}</div>
                        {r.category && <div className="text-xs text-gray-400">{r.category}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.warehouse ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLOR[r.costingMethod] ?? 'bg-gray-100 text-gray-600'}`}>
                          {METHOD_LABEL[r.costingMethod] ?? r.costingMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">{fmt(r.stok)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 font-mono text-xs">Rp {fmtCost(r.unitCost)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">Rp {fmt(r.totalValue)}</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400">
                        {data?.totalValue ? ((r.totalValue / data.totalValue) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 font-bold text-gray-700 text-sm">Total Nilai Persediaan</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-800 text-sm">Rp {fmt(rows.reduce((s, r) => s + r.totalValue, 0))}</td>
                    <td className="px-4 py-3 text-right text-xs text-blue-600 font-semibold">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}

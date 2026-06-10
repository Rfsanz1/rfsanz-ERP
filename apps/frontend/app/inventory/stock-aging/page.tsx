'use client';

import { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { AlertTriangle, Clock, CheckCircle, TrendingDown, RefreshCw, Search, Download } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function fmt(n: number) { return new Intl.NumberFormat('id-ID').format(Math.round(n)); }
function fmtDate(d: string | Date | undefined) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

type AgeCategory = 'fresh' | 'normal' | 'slow' | 'critical';

const AGE_CONFIG: Record<AgeCategory, { label: string; color: string; bg: string; border: string; icon: any }> = {
  fresh:    { label: '0–30 hari',    color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-300',  icon: CheckCircle },
  normal:   { label: '31–90 hari',   color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300',   icon: Clock },
  slow:     { label: '91–180 hari',  color: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-300',  icon: TrendingDown },
  critical: { label: '>180 hari / hampir exp.', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', icon: AlertTriangle },
};

interface AgingRow {
  productId: string; sku: string; name: string; nomorLot: string;
  qtyAwal: number; qtySisa: number; unitCost: number; totalValue: number;
  ageDays: number; expiryDate?: string; expiredIn?: number; ageCategory: AgeCategory;
}

interface SlowRow {
  productId: string; sku: string; name: string; category?: string;
  warehouse?: string; stok: number; unitCost: number; totalValue: number;
  daysSinceMovement: number;
}

export default function StockAgingPage() {
  const [agingData, setAgingData] = useState<AgingRow[]>([]);
  const [slowData, setSlowData] = useState<SlowRow[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'aging' | 'slow'>('aging');
  const [warehouseId, setWarehouseId] = useState('');
  const [slowDays, setSlowDays] = useState(90);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<AgeCategory | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = warehouseId ? `?warehouseId=${warehouseId}` : '';
      const slowQs = new URLSearchParams({ days: String(slowDays), ...(warehouseId ? { warehouseId } : {}) }).toString();
      const [aging, slow, wh] = await Promise.all([
        fetch(`${API}/inventory/valuation/aging${qs}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/inventory/valuation/slow-moving?${slowQs}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/inventory/warehouses`, { credentials: 'include' }).then(r => r.json()),
      ]);
      setAgingData(Array.isArray(aging) ? aging : []);
      setSlowData(Array.isArray(slow) ? slow : []);
      setWarehouses(Array.isArray(wh) ? wh : []);
    } catch { setAgingData([]); setSlowData([]); } finally { setLoading(false); }
  }, [warehouseId, slowDays]);

  useEffect(() => { load(); }, [load]);

  const agingFiltered = agingData.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.sku.toLowerCase().includes(search.toLowerCase()) ||
      r.nomorLot.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || r.ageCategory === filterCat;
    return matchSearch && matchCat;
  });

  const slowFiltered = slowData.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts
  const agingSummary = Object.fromEntries(
    (['fresh','normal','slow','critical'] as AgeCategory[]).map(cat => [
      cat,
      { count: agingData.filter(r => r.ageCategory === cat).length,
        value: agingData.filter(r => r.ageCategory === cat).reduce((s, r) => s + r.totalValue, 0) },
    ])
  ) as Record<AgeCategory, { count: number; value: number }>;

  function exportCSV() {
    const data = tab === 'aging' ? agingFiltered : slowFiltered;
    if (!data.length) return;
    let csv = '';
    if (tab === 'aging') {
      csv = 'SKU,Produk,No Lot,Qty Awal,Qty Sisa,Harga Pokok,Nilai Total,Umur (hr),Kadaluwarsa,Kategori\n';
      csv += (data as AgingRow[]).map(r =>
        `"${r.sku}","${r.name}","${r.nomorLot}",${r.qtyAwal},${r.qtySisa},${r.unitCost},${r.totalValue},${r.ageDays},"${fmtDate(r.expiryDate)}","${r.ageCategory}"`
      ).join('\n');
    } else {
      csv = 'SKU,Produk,Kategori,Gudang,Stok,Harga Pokok,Nilai Total,Tidak Bergerak (hr)\n';
      csv += (data as SlowRow[]).map(r =>
        `"${r.sku}","${r.name}","${r.category ?? ''}","${r.warehouse ?? ''}",${r.stok},${r.unitCost},${r.totalValue},${r.daysSinceMovement}`
      ).join('\n');
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `stock-aging-${tab}.csv`; a.click();
  }

  return (
    <ModernLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Aging</h1>
            <p className="text-sm text-gray-500 mt-0.5">Umur stok per lot dan produk lambat bergerak</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-sm rounded-lg disabled:opacity-40">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
            </button>
          </div>
        </div>

        {/* Age category summary */}
        {tab === 'aging' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['fresh','normal','slow','critical'] as AgeCategory[]).map(cat => {
              const cfg = AGE_CONFIG[cat];
              const Icon = cfg.icon;
              const s = agingSummary[cat];
              return (
                <button key={cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
                  className={`text-left rounded-xl p-4 border-2 transition-all ${filterCat === cat ? cfg.border + ' ' + cfg.bg : 'border-gray-200 bg-white hover:' + cfg.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                    <span className={`text-xs font-semibold uppercase ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{s.count} <span className="text-sm font-normal text-gray-500">lot</span></div>
                  <div className="text-xs text-gray-500 mt-0.5">Rp {fmt(s.value)}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tabs + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {([['aging','Aging per Lot'],['slow','Produk Lambat']] as const).map(([key, label]) => (
              <button key={key} onClick={() => { setTab(key); setSearch(''); setFilterCat(''); }}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk atau lot..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Semua Gudang</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {tab === 'slow' && (
            <select value={slowDays} onChange={e => setSlowDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              {[30,60,90,120,180].map(d => <option key={d} value={d}>Tidak bergerak &gt; {d} hari</option>)}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Menganalisis umur stok...</div>
          ) : tab === 'aging' ? (
            agingFiltered.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
                {filterCat ? `Tidak ada lot dengan kategori "${AGE_CONFIG[filterCat].label}".` : 'Tidak ada data lot.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Produk / Lot','Qty Awal','Qty Sisa','Harga Pokok','Nilai Sisa','Umur (hr)','Kadaluwarsa','Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {agingFiltered.map(row => {
                      const cfg = AGE_CONFIG[row.ageCategory];
                      const Icon = cfg.icon;
                      return (
                        <tr key={`${row.productId}-${row.nomorLot}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{row.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 font-mono">{row.sku}</span>
                              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{row.nomorLot}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{fmt(row.qtyAwal)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(row.qtySisa)}</td>
                          <td className="px-4 py-3 text-right text-gray-500 text-xs font-mono">Rp {fmt(row.unitCost)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">Rp {fmt(row.totalValue)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold text-sm ${row.ageDays > 180 ? 'text-red-600' : row.ageDays > 90 ? 'text-amber-600' : 'text-gray-700'}`}>
                              {row.ageDays}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-600">{fmtDate(row.expiryDate)}</div>
                            {row.expiredIn !== undefined && (
                              <div className={`text-xs font-medium mt-0.5 ${row.expiredIn < 0 ? 'text-red-600' : row.expiredIn <= 30 ? 'text-orange-600' : 'text-gray-400'}`}>
                                {row.expiredIn < 0 ? `${Math.abs(row.expiredIn)} hr lalu` : `${row.expiredIn} hr lagi`}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-3 h-3" /> {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-bold text-gray-700 text-sm">Total ({agingFiltered.length} lot)</td>
                      <td colSpan={3}></td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">
                        Rp {fmt(agingFiltered.reduce((s, r) => s + r.totalValue, 0))}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          ) : (
            slowFiltered.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
                Semua produk bergerak dalam {slowDays} hari terakhir. 
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Produk','Kategori','Gudang','Stok','Harga Pokok','Nilai Total','Tidak Bergerak'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {slowFiltered.map(row => (
                      <tr key={row.productId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{row.name}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{row.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{row.category ?? '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{row.warehouse ?? '-'}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700">{fmt(row.stok)}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500 font-mono">Rp {fmt(row.unitCost)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">Rp {fmt(row.totalValue)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                            <TrendingDown className="w-3 h-3" /> &gt; {row.daysSinceMovement} hari
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-bold text-gray-700 text-sm">{slowFiltered.length} produk</td>
                      <td colSpan={4}></td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">
                        Rp {fmt(slowFiltered.reduce((s, r) => s + r.totalValue, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </ModernLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import ModernLayout from '../../../components/layout/ModernLayout';
import { Hash, Search, ChevronDown, AlertTriangle, CheckCircle, Clock, Plus, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function fmt(n: number) { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(Number(n)); }
function fmtDate(s: string | null | undefined) {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysFromNow(d: string) {
  return Math.floor((new Date(d).getTime() - Date.now()) / 86_400_000);
}
function daysAgo(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

interface StockLot {
  id: string; productId: string; nomorLot: string;
  expiryDate?: string; qtyAwal: number; qtySisa: number;
  unitCost: number; referenceId?: string; createdAt: string;
  product?: { sku: string; name: string; warehouse?: { name: string }; category?: { name: string } };
}

export default function LotTrackingPage() {
  const [lots, setLots] = useState<StockLot[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: '', nomorLot: '', qtyAwal: '', unitCost: '', expiryDate: '', referenceId: '',
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterProduct) qs.set('productId', filterProduct);
      const [lotsRes, prodRes] = await Promise.all([
        fetch(`${API}/inventory/valuation/lots?${qs}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API}/inventory/products?limit=200`, { credentials: 'include' }).then(r => r.json()),
      ]);
      setLots(Array.isArray(lotsRes.data) ? lotsRes.data : []);
      setTotal(lotsRes.total ?? 0);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch { setLots([]); } finally { setLoading(false); }
  }, [page, filterProduct]);

  useEffect(() => { load(); }, [load]);

  const filtered = lots.filter(l =>
    l.nomorLot.toLowerCase().includes(search.toLowerCase()) ||
    (l.product?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.product?.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function createLot() {
    if (!form.productId || !form.nomorLot || !form.qtyAwal || !form.unitCost) return;
    setSaving(true);
    try {
      await fetch(`${API}/inventory/costing/lots`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          qtyAwal: Number(form.qtyAwal),
          unitCost: Number(form.unitCost),
          expiryDate: form.expiryDate || undefined,
          referenceId: form.referenceId || undefined,
        }),
      });
      setShowForm(false);
      setForm({ productId: '', nomorLot: '', qtyAwal: '', unitCost: '', expiryDate: '', referenceId: '' });
      await load();
    } finally { setSaving(false); }
  }

  function getExpiryStatus(lot: StockLot): { label: string; color: string; icon: any } {
    if (!lot.expiryDate) return { label: 'No Expiry', color: 'text-gray-400', icon: Clock };
    const days = daysFromNow(lot.expiryDate);
    if (days < 0) return { label: `Kedaluwarsa ${Math.abs(days)} hr lalu`, color: 'text-red-600', icon: AlertTriangle };
    if (days <= 30) return { label: `Kedaluwarsa ${days} hr lagi`, color: 'text-orange-600', icon: AlertTriangle };
    if (days <= 90) return { label: `${days} hr lagi`, color: 'text-amber-600', icon: Clock };
    return { label: `${days} hr lagi`, color: 'text-green-600', icon: CheckCircle };
  }

  function getAgeColor(lot: StockLot) {
    const age = daysAgo(lot.createdAt);
    if (age > 180) return 'bg-red-50 border-l-4 border-l-red-400';
    if (age > 90) return 'bg-amber-50 border-l-4 border-l-amber-400';
    if (age > 30) return 'bg-yellow-50 border-l-4 border-l-yellow-300';
    return '';
  }

  return (
    <ModernLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lot Tracking</h1>
            <p className="text-sm text-gray-500 mt-0.5">Lacak lot/batch dari pembelian hingga penjualan · FIFO</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
            <Plus className="w-4 h-4" /> Tambah Lot
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
          {[
            { label: 'Total Lot', value: String(total) },
            { label: 'Lot Aktif', value: String(lots.filter(l => Number(l.qtySisa) > 0).length) },
            { label: 'Hampir Exp.', value: String(lots.filter(l => l.expiryDate && daysFromNow(l.expiryDate) >= 0 && daysFromNow(l.expiryDate) <= 30).length), warn: true },
            { label: 'Sudah Exp.', value: String(lots.filter(l => l.expiryDate && daysFromNow(l.expiryDate) < 0).length), err: true },
            { label: 'Stok Habis', value: String(lots.filter(l => Number(l.qtySisa) === 0).length) },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 border ${s.err ? 'border-red-200 bg-red-50' : s.warn ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className={`text-xl font-bold ${s.err ? 'text-red-700' : s.warn ? 'text-amber-700' : 'text-gray-800'}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor lot, SKU, atau produk..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterProduct} onChange={e => { setFilterProduct(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Semua Produk</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Memuat data lot...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Hash className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-gray-400 text-sm">Belum ada data lot. Klik "Tambah Lot" untuk mulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['No. Lot','Produk','Gudang','Qty Awal','Qty Sisa','Harga Pokok','Nilai Sisa','Umur (hr)','Kadaluwarsa','Referensi'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(lot => {
                    const expStatus = getExpiryStatus(lot);
                    const ExpIcon = expStatus.icon;
                    const age = daysAgo(lot.createdAt);
                    const utilizationPct = Number(lot.qtyAwal) > 0
                      ? ((1 - Number(lot.qtySisa) / Number(lot.qtyAwal)) * 100).toFixed(0)
                      : '0';

                    return (
                      <tr key={lot.id} className={`hover:bg-gray-50/50 transition-colors ${getAgeColor(lot)}`}>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700 text-xs">{lot.nomorLot}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{lot.product?.name ?? '-'}</div>
                          <div className="text-xs text-gray-400 font-mono">{lot.product?.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{lot.product?.warehouse?.name ?? '-'}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(lot.qtyAwal)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-gray-900">{fmt(lot.qtySisa)}</div>
                          <div className="text-xs text-gray-400">{utilizationPct}% terpakai</div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 font-mono text-xs">Rp {fmt(lot.unitCost)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          Rp {fmt(Number(lot.qtySisa) * Number(lot.unitCost))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${age > 180 ? 'text-red-600' : age > 90 ? 'text-amber-600' : 'text-gray-700'}`}>{age}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1 text-xs font-medium ${expStatus.color}`}>
                            <ExpIcon className="w-3 h-3 flex-shrink-0" />
                            <span>{fmtDate(lot.expiryDate)}</span>
                          </div>
                          <div className={`text-xs mt-0.5 ${expStatus.color}`}>{lot.expiryDate ? expStatus.label : ''}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{lot.referenceId ? lot.referenceId.slice(0, 10) + '…' : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Lot Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Tambah Stock Lot</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Produk *</label>
              <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Pilih produk...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nomor Lot *</label>
                <input value={form.nomorLot} onChange={e => setForm({ ...form, nomorLot: e.target.value })}
                  placeholder="LOT-2026-001"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tgl Kadaluwarsa</label>
                <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Qty Awal *</label>
                <input type="number" value={form.qtyAwal} onChange={e => setForm({ ...form, qtyAwal: e.target.value })}
                  placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Harga Pokok / Unit *</label>
                <input type="number" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })}
                  placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Referensi (No. GRN / PO)</label>
              <input value={form.referenceId} onChange={e => setForm({ ...form, referenceId: e.target.value })}
                placeholder="GRN-001" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={createLot} disabled={saving || !form.productId || !form.nomorLot || !form.qtyAwal || !form.unitCost}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold">
                {saving ? 'Menyimpan...' : 'Simpan Lot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}

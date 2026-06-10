'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ModernLayout } from '../../../../components/layout/ModernLayout';
import { api } from '../../../../lib/api';
import {
  FileText, Plus, Trash2, Search, ChevronDown,
  ArrowLeft, Save, Package, Building2, Calculator,
} from 'lucide-react';

interface Supplier { id: string; name: string; code?: string; phone?: string }
interface Product  { id: string; name: string; sku?: string; hargaKledo?: number; stok?: number; unit?: { name: string } }
interface LineItem  { productId: string; productName: string; qty: number; hargaBeli: number; subtotal: number }

const IDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  /* ── form state ─────────────────────────────────────────────── */
  const [supplierId, setSupplierId] = useState('');
  const [tanggal, setTanggal]     = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan]     = useState('');
  const [discount, setDiscount]   = useState(0);
  const [items, setItems]         = useState<LineItem[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  /* ── supplier search ─────────────────────────────────────────── */
  const [suppliers, setSuppliers]           = useState<Supplier[]>([]);
  const [supplierQuery, setSupplierQuery]   = useState('');
  const [supplierOpen, setSupplierOpen]     = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const searchSuppliers = useCallback(async (q: string) => {
    setSupplierLoading(true);
    try {
      const res = await api.get('/purchasing/suppliers', { params: { search: q, limit: 20 } });
      setSuppliers(res.data.data ?? []);
    } catch { setSuppliers([]); }
    finally { setSupplierLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchSuppliers(supplierQuery), 300);
    return () => clearTimeout(t);
  }, [supplierQuery]);

  useEffect(() => { searchSuppliers(''); }, []);

  /* ── product search ──────────────────────────────────────────── */
  const [products, setProducts]           = useState<Product[]>([]);
  const [productQuery, setProductQuery]   = useState('');
  const [productOpen, setProductOpen]     = useState(false);
  const [productLoading, setProductLoading] = useState(false);

  const searchProducts = useCallback(async (q: string) => {
    setProductLoading(true);
    try {
      const res = await api.get('/inventory/products', { params: { search: q, limit: 30 } });
      setProducts(res.data.data ?? []);
    } catch { setProducts([]); }
    finally { setProductLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productQuery), 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  useEffect(() => { searchProducts(''); }, []);

  /* ── item management ─────────────────────────────────────────── */
  const addProduct = (p: Product) => {
    const exists = items.find(i => i.productId === p.id);
    if (exists) {
      setItems(items.map(i => i.productId === p.id
        ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.hargaBeli }
        : i));
    } else {
      const harga = Number(p.hargaKledo ?? 0);
      setItems([...items, { productId: p.id, productName: p.name, qty: 1, hargaBeli: harga, subtotal: harga }]);
    }
    setProductOpen(false);
    setProductQuery('');
  };

  const updateItem = (idx: number, field: 'qty' | 'hargaBeli', val: number) => {
    setItems(items.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      updated.subtotal = updated.qty * updated.hargaBeli;
      return updated;
    }));
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  /* ── kalkulasi ───────────────────────────────────────────────── */
  const subtotal    = items.reduce((s, it) => s + it.subtotal, 0);
  const discountAmt = subtotal * (discount / 100);
  const dpp         = subtotal - discountAmt;
  const ppn         = dpp * 0.11;
  const total       = dpp + ppn;

  /* ── submit ──────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!supplierId) { setError('Pilih supplier terlebih dahulu'); return; }
    if (items.length === 0) { setError('Tambahkan minimal 1 produk'); return; }
    setSaving(true);
    try {
      await api.post('/purchasing/purchase-orders', {
        supplierId,
        tanggal: new Date(tanggal).toISOString(),
        catatan,
        discountPercentage: discount,
        items: items.map(it => ({ productId: it.productId, qty: it.qty, hargaBeli: it.hargaBeli })),
      });
      router.push('/purchasing/purchase-orders');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan PO');
    } finally { setSaving(false); }
  };

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <ModernLayout>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">

        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-orange-400" /> Buat Purchase Order
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">Nomor PO dibuat otomatis setelah disimpan</p>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition">
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan PO'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/40 border border-red-700/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* info dasar */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Informasi PO
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* supplier */}
            <div className="relative">
              <label className="text-xs text-slate-500 mb-1.5 block">Supplier <span className="text-red-400">*</span></label>
              <button type="button" onClick={() => setSupplierOpen(o => !o)}
                className="w-full flex items-center justify-between rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-left transition hover:border-slate-600 focus:outline-none focus:border-orange-500">
                <span className={selectedSupplier ? 'text-white' : 'text-slate-500'}>
                  {selectedSupplier ? selectedSupplier.name : 'Pilih supplier...'}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
              </button>
              {supplierOpen && (
                <div className="absolute z-30 mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-700">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input autoFocus
                        className="w-full rounded-lg bg-slate-700 pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                        placeholder="Cari supplier..."
                        value={supplierQuery}
                        onChange={e => setSupplierQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <ul className="max-h-52 overflow-y-auto">
                    {supplierLoading ? (
                      <li className="px-4 py-3 text-sm text-slate-500">Memuat...</li>
                    ) : suppliers.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-slate-500">Tidak ada supplier</li>
                    ) : suppliers.map(s => (
                      <li key={s.id}>
                        <button type="button" onClick={() => { setSupplierId(s.id); setSupplierOpen(false); setSupplierQuery(''); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition">
                          <span className="text-white font-medium">{s.name}</span>
                          {s.code && <span className="ml-2 text-xs text-slate-500 font-mono">{s.code}</span>}
                          {s.phone && <div className="text-xs text-slate-500 mt-0.5">{s.phone}</div>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* tanggal */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tanggal PO</label>
              <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition" />
            </div>

            {/* catatan */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 mb-1.5 block">Catatan / Keterangan</label>
              <textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)}
                placeholder="Catatan tambahan untuk PO ini..."
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition resize-none" />
            </div>
          </div>
        </div>

        {/* item produk */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <Package className="h-4 w-4" /> Item Produk
            </h2>
            <div className="relative">
              <button type="button" onClick={() => setProductOpen(o => !o)}
                className="flex items-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm text-white transition">
                <Plus className="h-4 w-4" /> Tambah Produk
              </button>
              {productOpen && (
                <div className="absolute right-0 z-30 mt-1 w-80 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-700">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input autoFocus
                        className="w-full rounded-lg bg-slate-700 pl-8 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                        placeholder="Cari produk..."
                        value={productQuery}
                        onChange={e => setProductQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <ul className="max-h-64 overflow-y-auto">
                    {productLoading ? (
                      <li className="px-4 py-3 text-sm text-slate-500">Memuat...</li>
                    ) : products.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-slate-500">Tidak ada produk</li>
                    ) : products.map(p => (
                      <li key={p.id}>
                        <button type="button" onClick={() => addProduct(p)}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">{p.name}</span>
                            <span className="text-xs text-slate-500 font-mono">{p.sku}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-orange-400">{IDR(Number(p.hargaKledo ?? 0))}</span>
                            <span className="text-xs text-slate-500">Stok: {p.stok ?? 0}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* tabel item */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3">Produk</th>
                  <th className="text-center px-4 py-3 w-28">Qty</th>
                  <th className="text-right px-4 py-3 w-44">Harga Beli (Rp)</th>
                  <th className="text-right px-4 py-3 w-40">Subtotal</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                      Belum ada produk — klik &quot;Tambah Produk&quot; di atas
                    </td>
                  </tr>
                ) : items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-white font-medium">{it.productName}</td>
                    <td className="px-4 py-3">
                      <input type="number" min={1} value={it.qty}
                        onChange={e => updateItem(idx, 'qty', Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-center text-sm text-white focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={0} value={it.hargaBeli}
                        onChange={e => updateItem(idx, 'hargaBeli', Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-right text-sm text-white focus:outline-none focus:border-orange-500" />
                    </td>
                    <td className="px-4 py-3 text-right text-orange-400 font-semibold">{IDR(it.subtotal)}</td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => removeItem(idx)}
                        className="p-1.5 rounded-lg hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ringkasan kalkulasi */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-4">
            <Calculator className="h-4 w-4" /> Ringkasan Harga
          </h2>
          <div className="max-w-xs ml-auto space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-medium">{IDR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Diskon</span>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={discount}
                  onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-16 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-orange-500" />
                <span className="text-slate-500">%</span>
                <span className="text-red-400 font-medium w-32 text-right">− {IDR(discountAmt)}</span>
              </div>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>DPP</span>
              <span className="text-white">{IDR(dpp)}</span>
            </div>
            <div className="flex justify-between text-slate-400 pb-2.5 border-b border-slate-800">
              <span className="flex items-center gap-1">
                PPN <span className="text-xs bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded">11%</span>
              </span>
              <span className="text-blue-400 font-medium">{IDR(ppn)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-white">Total</span>
              <span className="text-orange-400">{IDR(total)}</span>
            </div>
          </div>
        </div>

        {/* footer actions */}
        <div className="flex items-center justify-between pb-8">
          <button type="button" onClick={() => router.back()}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition">
            Batal
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition">
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan sebagai Draft'}
          </button>
        </div>

      </form>
    </ModernLayout>
  );
}

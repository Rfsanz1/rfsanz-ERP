'use client';

import { useState, useRef } from 'react';
import { ShoppingCart, Plus, X, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';

const COLOR = '#00ACC1';

interface OrderItem {
  id: number;
  nama: string;
  qty: number;
  harga: number;
  subtotal: number;
}

interface ProductSuggestion {
  id: string;
  name: string;
  sku: string;
  hargaJual: number;
}

const emptyItem = (): OrderItem => ({ id: Date.now(), nama: '', qty: 1, harga: 0, subtotal: 0 });

export default function CreateOrderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuthStore();
  const [namaCustomer, setNamaCustomer] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [salesName, setSalesName] = useState(user?.name ?? '');
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  const totalHarga = items.reduce((sum, it) => sum + it.subtotal, 0);

  const searchProducts = (query: string, itemId: number) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!query || query.length < 2) { setSuggestions([]); return; }
    setActiveItemId(itemId);
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/inventory/products', { params: { search: query, limit: 8 } });
        setSuggestions(res.data?.data ?? res.data ?? []);
      } catch { setSuggestions([]); }
    }, 300);
    setSearchTimeout(t);
  };

  const updateItem = (id: number, field: keyof OrderItem, value: any) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === 'qty' || field === 'harga') {
        updated.subtotal = Number(updated.qty) * Number(updated.harga);
      }
      return updated;
    }));
  };

  const selectProduct = (itemId: number, prod: ProductSuggestion) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const harga = Number(prod.hargaJual) || 0;
      return { ...it, nama: prod.name, harga, subtotal: it.qty * harga };
    }));
    setSuggestions([]);
    setActiveItemId(null);
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const handleSubmit = async () => {
    if (!namaCustomer.trim()) { setError('Nama customer wajib diisi.'); return; }
    if (items.some(it => !it.nama.trim())) { setError('Semua item harus memiliki nama produk.'); return; }
    setError('');
    setSaving(true);
    try {
      await api.post('/sales/orders', {
        namaCustomer: namaCustomer.trim(),
        noHp: noHp.trim() || undefined,
        alamat: alamat.trim() || undefined,
        catatan: catatan.trim() || undefined,
        salesName: salesName.trim() || undefined,
        totalHarga,
        status: 'pending',
        items: items.map(({ nama, qty, harga, subtotal }) => ({ nama, qty, harga, subtotal })),
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Gagal menyimpan order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(47,43,61,.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ boxShadow: '0 20px 60px rgba(47,43,61,.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" style={{ color: COLOR }} />
            <h2 className="text-base font-bold" style={{ color: '#1E1B4B' }}>Buat Order Baru</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition hover:bg-gray-100">
            <X className="h-4 w-4" style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* Info Customer */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Info Customer</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#1E1B4B' }}>Nama Customer <span style={{ color: '#EA5455' }}>*</span></label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                  placeholder="cth: PT Maju Jaya"
                  value={namaCustomer}
                  onChange={e => setNamaCustomer(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = COLOR; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE8F5'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#1E1B4B' }}>No. HP</label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                  placeholder="cth: 081234567890"
                  value={noHp}
                  onChange={e => setNoHp(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = COLOR; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE8F5'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#1E1B4B' }}>Nama Sales</label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                  placeholder="Nama sales"
                  value={salesName}
                  onChange={e => setSalesName(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = COLOR; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE8F5'; }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#1E1B4B' }}>Alamat</label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                  placeholder="Alamat pengiriman"
                  value={alamat}
                  onChange={e => setAlamat(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = COLOR; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE8F5'; }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#1E1B4B' }}>Catatan</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                  placeholder="Catatan tambahan (opsional)"
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  onFocus={e => { e.currentTarget.style.borderColor = COLOR; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EDE8F5'; }}
                />
              </div>
            </div>
          </div>

          {/* Item-item Produk */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Produk</p>
              <button onClick={addItem} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition" style={{ color: COLOR, backgroundColor: 'rgba(0,172,193,.08)' }}>
                <Plus className="h-3.5 w-3.5" /> Tambah Item
              </button>
            </div>

            <div className="grid grid-cols-12 gap-2 px-2">
              <div className="col-span-5 text-xs font-medium" style={{ color: '#9CA3AF' }}>Produk</div>
              <div className="col-span-2 text-xs font-medium text-center" style={{ color: '#9CA3AF' }}>Qty</div>
              <div className="col-span-3 text-xs font-medium text-right" style={{ color: '#9CA3AF' }}>Harga</div>
              <div className="col-span-2 text-xs font-medium text-right" style={{ color: '#9CA3AF' }}>Subtotal</div>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5 relative">
                    <input
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                      placeholder="Nama produk"
                      value={item.nama}
                      onChange={e => {
                        updateItem(item.id, 'nama', e.target.value);
                        searchProducts(e.target.value, item.id);
                      }}
                      onFocus={e => { e.target.style.borderColor = COLOR; setActiveItemId(item.id); }}
                      onBlur={e => { e.target.style.borderColor = '#EDE8F5'; setTimeout(() => setSuggestions([]), 200); }}
                    />
                    {activeItemId === item.id && suggestions.length > 0 && (
                      <div ref={suggestRef} className="absolute left-0 right-0 top-full mt-1 z-10 bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EDE8F5', boxShadow: '0 8px 24px rgba(47,43,61,.12)' }}>
                        {suggestions.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => selectProduct(item.id, p)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition"
                          >
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{p.name}</p>
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>{p.sku}</p>
                            </div>
                            <span className="text-xs font-semibold" style={{ color: COLOR }}>
                              {Number(p.hargaJual).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-lg px-2 py-2 text-sm text-center"
                      style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                      value={item.qty}
                      onChange={e => updateItem(item.id, 'qty', Number(e.target.value) || 1)}
                      onFocus={e => { e.target.style.borderColor = COLOR; }}
                      onBlur={e => { e.target.style.borderColor = '#EDE8F5'; }}
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg px-2 py-2 text-sm text-right"
                      style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }}
                      value={item.harga}
                      onChange={e => updateItem(item.id, 'harga', Number(e.target.value) || 0)}
                      onFocus={e => { e.target.style.borderColor = COLOR; }}
                      onBlur={e => { e.target.style.borderColor = '#EDE8F5'; }}
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <span className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>
                      {item.subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                    </span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 transition ml-1">
                        <Trash2 className="h-3.5 w-3.5" style={{ color: '#EA5455' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-1">
            <div className="rounded-xl px-5 py-3 text-right" style={{ backgroundColor: 'rgba(0,172,193,.07)', border: '1px solid rgba(0,172,193,.2)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>Total Order</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: COLOR }}>
                {totalHarga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ backgroundColor: 'rgba(234,84,85,.08)', color: '#EA5455', border: '1px solid rgba(234,84,85,.2)' }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #EDE8F5' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium transition hover:bg-gray-50" style={{ color: '#1E1B4B', border: '1px solid #EDE8F5' }}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ backgroundColor: COLOR, boxShadow: '0 4px 12px rgba(0,172,193,.35)' }}
          >
            {saving ? 'Menyimpan...' : 'Simpan Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

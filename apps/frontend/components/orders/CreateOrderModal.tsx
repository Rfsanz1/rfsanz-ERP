'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, X, Trash2, Package } from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';
import CustomerSearchDropdown, { type CustomerOption } from '../ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '../ui/ProductSearchDropdown';
import SalesDropdown from '../ui/SalesDropdown';

const COLOR = '#00ACC1';

interface OrderItem {
  id: number;
  productId?: string;
  kledoProductId?: string | null;
  nama: string;
  qty: number;
  harga: number;
  subtotal: number;
  stokInfo?: number;
  unit?: string;
}

const emptyItem = (): OrderItem => ({ id: Date.now(), nama: '', qty: 1, harga: 0, subtotal: 0 });

const fmtRp = (v: number) =>
  v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors`;
const inputStyle = { border: '1.5px solid #E5E7EB', color: '#1E1B4B', background: '#fff' };

export default function CreateOrderModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuthStore();
  const [namaCustomer, setNamaCustomer] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [salesName, setSalesName] = useState(user?.name ?? '');
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalHarga = items.reduce((s, it) => s + it.subtotal, 0);

  const handleCustomerSelect = (c: CustomerOption) => {
    setNamaCustomer(c.name);
    if (c.phone && !noHp) setNoHp(c.phone);
    if (c.address && !alamat) setAlamat(c.address);
  };

  const updateItem = (id: number, field: keyof OrderItem, value: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'qty' || field === 'harga')
          updated.subtotal = Number(updated.qty) * Number(updated.harga);
        return updated;
      }),
    );
  };

  const handleProductSelect = (itemId: number, prod: ProductOption) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        const harga = Number(prod.hargaJual) || 0;
        return {
          ...it,
          nama: prod.name,
          productId: prod.id,
          kledoProductId: prod.kledoProductId ?? null,
          harga,
          subtotal: it.qty * harga,
          stokInfo: prod.stok,
          unit: prod.unit?.name,
        };
      }),
    );
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const handleSubmit = async () => {
    if (!namaCustomer.trim()) { setError('Nama konsumen wajib diisi.'); return; }
    if (items.some(it => !it.nama.trim())) { setError('Semua produk harus diisi.'); return; }
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
        items: items.map(({ nama, qty, harga, subtotal, productId, kledoProductId }) => ({
          nama, qty, harga, subtotal,
          ...(productId ? { productId } : {}),
          ...(kledoProductId ? { kledoProductId } : {}),
        })),
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Gagal menyimpan order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(47,43,61,.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white rounded-2xl w-full flex flex-col"
        style={{
          maxWidth: 780,
          maxHeight: '92vh',
          boxShadow: '0 24px 80px rgba(47,43,61,.25)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: '1.5px solid #F0EDFB' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `${COLOR}18` }}
            >
              <ShoppingCart className="h-5 w-5" style={{ color: COLOR }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#1E1B4B' }}>Buat Order Baru</h2>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Isi data konsumen dan produk pesanan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto px-7 py-6 flex-1 space-y-7">

          {/* INFO KONSUMEN */}
          <section className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
              Info Konsumen
            </p>

            {/* Nama Konsumen — full width */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Nama Konsumen <span style={{ color: '#EA5455' }}>*</span>
              </label>
              <CustomerSearchDropdown
                value={namaCustomer}
                onChange={setNamaCustomer}
                onSelect={handleCustomerSelect}
                placeholder="Ketik nama atau nomor HP konsumen..."
                accentColor={COLOR}
                required
              />
            </div>

            {/* No HP + Nama Sales — dua kolom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                  No. HP / WhatsApp
                </label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="cth: 081234567890"
                  value={noHp}
                  onChange={e => setNoHp(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = COLOR)}
                  onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                  Nama Sales
                </label>
                <SalesDropdown
                  value={salesName}
                  onChange={setSalesName}
                  accentColor={COLOR}
                  placeholder="Pilih atau ketik nama sales..."
                />
              </div>
            </div>

            {/* Alamat — full width */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Alamat Pengiriman
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Jl. contoh No. 1, Kota..."
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
                onFocus={e => (e.target.style.borderColor = COLOR)}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Catatan <span className="font-normal" style={{ color: '#9CA3AF' }}>(opsional)</span>
              </label>
              <textarea
                rows={2}
                className={`${inputCls} resize-none`}
                style={inputStyle}
                placeholder="Catatan tambahan untuk order ini..."
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                onFocus={e => (e.currentTarget.style.borderColor = COLOR)}
                onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
              />
            </div>
          </section>

          {/* DAFTAR PRODUK */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
                Daftar Produk
              </p>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: COLOR, backgroundColor: `${COLOR}12` }}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Produk
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ border: '1.5px solid #F0EDFB', background: '#FDFCFF' }}
                >
                  {/* Baris atas: nomor + hapus */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                        style={{ background: COLOR }}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                        Produk #{idx + 1}
                      </span>
                      {item.unit && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${COLOR}14`, color: COLOR }}
                        >
                          {item.unit}
                        </span>
                      )}
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: '#EA5455' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    )}
                  </div>

                  {/* Nama Produk — full width di kartu */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                      <Package className="h-3 w-3 inline mr-1" style={{ color: COLOR }} />
                      Nama Produk <span style={{ color: '#EA5455' }}>*</span>
                    </label>
                    <ProductSearchDropdown
                      value={item.nama}
                      onChange={nama => updateItem(item.id, 'nama', nama)}
                      onSelect={prod => handleProductSelect(item.id, prod)}
                      placeholder="Ketik nama produk atau SKU..."
                      accentColor={COLOR}
                    />
                    {item.stokInfo !== undefined && (
                      <p
                        className="text-[11px] mt-1.5 font-medium"
                        style={{
                          color:
                            item.stokInfo > 20
                              ? '#22C55E'
                              : item.stokInfo > 5
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      >
                        ● Stok tersedia: {item.stokInfo} {item.unit ?? ''}
                      </p>
                    )}
                  </div>

                  {/* Qty + Harga + Subtotal — tiga kolom */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        className={`${inputCls} text-center`}
                        style={inputStyle}
                        value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', Number(e.target.value) || 1)}
                        onFocus={e => (e.target.style.borderColor = COLOR)}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                        Harga Satuan (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        className={`${inputCls} text-right`}
                        style={inputStyle}
                        value={item.harga}
                        onChange={e => updateItem(item.id, 'harga', Number(e.target.value) || 0)}
                        onFocus={e => (e.target.style.borderColor = COLOR)}
                        onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                        Subtotal
                      </label>
                      <div
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-right font-bold"
                        style={{ background: `${COLOR}0D`, color: COLOR, border: `1.5px solid ${COLOR}30` }}
                      >
                        {fmtRp(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TOTAL */}
          <div
            className="flex items-center justify-between rounded-2xl px-6 py-4"
            style={{ background: `${COLOR}0D`, border: `1.5px solid ${COLOR}25` }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                {items.length} produk · {items.reduce((s, i) => s + i.qty, 0)} item
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Total sebelum diskon/pajak</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#9CA3AF' }}>Total Order</p>
              <p className="text-2xl font-bold" style={{ color: COLOR }}>{fmtRp(totalHarga)}</p>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
              style={{
                background: 'rgba(234,84,85,.08)',
                color: '#EA5455',
                border: '1.5px solid rgba(234,84,85,.2)',
              }}
            >
              ⚠ {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end gap-3 px-7 py-5"
          style={{ borderTop: '1.5px solid #F0EDFB' }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50"
            style={{ color: '#6B7280', border: '1.5px solid #E5E7EB' }}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{
              background: COLOR,
              boxShadow: `0 4px 16px ${COLOR}50`,
            }}
          >
            {saving ? 'Menyimpan...' : '💾 Simpan Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

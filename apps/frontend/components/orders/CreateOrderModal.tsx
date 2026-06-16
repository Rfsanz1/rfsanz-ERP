'use client';

import { useState } from 'react';
import {
  ShoppingCart, Plus, X, Trash2, Package,
  Tag, Percent, Truck, Link2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';
import CustomerSearchDropdown, { type CustomerOption } from '../ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '../ui/ProductSearchDropdown';
import SalesDropdown from '../ui/SalesDropdown';

const COLOR = '#00ACC1';
const today = () => new Date().toISOString().slice(0, 10);

interface OrderItem {
  id: number;
  productId?: string;
  kledoProductId?: string | null;
  nama: string;
  qty: number;
  harga: number;
  diskonItem: number;
  subtotal: number;
  stokInfo?: number;
  unit?: string;
}

const emptyItem = (): OrderItem => ({ id: Date.now(), nama: '', qty: 1, harga: 0, diskonItem: 0, subtotal: 0 });

const fmtRp = (v: number) =>
  v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors`;
const inputSt: React.CSSProperties = {
  border: '1.5px solid var(--border)',
  color: 'var(--text-primary)',
  background: 'var(--surface)',
};
const focusColor = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = COLOR);
const blurColor  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--border)');

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
      {children}
      {optional && <span className="ml-1 font-normal text-[11px]" style={{ color: 'var(--text-muted)' }}>(opsional)</span>}
    </label>
  );
}

export default function CreateOrderModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuthStore();

  const [namaCustomer, setNamaCustomer]       = useState('');
  const [kledoContactId, setKledoContactId]   = useState<string | null>(null);
  const [noHp, setNoHp]                       = useState('');
  const [alamat, setAlamat]                   = useState('');
  const [salesName, setSalesName]             = useState(user?.name ?? '');

  const [tanggal]                             = useState(today());
  const [catatan, setCatatan]                 = useState('');
  const [diskonTotal, setDiskonTotal]         = useState(0);
  const [pajak, setPajak]                     = useState(0);
  const [ongkir, setOngkir]                   = useState(0);

  const [items, setItems]                     = useState<OrderItem[]>([emptyItem()]);
  const [saving, setSaving]                   = useState(false);
  const [kledoStatus, setKledoStatus]         = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  const [error, setError]                     = useState('');

  const subtotalBruto = items.reduce((s, it) => s + it.subtotal, 0);
  const grandTotal    = Math.max(0, subtotalBruto - diskonTotal + pajak + ongkir);

  const handleCustomerSelect = (c: CustomerOption) => {
    setNamaCustomer(c.name);
    if (c.phone && !noHp) setNoHp(c.phone);
    if (c.address && !alamat) setAlamat(c.address);
    if (c.source === 'kledo') setKledoContactId(c.id.replace('kledo-', ''));
    else if ((c as any).kledoId) setKledoContactId((c as any).kledoId);
  };

  const calcSubtotal = (it: OrderItem) =>
    Math.max(0, (Number(it.qty) * Number(it.harga)) - Number(it.diskonItem));

  const updateItem = (id: number, field: keyof OrderItem, value: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (['qty', 'harga', 'diskonItem'].includes(field as string))
          updated.subtotal = calcSubtotal(updated);
        return updated;
      }),
    );
  };

  const handleProductSelect = (itemId: number, prod: ProductOption) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== itemId) return it;
        const harga = Number(prod.hargaJual) || 0;
        const updated = {
          ...it, nama: prod.name, productId: prod.id,
          kledoProductId: prod.kledoProductId ?? null,
          harga, diskonItem: 0, stokInfo: prod.stok, unit: prod.unit?.name,
        };
        updated.subtotal = calcSubtotal(updated);
        return updated;
      }),
    );
  };

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const handleSubmit = async () => {
    if (!namaCustomer.trim()) { setError('Nama konsumen wajib diisi.'); return; }
    if (items.some(it => !it.nama.trim())) { setError('Semua produk harus diisi.'); return; }
    setError('');
    setSaving(true);

    const payload = {
      namaCustomer: namaCustomer.trim(),
      noHp: noHp.trim() || undefined,
      alamat: alamat.trim() || undefined,
      catatan: catatan.trim() || undefined,
      salesName: salesName.trim() || undefined,
      tanggal,
      diskonTotal: diskonTotal || undefined,
      pajak: pajak || undefined,
      ongkir: ongkir || undefined,
      totalHarga: grandTotal,
      status: 'pending',
      items: items.map(({ nama, qty, harga, subtotal, diskonItem, productId, kledoProductId }) => ({
        nama, qty, harga, subtotal,
        diskon: diskonItem || undefined,
        ...(productId ? { productId } : {}),
        ...(kledoProductId ? { kledoProductId } : {}),
      })),
    };

    try {
      await api.post('/sales/orders', payload);

      setKledoStatus('syncing');
      try {
        await api.post('/kledo/invoices', {
          trans_date: tanggal,
          memo: catatan.trim() || undefined,
          contact_id: kledoContactId ? Number(kledoContactId) : undefined,
          contact_name: namaCustomer.trim(),
          discount: diskonTotal || undefined,
          include_tax: pajak > 0 ? 1 : 0,
          items: [
            ...items.map(it => ({
              product_id: it.kledoProductId ? Number(it.kledoProductId) : undefined,
              name_item: it.nama, qty: it.qty, rate: it.harga,
              discount: it.diskonItem || undefined, unit: it.unit,
            })),
            ...(ongkir > 0 ? [{ name_item: 'Biaya Pengiriman', qty: 1, rate: ongkir }] : []),
          ],
        });
        setKledoStatus('ok');
      } catch {
        setKledoStatus('error');
      }

      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Gagal menyimpan order.');
      setKledoStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="rounded-2xl w-full flex flex-col"
        style={{ background: 'var(--surface)', maxWidth: 820, maxHeight: '92vh', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1.5px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${COLOR}18` }}>
              <ShoppingCart className="h-5 w-5" style={{ color: COLOR }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Buat Order Baru</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Data otomatis tersinkron ke Kledo
                {kledoStatus === 'syncing' && ' · Mengirim ke Kledo…'}
                {kledoStatus === 'ok' && ' ✓ Tersinkron ke Kledo'}
                {kledoStatus === 'error' && ' · Kledo tidak terjangkau'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto px-7 py-6 flex-1 space-y-6">

          {/* SEKSI 1: Info Konsumen */}
          <section className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Info Konsumen</p>

            <div>
              <Label>Nama Konsumen <span style={{ color: 'var(--danger)' }}>*</span></Label>
              <CustomerSearchDropdown
                value={namaCustomer}
                onChange={v => { setNamaCustomer(v); setKledoContactId(null); }}
                onSelect={handleCustomerSelect}
                placeholder="Ketik nama atau nomor HP konsumen..."
                accentColor={COLOR}
                required
              />
              {kledoContactId && (
                <p className="mt-1 text-[11px] font-medium flex items-center gap-1" style={{ color: COLOR }}>
                  <Link2 className="h-3 w-3" /> Terhubung ke Kledo (ID: {kledoContactId})
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label optional>No. HP / WhatsApp</Label>
                <input className={inputCls} style={inputSt} placeholder="081234567890"
                  value={noHp} onChange={e => setNoHp(e.target.value)}
                  onFocus={focusColor} onBlur={blurColor} />
              </div>
              <div>
                <Label>Nama Sales</Label>
                <SalesDropdown value={salesName} onChange={setSalesName} accentColor={COLOR} placeholder="Pilih atau ketik nama sales..." />
              </div>
              <div className="col-span-2">
                <Label optional>Alamat Pengiriman</Label>
                <input className={inputCls} style={inputSt} placeholder="Jl. contoh No. 1, Kota..."
                  value={alamat} onChange={e => setAlamat(e.target.value)}
                  onFocus={focusColor} onBlur={blurColor} />
              </div>
            </div>
          </section>

          {/* SEKSI 2: Info Transaksi */}
          <section className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Info Transaksi</p>
            <div>
              <Label optional>Catatan / Pesan</Label>
              <input className={inputCls} style={inputSt} placeholder="Catatan atau pesan untuk order ini..."
                value={catatan} onChange={e => setCatatan(e.target.value)}
                onFocus={focusColor} onBlur={blurColor} />
            </div>
          </section>

          {/* SEKSI 3: Daftar Produk */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Daftar Produk</p>
              <button onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: COLOR, backgroundColor: `${COLOR}12` }}>
                <Plus className="h-3.5 w-3.5" /> Tambah Produk
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="rounded-2xl p-4 space-y-3"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--surface-sunken)' }}>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ background: COLOR }}>
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Produk #{idx + 1}</span>
                      {item.unit && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${COLOR}14`, color: COLOR }}>
                          {item.unit}
                        </span>
                      )}
                      {item.kledoProductId && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(99,102,241,.1)', color: '#6366F1' }}>
                          <Link2 className="h-2.5 w-2.5" /> Kledo
                        </span>
                      )}
                    </div>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ color: 'var(--danger)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-light)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    )}
                  </div>

                  <div>
                    <Label><Package className="h-3 w-3 inline mr-1" style={{ color: COLOR }} />Nama Produk <span style={{ color: 'var(--danger)' }}>*</span></Label>
                    <ProductSearchDropdown
                      value={item.nama}
                      onChange={nama => updateItem(item.id, 'nama', nama)}
                      onSelect={prod => handleProductSelect(item.id, prod)}
                      placeholder="Ketik nama produk atau SKU..."
                      accentColor={COLOR}
                    />
                    {item.stokInfo !== undefined && (
                      <p className="text-[11px] mt-1.5 font-medium"
                        style={{ color: item.stokInfo > 20 ? '#22C55E' : item.stokInfo > 5 ? '#F59E0B' : 'var(--danger)' }}>
                        ● Stok tersedia: {item.stokInfo} {item.unit ?? ''}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <label className="block text-xs font-semibold mb-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Qty</label>
                      <input type="number" min={1} className={`${inputCls} text-center`} style={inputSt}
                        value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', Number(e.target.value) || 1)}
                        onFocus={focusColor} onBlur={blurColor} />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-xs font-semibold mb-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Harga (Rp)</label>
                      <input type="number" min={0} className={`${inputCls} text-right`} style={inputSt}
                        value={item.harga}
                        onChange={e => updateItem(item.id, 'harga', Number(e.target.value) || 0)}
                        onFocus={focusColor} onBlur={blurColor} />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-xs font-semibold mb-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Subtotal</label>
                      <div className="w-full rounded-xl px-2 py-2.5 text-xs text-right font-bold flex items-center justify-end overflow-hidden"
                        style={{ background: `${COLOR}0D`, color: COLOR, border: `1.5px solid ${COLOR}30`, minWidth: 0 }}>
                        <span className="truncate">{fmtRp(item.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SEKSI 4: Ringkasan Total */}
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Ringkasan</p>

            <div className="rounded-2xl p-5 space-y-3"
              style={{ background: 'var(--surface-sunken)', border: '1.5px solid var(--border)' }}>

              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal ({items.length} produk)</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtRp(subtotalBruto)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Tag className="h-3.5 w-3.5" /> Diskon Total (Rp)
                </span>
                <input type="number" min={0}
                  className="w-36 rounded-lg px-3 py-1.5 text-sm text-right outline-none"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                  value={diskonTotal || ''} placeholder="0"
                  onChange={e => setDiskonTotal(Number(e.target.value) || 0)}
                  onFocus={focusColor} onBlur={blurColor} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Percent className="h-3.5 w-3.5" /> Pajak / PPN (Rp)
                </span>
                <input type="number" min={0}
                  className="w-36 rounded-lg px-3 py-1.5 text-sm text-right outline-none"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                  value={pajak || ''} placeholder="0"
                  onChange={e => setPajak(Number(e.target.value) || 0)}
                  onFocus={focusColor} onBlur={blurColor} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Truck className="h-3.5 w-3.5" /> Biaya Pengiriman (Rp)
                </span>
                <input type="number" min={0}
                  className="w-36 rounded-lg px-3 py-1.5 text-sm text-right outline-none"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                  value={ongkir || ''} placeholder="0"
                  onChange={e => setOngkir(Number(e.target.value) || 0)}
                  onFocus={focusColor} onBlur={blurColor} />
              </div>

              <div className="pt-2" style={{ borderTop: '1.5px solid var(--border)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                  <span className="text-2xl font-bold" style={{ color: COLOR }}>{fmtRp(grandTotal)}</span>
                </div>
              </div>
            </div>

            {kledoStatus !== 'idle' && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: kledoStatus === 'ok' ? 'var(--success-light)' : kledoStatus === 'error' ? 'var(--danger-light)' : `${COLOR}0A`,
                  border: `1.5px solid ${kledoStatus === 'ok' ? 'rgba(16,185,129,.25)' : kledoStatus === 'error' ? 'rgba(239,68,68,.25)' : `${COLOR}25`}`,
                  color: kledoStatus === 'ok' ? 'var(--success)' : kledoStatus === 'error' ? 'var(--danger)' : COLOR,
                }}>
                {kledoStatus === 'syncing' && <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: `${COLOR}40`, borderTopColor: COLOR }} />}
                {kledoStatus === 'ok' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                {kledoStatus === 'error' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                {kledoStatus === 'syncing' && 'Mengirim invoice ke Kledo…'}
                {kledoStatus === 'ok' && 'Invoice berhasil dikirim ke Kledo'}
                {kledoStatus === 'error' && 'Kledo tidak terjangkau — order tetap tersimpan di ERP'}
              </div>
            )}

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
                style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1.5px solid rgba(239,68,68,.2)' }}>
                ⚠ {error}
              </div>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-7 py-5" style={{ borderTop: '1.5px solid var(--border)' }}>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            Batal
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: COLOR, boxShadow: `0 4px 16px ${COLOR}50` }}>
            {saving ? 'Menyimpan…' : '💾 Simpan & Kirim ke Kledo'}
          </button>
        </div>
      </div>
    </div>
  );
}

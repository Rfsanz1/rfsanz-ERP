'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingCart, Plus, X, Trash2, Package,
  Tag, Percent, Truck, Link2, CheckCircle2, AlertCircle,
  CreditCard, Banknote, Smartphone, Wallet, Copy, Check,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';
import CustomerSearchDropdown, { type CustomerOption } from '../ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '../ui/ProductSearchDropdown';
import SalesDropdown from '../ui/SalesDropdown';

const COLOR = '#00ACC1';
const today = () => new Date().toISOString().slice(0, 10);

/* ── Deteksi unit berdasarkan nama barang ── */
const ELEKTRO_KW = [
  'mesin cuci', 'chest freezer', 'freezer', 'kulkas', 'lemari es',
  'air conditioner', 'ac ', ' ac,', '(ac)', 'televisi', ' tv ', 'blender',
  'dispenser', 'rice cooker', 'magic com', 'setrika', 'kipas angin',
  'pompa air', 'jet pump', 'water heater', 'kompor listrik', 'oven listrik',
  'microwave', 'laptop', 'komputer', 'handphone', 'smartphone', 'printer',
  'speaker', 'refrigerator', 'dryer', 'washing machine', 'inverter',
  'genset', 'vacuum', 'mixer listrik', 'juicer', 'water pump',
  'kulkas', 'showcase', 'chest', 'deep freezer', 'lemari pendingin',
];
const BANGUNAN_KW = [
  'semen', 'bata ', ' batu bata', 'pasir', 'pipa ', 'cat tembok', 'cat kayu',
  'cat besi', 'keramik', 'genteng', 'besi ', 'baja', 'triplek', 'plywood',
  'kabel listrik', 'saklar', 'stop kontak', 'kran', 'seng', 'galvalum',
  'plafon', 'hollow', 'bondek', 'wiremesh', 'granit', 'marmer', 'atap',
  'paku ', 'baut ', 'waterproofing', 'siku ', 'engsel', 'pintu kayu',
  'jendela', 'kloset', 'wastafel', 'shower', 'beton', 'mortar', 'nat ',
  'lem keramik', 'genteng', 'talang', 'list plafon',
];

/* ── Dynamic keywords cache (loaded from settings DB) ── */
let _customElektroKw: string[] = [];
let _customBangunanKw: string[] = [];
let _kwFetched = false;

async function loadCustomKeywords() {
  if (_kwFetched) return;
  try {
    const r = await fetch('/api/settings/keywords');
    if (r.ok) {
      const d = await r.json();
      const rows: { keyword: string; kategori: string }[] = d.data ?? [];
      _customElektroKw  = rows.filter(x => x.kategori === 'elektronik').map(x => x.keyword.toLowerCase());
      _customBangunanKw = rows.filter(x => x.kategori === 'bahan_bangunan').map(x => x.keyword.toLowerCase());
    }
  } catch { /* non-fatal — use hardcoded only */ }
  _kwFetched = true;
}

function detectKategori(nama: string): 'elektronik' | 'bahan_bangunan' | null {
  const n = ` ${nama.toLowerCase()} `;
  const allElektro  = [...ELEKTRO_KW,  ..._customElektroKw];
  const allBangunan = [...BANGUNAN_KW, ..._customBangunanKw];
  for (const kw of allElektro)  if (n.includes(kw)) return 'elektronik';
  for (const kw of allBangunan) if (n.includes(kw)) return 'bahan_bangunan';
  return null;
}

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
  kasUnit?: 'elektronik' | 'bahan_bangunan' | null; // dari category.unitBisnis
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

const METODE_OPTIONS = [
  { value: 'transfer',  label: 'Transfer Bank', icon: Smartphone },
  { value: 'debit',    label: 'Debit / Kartu',  icon: CreditCard },
  { value: 'cash',     label: 'Cash / Tunai',   icon: Banknote },
  { value: 'cod',      label: 'COD',            icon: Truck },
  { value: 'dp',       label: 'Uang Muka (DP)', icon: Wallet },
];

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

  const [metodePembayaran, setMetodePembayaran] = useState('transfer');
  const [copiedBank, setCopiedBank]           = useState<string | null>(null);
  const [bankPilihan, setBankPilihan]         = useState<string | null>(null);
  const [edcPilihan, setEdcPilihan]           = useState<string | null>(null);
  const [metodeDp, setMetodeDp]               = useState<'transfer' | 'debit' | 'cash' | ''>('');
  const [uangMuka, setUangMuka]               = useState(0);

  const [items, setItems]                     = useState<OrderItem[]>([emptyItem()]);
  const [saving, setSaving]                   = useState(false);
  const [kledoStatus, setKledoStatus]         = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  const [error, setError]                     = useState('');
  const [savedOrderId, setSavedOrderId]       = useState<number | null>(null);

  /* Load custom keywords from DB once when modal mounts */
  useEffect(() => { loadCustomKeywords(); }, []);

  const subtotalBruto = items.reduce((s, it) => s + it.subtotal, 0);
  const grandTotal    = Math.max(0, subtotalBruto - diskonTotal + pajak + ongkir);
  const sisaBayar     = Math.max(0, grandTotal - uangMuka);

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
          kasUnit: prod.kasUnit ?? null,
        };
        updated.subtotal = calcSubtotal(updated);
        return updated;
      }),
    );
  };

  const copyRekening = (bank: string, no: string) => {
    const clean = no.replace(/\s/g, '');
    navigator.clipboard.writeText(clean).catch(() => {});
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    setKledoStatus('syncing');

    /* ── RETRY MODE: order sudah tersimpan lokal, cukup kirim ulang ke Kledo ── */
    if (savedOrderId !== null) {
      try {
        const res = await api.post('/sales/orders/kledo-retry', { orderId: savedOrderId });
        const kledoResult = (res.data as any)?.kledo;
        if (kledoResult?.ok) {
          setKledoStatus('ok');
          setTimeout(onSuccess, 800);
        } else {
          setKledoStatus('error');
          const kledoErr = kledoResult?.error ?? 'Kledo tidak merespons';
          setError(`Retry gagal: ${kledoErr}. Coba lagi atau tutup modal.`);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Gagal retry ke Kledo.');
        setKledoStatus('error');
      } finally {
        setSaving(false);
      }
      return;
    }

    /* ── SAVE BARU ── */
    if (!namaCustomer.trim()) { setError('Nama konsumen wajib diisi.'); setSaving(false); setKledoStatus('idle'); return; }
    if (items.some(it => !it.nama.trim())) { setError('Semua produk harus diisi.'); setSaving(false); setKledoStatus('idle'); return; }

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
      kledoContactId: kledoContactId || undefined,
      metodePembayaran,
      bankPilihan: metodePembayaran === 'transfer' ? (bankPilihan ?? undefined) : undefined,
      edcPilihan: metodePembayaran === 'debit' ? (edcPilihan ?? undefined) : undefined,
      metodeDp: metodePembayaran === 'dp' ? (metodeDp || undefined) : undefined,
      uangMuka: uangMuka || undefined,
      items: items.map(({ nama, qty, harga, subtotal, diskonItem, productId, kledoProductId, unit }) => ({
        nama, qty, harga, subtotal,
        diskon: diskonItem || undefined,
        unit,
        ...(productId ? { productId } : {}),
        ...(kledoProductId ? { kledoProductId } : {}),
      })),
    };

    try {
      const res = await api.post('/sales/orders', payload);
      /* Backend mengembalikan order langsung (bukan { data, kledo })
         Kledo push dilakukan async di backend — anggap berhasil jika 2xx */
      const orderId = (res.data as any)?.id ?? (res.data as any)?.data?.id ?? null;
      const kledoResult = (res.data as any)?.kledo;

      if (kledoResult !== undefined) {
        /* Backend versi lama yang memang kembalikan { kledo } */
        if (kledoResult?.ok) {
          setKledoStatus('ok');
          onSuccess();
        } else {
          setSavedOrderId(orderId);
          setKledoStatus('error');
          const kledoErr = kledoResult?.error ?? 'Kledo tidak merespons';
          setError(`Order tersimpan ✓ — Kledo: ${kledoErr}. Klik "Coba Ulang" untuk kirim ulang.`);
        }
      } else {
        /* Backend mengembalikan order langsung — Kledo dipush async di server */
        setKledoStatus('ok');
        onSuccess();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message
        ?? e?.response?.data?.error
        ?? e?.message
        ?? 'Gagal menyimpan order. Periksa koneksi ke server.';
      setError(msg);
      setKledoStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-2 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', zIndex: 9999 }}
    >
      <div
        className="rounded-2xl w-full flex flex-col"
        style={{ background: 'var(--surface)', maxWidth: 820, maxHeight: '96vh', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-7 py-4 sm:py-5" style={{ borderBottom: '1.5px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${COLOR}18` }}>
              <ShoppingCart className="h-5 w-5" style={{ color: COLOR }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Buat Order Baru</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Tersimpan otomatis ke ERP + Kledo
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

        {/* ── Error Banner (sticky di atas body) ── */}
        {error && (
          <div className="px-4 sm:px-7 py-3 flex items-start gap-2 text-sm"
            style={{ background: 'var(--danger-light,#fef2f2)', borderBottom: '1.5px solid rgba(239,68,68,.2)', color: 'var(--danger,#dc2626)', flexShrink: 0 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>⚠</span>
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}

        {/* ── Body ── */}
        <div className="overflow-y-auto px-4 sm:px-7 py-4 sm:py-6 flex-1 space-y-5 sm:space-y-6">

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
              <div className="sm:col-span-2">
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
                      {(item.kasUnit === 'elektronik' || (!item.kasUnit && item.nama && detectKategori(item.nama) === 'elektronik')) && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#6366F112', color: '#6366F1' }}>
                          ⚡ Elektronik{item.kasUnit ? '' : ' (kw)'}
                        </span>
                      )}
                      {(item.kasUnit === 'bahan_bangunan' || (!item.kasUnit && item.nama && detectKategori(item.nama) === 'bahan_bangunan')) && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#0891B212', color: '#0891B2' }}>
                          🏗 Bangunan{item.kasUnit ? '' : ' (kw)'}
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
                    {item.nama && item.harga > 0 && (
                      <p className="text-[11px] mt-1.5 font-semibold flex items-center gap-1" style={{ color: COLOR }}>
                        <Tag className="h-3 w-3" /> Harga satuan: {fmtRp(item.harga)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <label className="block text-[11px] sm:text-xs font-semibold mb-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Qty</label>
                      <input type="number" min={1} className={`${inputCls} text-center`} style={inputSt}
                        value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', Number(e.target.value) || 1)}
                        onFocus={focusColor} onBlur={blurColor} />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-[11px] sm:text-xs font-semibold mb-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Harga (Rp)</label>
                      <input type="number" min={0} className={`${inputCls} text-right`} style={inputSt}
                        value={item.harga}
                        onChange={e => updateItem(item.id, 'harga', Number(e.target.value) || 0)}
                        onFocus={focusColor} onBlur={blurColor} />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-[11px] sm:text-xs font-semibold mb-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Subtotal</label>
                      <div className="w-full rounded-xl px-2 py-2.5 text-[11px] sm:text-xs text-right font-bold flex items-center justify-end overflow-hidden"
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
          </section>

          {/* SEKSI 5: Detail Pembayaran */}
          <section className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Detail Pembayaran</p>

            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--surface-sunken)', border: '1.5px solid var(--border)' }}>

              {/* Metode Pembayaran — kartu pilihan */}
              <div>
                <Label>Metode Pembayaran</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {METODE_OPTIONS.map(opt => {
                    const OptIcon = opt.icon;
                    const isActive = metodePembayaran === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setMetodePembayaran(opt.value);
                          if (opt.value !== 'transfer') setBankPilihan(null);
                          if (opt.value !== 'debit') setEdcPilihan(null);
                          if (opt.value !== 'dp') setMetodeDp('');
                        }}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all active:scale-95"
                        style={{
                          border: `2px solid ${isActive ? COLOR : 'var(--border)'}`,
                          background: isActive ? `${COLOR}15` : 'var(--surface)',
                          cursor: 'pointer',
                        }}
                      >
                        <OptIcon
                          className="h-5 w-5 flex-shrink-0"
                          style={{ color: isActive ? COLOR : 'var(--text-muted)' }}
                        />
                        <span
                          className="text-[11px] font-semibold leading-tight"
                          style={{ color: isActive ? COLOR : 'var(--text-secondary)' }}
                        >
                          {opt.label}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info Rekening + Pilih Bank — tampil saat Transfer dipilih */}
              {metodePembayaran === 'transfer' && (() => {
                const REKENING = [
                  { key: 'bri',     label: 'BRI EDC',    bank: 'BRI',     no: '0262 01 000031 562', nama: 'Dian Purnama Reza T.' },
                  { key: 'mandiri', label: 'Mandiri',    bank: 'MANDIRI', no: '136 000 4780612',    nama: 'Dian Purnama' },
                  { key: 'bca',     label: 'BCA GIRO',   bank: 'BCA',     no: '155 91 99999',       nama: 'Indarto Wibowo' },
                  { key: 'bni',     label: 'BNI',        bank: 'BNI',     no: '0822 705 836',       nama: 'Indarto Wibowo' },
                ];
                return (
                  <div className="space-y-3">
                    {/* Pilih bank yang digunakan */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: COLOR }}>
                        Bank yang Digunakan
                        <span className="font-normal normal-case text-[10px]" style={{ color: 'var(--text-muted)' }}>— pilih untuk otomatis lunas di Kledo</span>
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {REKENING.map(r => {
                          const isSelected = bankPilihan === r.key;
                          return (
                            <button
                              key={r.key}
                              type="button"
                              onClick={() => setBankPilihan(isSelected ? null : r.key)}
                              className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-center transition-all active:scale-95"
                              style={{
                                border: `2px solid ${isSelected ? COLOR : 'var(--border)'}`,
                                background: isSelected ? `${COLOR}15` : 'var(--surface)',
                              }}
                            >
                              <span className="text-[11px] font-bold leading-tight" style={{ color: isSelected ? COLOR : 'var(--text-secondary)' }}>{r.bank}</span>
                              <span className="text-[9px] font-medium leading-tight" style={{ color: isSelected ? COLOR : 'var(--text-muted)' }}>{r.label.replace(r.bank, '').trim() || r.label}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: COLOR }} />}
                            </button>
                          );
                        })}
                      </div>
                      {bankPilihan && (() => {
                        const KLEDO_AKUN: Record<string, string> = {
                          bca: 'BCA Giro', bri: 'BRI EDC', mandiri: 'Mandiri', bni: 'BNI',
                        };
                        return (
                          <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: '#10B981' }}>
                            <CheckCircle2 className="h-3 w-3" /> Invoice Kledo otomatis <strong>LUNAS</strong> via akun <strong>{KLEDO_AKUN[bankPilihan] ?? bankPilihan.toUpperCase()}</strong>
                          </p>
                        );
                      })()}
                    </div>

                    {/* Nomor rekening — tap untuk copy */}
                    <div className="rounded-xl p-3 space-y-1.5"
                      style={{ background: 'rgba(99,102,241,.06)', border: '1.5px solid rgba(99,102,241,.2)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: COLOR }}>
                        Nomor Rekening Tujuan
                      </p>
                      {REKENING.map(r => {
                        const isCopied   = copiedBank === r.bank;
                        const isSelected = bankPilihan === r.key;
                        return (
                          <button
                            key={r.bank}
                            type="button"
                            onClick={() => { copyRekening(r.bank, r.no); setBankPilihan(r.key); }}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all active:scale-[.98]"
                            style={{
                              background: isSelected ? `${COLOR}18` : isCopied ? `${COLOR}0D` : 'var(--surface)',
                              border: `1.5px solid ${isSelected ? COLOR : isCopied ? `${COLOR}50` : 'transparent'}`,
                              cursor: 'pointer',
                            }}
                          >
                            <span className="text-[11px] font-bold w-14 flex-shrink-0 text-left" style={{ color: COLOR }}>{r.bank}</span>
                            <span className="text-[13px] font-semibold flex-1 text-left" style={{ color: 'var(--text-primary)', letterSpacing: '.03em' }}>{r.no}</span>
                            <span className="text-[11px] flex-shrink-0 hidden sm:block" style={{ color: 'var(--text-muted)' }}>{r.nama}</span>
                            <span className="flex-shrink-0 ml-auto pl-2">
                              {isCopied
                                ? <Check className="h-3.5 w-3.5" style={{ color: COLOR }} />
                                : <Copy className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                              }
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Pilihan EDC — tampil saat Debit dipilih */}
              {metodePembayaran === 'debit' && (() => {
                const EDC_OPTIONS = [
                  { key: 'bri_edc',  label: 'BRI EDC',  bank: 'BRI' },
                  { key: 'bca_edc',  label: 'BCA EDC',  bank: 'BCA' },
                  { key: 'bni_edc',  label: 'BNI EDC',  bank: 'BNI' },
                ];
                return (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: COLOR }}>
                      Mesin EDC yang Digunakan
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {EDC_OPTIONS.map(edc => {
                        const isSelected = edcPilihan === edc.key;
                        return (
                          <button
                            key={edc.key}
                            type="button"
                            onClick={() => setEdcPilihan(isSelected ? null : edc.key)}
                            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all active:scale-95"
                            style={{
                              border: `2px solid ${isSelected ? COLOR : 'var(--border)'}`,
                              background: isSelected ? `${COLOR}15` : 'var(--surface)',
                            }}
                          >
                            <CreditCard className="h-4 w-4 flex-shrink-0" style={{ color: isSelected ? COLOR : 'var(--text-muted)' }} />
                            <span className="text-[12px] font-bold leading-tight" style={{ color: isSelected ? COLOR : 'var(--text-secondary)' }}>{edc.bank}</span>
                            <span className="text-[10px] font-medium leading-tight" style={{ color: isSelected ? COLOR : 'var(--text-muted)' }}>EDC</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR }} />}
                          </button>
                        );
                      })}
                    </div>
                    {edcPilihan && (() => {
                      const KLEDO_AKUN: Record<string, string> = {
                        bca_edc: 'BCA EDC', bri_edc: 'BRI EDC', bni_edc: 'BNI',
                      };
                      return (
                        <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#10B981' }}>
                          <CheckCircle2 className="h-3 w-3" /> Invoice Kledo otomatis <strong>LUNAS</strong> via akun <strong>{KLEDO_AKUN[edcPilihan] ?? edcPilihan.toUpperCase()}</strong>
                        </p>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Sub-metode DP — tampil saat Uang Muka dipilih */}
              {metodePembayaran === 'dp' && (() => {
                const DP_OPTIONS = [
                  { key: 'transfer', label: 'Transfer',  icon: Smartphone },
                  { key: 'debit',    label: 'Debit EDC', icon: CreditCard },
                  { key: 'cash',     label: 'Cash',      icon: Banknote   },
                ];
                return (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: COLOR }}>
                      DP Dibayar Via
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {DP_OPTIONS.map(opt => {
                        const OptIcon = opt.icon;
                        const isSelected = metodeDp === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              setMetodeDp(opt.key as any);
                            }}
                            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition-all active:scale-95"
                            style={{
                              border: `2px solid ${isSelected ? COLOR : 'var(--border)'}`,
                              background: isSelected ? `${COLOR}15` : 'var(--surface)',
                            }}
                          >
                            <OptIcon className="h-4 w-4 flex-shrink-0" style={{ color: isSelected ? COLOR : 'var(--text-muted)' }} />
                            <span className="text-[12px] font-bold leading-tight" style={{ color: isSelected ? COLOR : 'var(--text-secondary)' }}>{opt.label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Uang Muka / DP — tampil saat metode bukan cash penuh */}
              <div>
                <Label optional>Uang Muka / DP (Rp)</Label>
                <input type="number" min={0} max={grandTotal}
                  className={`${inputCls} text-right`} style={inputSt}
                  placeholder="0 jika bayar penuh"
                  value={uangMuka || ''}
                  onChange={e => setUangMuka(Math.min(grandTotal, Number(e.target.value) || 0))}
                  onFocus={focusColor} onBlur={blurColor} />
              </div>

              {/* Sisa Bayar */}
              {uangMuka > 0 && (
                <div className="rounded-xl px-4 py-3 flex justify-between items-center"
                  style={{ background: 'rgba(245,158,11,.08)', border: '1.5px solid rgba(245,158,11,.25)' }}>
                  <span className="text-sm font-semibold" style={{ color: '#92400E' }}>Sisa Bayar</span>
                  <span className="text-lg font-bold" style={{ color: '#F59E0B' }}>{fmtRp(sisaBayar)}</span>
                </div>
              )}

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
                {kledoStatus === 'syncing' && 'Menyimpan & mengirim ke Kledo…'}
                {kledoStatus === 'ok' && 'Invoice berhasil dikirim ke Kledo'}
                {kledoStatus === 'error' && 'Order tersimpan — Kledo tidak terjangkau, sync manual nanti'}
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
        <div className="flex flex-col gap-2 px-4 sm:px-7 py-4 sm:py-5" style={{ borderTop: '1.5px solid var(--border)', flexShrink: 0 }}>
          {/* Error banner di footer agar selalu terlihat di mobile */}
          {error && (
            <div className="rounded-xl px-4 py-2.5 text-sm flex items-start gap-2 w-full"
              style={{ background: 'var(--danger-light,#fef2f2)', color: 'var(--danger,#dc2626)', border: '1.5px solid rgba(239,68,68,.2)' }}>
              <span style={{ fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{error}</span>
              <button type="button" onClick={() => setError('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
            </div>
          )}
          {kledoStatus === 'syncing' && (
            <div className="rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 w-full"
              style={{ background: `${COLOR}0A`, border: `1.5px solid ${COLOR}25`, color: COLOR }}>
              <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: `${COLOR}40`, borderTopColor: COLOR }} />
              Menyimpan & mengirim ke Kledo…
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Batal
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: COLOR, boxShadow: `0 4px 16px ${COLOR}50` }}>
              {saving
                ? '⏳ Menyimpan…'
                : savedOrderId !== null
                  ? '🔄 Coba Ulang ke Kledo'
                  : '💾 Simpan & Kirim ke Kledo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

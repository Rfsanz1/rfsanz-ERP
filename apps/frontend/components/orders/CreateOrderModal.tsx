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

  type PembayaranMetode = 'transfer' | 'cash' | 'debit' | 'cod';
  interface PembayaranEntry { id: string; metode: PembayaranMetode; jumlah: number; bankPilihan: string | null; edcPilihan: string | null; }
  const newPembayaran = (m: PembayaranMetode = 'transfer'): PembayaranEntry => ({ id: Math.random().toString(36).slice(2), metode: m, jumlah: 0, bankPilihan: null, edcPilihan: null });
  const [pembayaranList, setPembayaranList]   = useState<PembayaranEntry[]>([newPembayaran()]);
  const [copiedBank, setCopiedBank]           = useState<string | null>(null);

  const [items, setItems]                     = useState<OrderItem[]>([emptyItem()]);
  const [saving, setSaving]                   = useState(false);
  const [kledoStatus, setKledoStatus]         = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  const [error, setError]                     = useState('');
  const [savedOrderId, setSavedOrderId]       = useState<number | null>(null);

  /* Auto-deteksi unit bisnis dari kategori produk — dipakai di payload, tidak ditampilkan di UI */
  const unitBisnis = useMemo<'elektronik' | 'bahan_bangunan' | ''>(() => {
    const counts = { elektronik: 0, bahan_bangunan: 0 };
    for (const it of items) {
      const k = it.kasUnit ?? (it.nama ? detectKategori(it.nama) : null);
      if (k === 'elektronik') counts.elektronik++;
      else if (k === 'bahan_bangunan') counts.bahan_bangunan++;
    }
    if (counts.elektronik > 0 && counts.bahan_bangunan === 0) return 'elektronik';
    if (counts.bahan_bangunan > 0 && counts.elektronik === 0) return 'bahan_bangunan';
    return '';
  }, [items]);

  /* Load custom keywords from DB once when modal mounts */
  useEffect(() => { loadCustomKeywords(); }, []);

  const subtotalBruto = items.reduce((s, it) => s + it.subtotal, 0);
  const grandTotal    = Math.max(0, subtotalBruto - diskonTotal + pajak + ongkir);
  const totalDibayar  = pembayaranList.reduce((s, p) => s + (p.jumlah || 0), 0);
  const sisaBayar     = Math.max(0, grandTotal - totalDibayar);

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
      metodePembayaran: pembayaranList.length === 1
        ? pembayaranList[0].metode
        : (new Set(pembayaranList.map(p => p.metode)).size === 1 ? pembayaranList[0].metode : 'mixed'),
      unitBisnis: unitBisnis || undefined,
      pembayaranList: pembayaranList.map(p => ({
        metode:      p.metode,
        jumlah:      p.jumlah || grandTotal,
        bankPilihan: p.metode === 'transfer' ? p.bankPilihan : null,
        edcPilihan:  p.metode === 'debit'    ? p.edcPilihan  : null,
        unitBisnis:  p.metode === 'cash'     ? (unitBisnis || null) : null,
      })),
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

            {/* ── Daftar pembayaran (bisa lebih dari satu) ── */}
            {(() => {
              const REKENING = [
                { key: 'bri',     bank: 'BRI',     no: '0262 01 000031 562', sub: 'EDC'  },
                { key: 'mandiri', bank: 'MANDIRI', no: '136 000 4780612',    sub: ''     },
                { key: 'bca',     bank: 'BCA',     no: '155 91 99999',       sub: 'GIRO' },
                { key: 'bni',     bank: 'BNI',     no: '0822 705 836',       sub: ''     },
              ];
              const EDC_OPTIONS = [
                { key: 'bri_edc', bank: 'BRI' },
                { key: 'bca_edc', bank: 'BCA' },
                { key: 'bni_edc', bank: 'BNI' },
              ];
              const KLEDO_BANK: Record<string, string> = { bca: 'BCA Giro', bri: 'BRI EDC', mandiri: 'Mandiri', bni: 'BNI' };
              const KLEDO_EDC:  Record<string, string> = { bca_edc: 'BCA EDC', bri_edc: 'BRI EDC', bni_edc: 'BNI' };
              const METODE_LIST: { value: PembayaranMetode; label: string; icon: any }[] = [
                { value: 'transfer', label: 'Transfer', icon: Smartphone },
                { value: 'cash',     label: 'Cash',     icon: Banknote   },
                { value: 'debit',    label: 'Debit',    icon: CreditCard },
                { value: 'cod',      label: 'COD',      icon: Truck      },
              ];

              return (
                <div className="space-y-3">
                  {pembayaranList.map((entry, idx) => {
                    const updateEntry = (patch: Partial<PembayaranEntry>) =>
                      setPembayaranList(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));

                    return (
                      <div key={entry.id} className="rounded-2xl p-4 space-y-3"
                        style={{ background: 'var(--surface-sunken)', border: '1.5px solid var(--border)' }}>

                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: COLOR }}>
                            Pembayaran {idx + 1}
                          </span>
                          {pembayaranList.length > 1 && (
                            <button type="button"
                              onClick={() => setPembayaranList(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 rounded-lg"
                              style={{ color: 'var(--danger)', background: 'rgba(239,68,68,.08)' }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Pilih metode */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {METODE_LIST.map(opt => {
                            const OptIcon = opt.icon;
                            const isActive = entry.metode === opt.value;
                            return (
                              <button key={opt.value} type="button"
                                onClick={() => updateEntry({ metode: opt.value, bankPilihan: null, edcPilihan: null })}
                                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-center transition-all active:scale-95"
                                style={{ border: `2px solid ${isActive ? COLOR : 'var(--border)'}`, background: isActive ? `${COLOR}15` : 'var(--surface)' }}>
                                <OptIcon className="h-4 w-4" style={{ color: isActive ? COLOR : 'var(--text-muted)' }} />
                                <span className="text-[10px] font-bold leading-tight" style={{ color: isActive ? COLOR : 'var(--text-secondary)' }}>{opt.label}</span>
                                {isActive && <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR }} />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Jumlah */}
                        <div>
                          <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Jumlah (Rp)</label>
                          <input type="number" min={0}
                            className={`${inputCls} text-right`} style={inputSt}
                            placeholder={pembayaranList.length === 1 ? 'Kosongkan = bayar penuh' : '0'}
                            value={entry.jumlah || ''}
                            onChange={e => updateEntry({ jumlah: Math.max(0, Number(e.target.value) || 0) })}
                            onFocus={focusColor} onBlur={blurColor} />
                        </div>

                        {/* Bank selector — jika Transfer */}
                        {entry.metode === 'transfer' && (
                          <div className="space-y-2">
                            <label className="block text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                              Bank Tujuan <span className="font-normal" style={{ color: 'var(--text-muted)' }}>— pilih untuk otomatis lunas di Kledo</span>
                            </label>
                            <select
                              value={entry.bankPilihan ?? ''}
                              onChange={e => updateEntry({ bankPilihan: e.target.value || null })}
                              className="w-full rounded-xl px-3 py-2.5 text-[13px] font-semibold appearance-none cursor-pointer transition-all"
                              style={{
                                border: `2px solid ${entry.bankPilihan ? COLOR : 'var(--border)'}`,
                                background: entry.bankPilihan ? `${COLOR}10` : 'var(--surface)',
                                color: entry.bankPilihan ? COLOR : 'var(--text-secondary)',
                                outline: 'none',
                              }}>
                              <option value="">— Pilih Bank —</option>
                              {REKENING.map(r => (
                                <option key={r.key} value={r.key}>
                                  {r.bank}{r.sub ? ` (${r.sub})` : ''}
                                </option>
                              ))}
                            </select>
                            {entry.bankPilihan && (() => {
                              const r = REKENING.find(x => x.key === entry.bankPilihan);
                              const isCopied = copiedBank === r?.bank;
                              return (
                                <div className="space-y-1">
                                  <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#10B981' }}>
                                    <CheckCircle2 className="h-3 w-3" /> Kledo otomatis <strong>LUNAS</strong> via <strong>{KLEDO_BANK[entry.bankPilihan] ?? entry.bankPilihan.toUpperCase()}</strong>
                                  </p>
                                  {r && (
                                    <button type="button" onClick={() => copyRekening(r.bank, r.no)}
                                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 transition-all active:scale-[.98]"
                                      style={{ background: isCopied ? `${COLOR}0D` : 'var(--surface)', border: `1.5px solid ${isCopied ? `${COLOR}50` : 'var(--border)'}` }}>
                                      <span className="text-[11px] font-bold w-16 flex-shrink-0" style={{ color: COLOR }}>{r.bank}</span>
                                      <span className="text-[12px] font-semibold flex-1 text-left" style={{ color: 'var(--text-primary)', letterSpacing: '.03em' }}>{r.no}</span>
                                      {isCopied ? <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: COLOR }} /> : <Copy className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* EDC selector — jika Debit */}
                        {entry.metode === 'debit' && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>Mesin EDC</p>
                            <div className="grid grid-cols-3 gap-2">
                              {EDC_OPTIONS.map(edc => {
                                const isSelected = entry.edcPilihan === edc.key;
                                return (
                                  <button key={edc.key} type="button"
                                    onClick={() => updateEntry({ edcPilihan: isSelected ? null : edc.key })}
                                    className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-center transition-all active:scale-95"
                                    style={{ border: `2px solid ${isSelected ? COLOR : 'var(--border)'}`, background: isSelected ? `${COLOR}15` : 'var(--surface)' }}>
                                    <CreditCard className="h-3.5 w-3.5" style={{ color: isSelected ? COLOR : 'var(--text-muted)' }} />
                                    <span className="text-[11px] font-bold" style={{ color: isSelected ? COLOR : 'var(--text-secondary)' }}>{edc.bank}</span>
                                    <span className="text-[9px]" style={{ color: isSelected ? COLOR : 'var(--text-muted)' }}>EDC</span>
                                    {isSelected && <span className="w-1 h-1 rounded-full" style={{ background: COLOR }} />}
                                  </button>
                                );
                              })}
                            </div>
                            {entry.edcPilihan && (
                              <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#10B981' }}>
                                <CheckCircle2 className="h-3 w-3" /> Kledo otomatis <strong>LUNAS</strong> via <strong>{KLEDO_EDC[entry.edcPilihan] ?? entry.edcPilihan.toUpperCase()}</strong>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Tambah metode pembayaran */}
                  <button type="button"
                    onClick={() => {
                      const sisa = Math.max(0, grandTotal - pembayaranList.reduce((s, p) => s + (p.jumlah || 0), 0));
                      setPembayaranList(prev => [...prev, { ...newPembayaran(), jumlah: sisa }]);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[.98]"
                    style={{ border: `2px dashed ${COLOR}50`, color: COLOR, background: `${COLOR}08` }}>
                    <Plus className="h-4 w-4" /> Tambah Metode Pembayaran
                  </button>

                  {/* Ringkasan alokasi */}
                  {(pembayaranList.length > 1 || (pembayaranList[0]?.jumlah || 0) > 0) && (() => {
                    const lebih = Math.max(0, totalDibayar - grandTotal);
                    const isLunas = sisaBayar === 0 && lebih === 0;
                    return (
                      <div className="rounded-xl px-4 py-3 space-y-1.5"
                        style={{
                          background: isLunas ? 'rgba(16,185,129,.08)' : lebih > 0 ? 'rgba(239,68,68,.06)' : 'rgba(245,158,11,.08)',
                          border: `1.5px solid ${isLunas ? 'rgba(16,185,129,.3)' : lebih > 0 ? 'rgba(239,68,68,.25)' : 'rgba(245,158,11,.3)'}`,
                        }}>
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-secondary)' }}>Total dialokasikan</span>
                          <span className="font-bold" style={{ color: isLunas ? '#10B981' : 'var(--text-primary)' }}>{fmtRp(totalDibayar)}</span>
                        </div>
                        {sisaBayar > 0 && (
                          <div className="flex justify-between text-sm">
                            <span style={{ color: '#92400E' }}>Sisa belum dialokasikan</span>
                            <span className="font-bold" style={{ color: '#F59E0B' }}>{fmtRp(sisaBayar)}</span>
                          </div>
                        )}
                        {lebih > 0 && (
                          <div className="flex justify-between text-sm">
                            <span style={{ color: '#991B1B' }}>Kelebihan alokasi</span>
                            <span className="font-bold" style={{ color: '#EF4444' }}>{fmtRp(lebih)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

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

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingCart, Plus, X, Trash2, Package, ArrowLeft,
  Tag, Percent, Truck, Link2, CheckCircle2, AlertCircle,
  CreditCard, Banknote, Smartphone, Wallet, Copy, Check, ChevronDown,
  ImagePlus,
  Camera,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { api } from '../../lib/api';
import CustomerSearchDropdown, { type CustomerOption } from '../ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '../ui/ProductSearchDropdown';
import SalesDropdown from '../ui/SalesDropdown';
import { BankLogo } from '../ui/BankLogo';

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
    <label className="modal-label block font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
      {children}
      {optional && <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>(opsional)</span>}
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
  mode = 'modal',
}: {
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'modal' | 'page';
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
  interface PembayaranEntry { id: string; metode: PembayaranMetode; jumlah: number; bankPilihan: string | null; edcPilihan: string | null; autoFill: boolean; buktiTransfer: File | null; buktiPreviewUrl: string | null; }
  const newPembayaran = (m: PembayaranMetode = 'transfer'): PembayaranEntry => ({ id: Math.random().toString(36).slice(2), metode: m, jumlah: 0, bankPilihan: null, edcPilihan: null, autoFill: true, buktiTransfer: null, buktiPreviewUrl: null });
  const [pembayaranList, setPembayaranList]   = useState<PembayaranEntry[]>([newPembayaran()]);
  const [copiedBank, setCopiedBank]           = useState<string | null>(null);
  const [openBankDrop, setOpenBankDrop]       = useState<string | null>(null);

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

  /* Bagi rata sisa (grandTotal - total manual) ke semua entri yang masih auto-fill */
  const redistributeAuto = (list: PembayaranEntry[], total: number): PembayaranEntry[] => {
    const totalManual = list.filter(p => !p.autoFill).reduce((s, p) => s + (p.jumlah || 0), 0);
    const autoEntries = list.filter(p => p.autoFill);
    if (autoEntries.length === 0) return list;
    const sisa = Math.max(0, total - totalManual);
    const share = Math.floor(sisa / autoEntries.length);
    let seen = 0;
    return list.map(p => {
      if (!p.autoFill) return p;
      seen++;
      const isLast = seen === autoEntries.length;
      return { ...p, jumlah: isLast ? sisa - share * (autoEntries.length - 1) : share };
    });
  };

  /* Auto-fill jumlah pembayaran saat grandTotal atau jumlah pembayaran manual berubah */
  useEffect(() => {
    setPembayaranList(prev => redistributeAuto(prev, grandTotal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal, pembayaranList.filter(p => !p.autoFill).map(p => p.jumlah).join(',')]);

  const handleCustomerSelect = (c: CustomerOption) => {
    setNamaCustomer(c.name);
    if (c.phone && !noHp) setNoHp(c.phone);
    // Tanpa field manual, alamat harus mengikuti pelanggan yang dipilih (tidak boleh tertinggal dari pelanggan sebelumnya)
    setAlamat(c.address ?? '');
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

    /* Helper: upload bukti transfer ke Kledo (dipanggil di semua success path) */
    const uploadBuktiIfAvailable = async (kledoInvoiceId: number | string | null | undefined) => {
      if (!kledoInvoiceId) return;
      const transferEntries = pembayaranList.filter(p => p.metode === 'transfer' && p.buktiTransfer);
      for (const entry of transferEntries) {
        if (!entry.buktiTransfer) continue;
        try {
          const fd = new FormData();
          fd.append('invoiceId', String(kledoInvoiceId));
          fd.append('file', entry.buktiTransfer, entry.buktiTransfer.name);
          const token = typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') ?? '' : '';
          const r = await fetch('/api/kledo/invoice-attachment', {
            method: 'POST',
            body: fd,
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await r.json().catch(() => ({}));
          if (d.ok) {
            console.log('[bukti-transfer] Upload OK ke Kledo invoice', kledoInvoiceId);
          } else {
            console.warn('[bukti-transfer] Upload gagal:', d.error);
          }
        } catch (e: any) {
          console.warn('[bukti-transfer] Upload exception:', e.message);
        }
      }
    };

    /* Helper: kirim foto bukti transfer ke WA grup payment + konsumen via Fonnte */
    const sendWaBuktiIfAvailable = async (soNumber: string | null | undefined) => {
      const transferEntries = pembayaranList.filter(p => p.metode === 'transfer' && p.buktiTransfer);
      if (transferEntries.length === 0) return;
      const token = typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') ?? '' : '';
      for (const entry of transferEntries) {
        if (!entry.buktiTransfer) continue;
        try {
          const fd = new FormData();
          fd.append('file', entry.buktiTransfer, entry.buktiTransfer.name);
          fd.append('soNumber', soNumber ?? '-');
          fd.append('namaCustomer', namaCustomer);
          fd.append('noHp', noHp ?? '');
          fd.append('totalHarga', String(grandTotal));
          fd.append('bankPilihan', entry.bankPilihan ?? '');
          fd.append('salesName', salesName ?? '');
          const r = await fetch('/api/wa/send-bukti', {
            method: 'POST',
            body: fd,
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await r.json().catch(() => ({}));
          if (d.ok) {
            console.log('[bukti-wa] Foto bukti transfer terkirim ke WA');
          } else {
            console.warn('[bukti-wa] Gagal kirim WA:', d.error ?? d.results);
          }
        } catch (e: any) {
          console.warn('[bukti-wa] Exception:', e.message);
        }
      }
    };

    /* ── RETRY MODE: order sudah tersimpan lokal, cukup kirim ulang ke Kledo ── */
    if (savedOrderId !== null) {
      try {
        const res = await api.post('/sales/orders/kledo-retry', { orderId: savedOrderId });
        const kledoResult = (res.data as any)?.kledo;
        if (kledoResult?.ok) {
          setKledoStatus('ok');
          // Upload bukti transfer jika retry berhasil dan ada invoiceId
          uploadBuktiIfAvailable(kledoResult?.invoiceId).catch(() => {});
          // Kirim foto bukti ke WA (soNumber tidak tersedia saat retry — pakai orderId)
          sendWaBuktiIfAvailable(`ORD-${savedOrderId}`).catch(() => {});
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

      const resSoNumber: string | null =
        (res.data as any)?.soNumber ?? (res.data as any)?.data?.soNumber ?? null;

      if (kledoResult !== undefined) {
        /* Backend versi lama yang memang kembalikan { kledo } */
        if (kledoResult?.ok) {
          setKledoStatus('ok');
          uploadBuktiIfAvailable(kledoResult?.invoiceId).catch(() => {});
          sendWaBuktiIfAvailable(resSoNumber).catch(() => {});
          // Cek apakah auto-lunas berhasil — tampilkan warning jika tidak
          if (!kledoResult?.paid && kledoResult?.paidError) {
            setError(`Invoice masuk Kledo ✓ — Lunas GAGAL: ${kledoResult.paidError}. Tandai manual di Kledo atau cek konfigurasi akun di Integrasi > Kledo.`);
          }
          onSuccess();
        } else {
          setSavedOrderId(orderId);
          setKledoStatus('error');
          const kledoErr = kledoResult?.error ?? 'Kledo tidak merespons';
          setError(`Order tersimpan ✓ — Kledo: ${kledoErr}. Klik "Coba Ulang" untuk kirim ulang.`);
        }
      } else {
        /* Backend mengembalikan order langsung — Kledo dipush async di server.
           Coba ambil kledoInvoiceId dari data order jika ada. */
        setKledoStatus('ok');
        const asyncInvoiceId = (res.data as any)?.data?.kledoInvoiceId ?? (res.data as any)?.kledoInvoiceId;
        uploadBuktiIfAvailable(asyncInvoiceId).catch(() => {});
        sendWaBuktiIfAvailable(resSoNumber).catch(() => {});
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

  const sharedStyle = (
    <style>{`
      .order-modal-root {
        font-size: clamp(13px, 3.8vw, 15px);
      }
      @media (min-width: 640px) {
        .order-modal-root { font-size: 14px; }
      }
      .order-modal-root .modal-label    { font-size: clamp(10px, 2.8vw, 12px); }
      .order-modal-root .modal-section  { font-size: clamp(10px, 2.6vw, 11px); }
      .order-modal-root .modal-heading  { font-size: clamp(14px, 4.2vw, 16px); }
      .order-modal-root .modal-subtext  { font-size: clamp(10px, 2.8vw, 12px); }
      .order-modal-root .modal-input    { font-size: clamp(13px, 3.5vw, 14px); }
      .order-modal-root .modal-badge    { font-size: clamp(9px,  2.4vw, 10px); }
      .order-modal-root .modal-btn-text { font-size: clamp(12px, 3.2vw, 14px); }
    `}</style>
  );

  const innerBox = (
    <div
      className={`order-modal-root flex flex-col ${mode === 'page' ? 'w-full' : 'rounded-t-2xl sm:rounded-2xl w-full'}`}
      style={{
        background: 'var(--surface)',
        maxWidth: mode === 'page' ? 860 : 820,
        maxHeight: mode === 'page' ? 'none' : '92dvh',
        height: mode === 'page' ? 'auto' : 'auto',
        boxShadow: mode === 'page' ? 'none' : 'var(--shadow-lg)',
        margin: mode === 'page' ? '0 auto' : undefined,
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 sm:px-7 py-4 sm:py-5"
        style={{ borderBottom: mode === 'page' ? 'none' : '1.5px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          {mode === 'page' ? (
            <button onClick={onClose} className="p-2 rounded-xl transition-colors mr-1"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${COLOR}18` }}>
            <ShoppingCart className="h-5 w-5" style={{ color: COLOR }} />
          </div>
          <div>
            <h2 className="modal-heading font-bold" style={{ color: 'var(--text-primary)' }}>Buat Order Baru</h2>
            <p className="modal-subtext" style={{ color: 'var(--text-muted)' }}>
              Tersimpan otomatis ke ERP + Kledo
              {kledoStatus === 'syncing' && ' · Mengirim ke Kledo…'}
              {kledoStatus === 'ok' && ' ✓ Tersinkron ke Kledo'}
              {kledoStatus === 'error' && ' · Kledo tidak terjangkau'}
            </p>
          </div>
        </div>
        {mode === 'modal' && (
          <button onClick={onClose} className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="h-4 w-4" />
          </button>
        )}
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
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(140,87,255,.1)', color: '#8C57FF' }}>
                          <Link2 className="h-2.5 w-2.5" /> Kledo
                        </span>
                      )}
                      {(item.kasUnit === 'elektronik' || (!item.kasUnit && item.nama && detectKategori(item.nama) === 'elektronik')) && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#8C57FF12', color: '#8C57FF' }}>
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
                      setPembayaranList(prev => redistributeAuto(prev.map((p, i) => i === idx ? { ...p, ...patch } : p), grandTotal));

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
                              onClick={() => setPembayaranList(prev => redistributeAuto(prev.filter((_, i) => i !== idx), grandTotal))}
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

                        {/* Bank selector — jika Transfer (di atas Jumlah) */}
                        {entry.metode === 'transfer' && (() => {
                          const isDropOpen = openBankDrop === entry.id;
                          const selectedRek = REKENING.find(x => x.key === entry.bankPilihan);
                          return (
                            <div className="space-y-2">
                              <label className="block text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                                Bank Tujuan
                              </label>

                              {/* Dropdown bank */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenBankDrop(isDropOpen ? null : entry.id)}
                                  className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all active:scale-[.98]"
                                  style={{
                                    border: `1.5px solid ${entry.bankPilihan ? COLOR : isDropOpen ? COLOR : 'var(--border)'}`,
                                    background: entry.bankPilihan ? `${COLOR}0D` : isDropOpen ? `${COLOR}08` : 'var(--surface)',
                                    boxShadow: isDropOpen ? `0 0 0 3px ${COLOR}18` : 'none',
                                  }}>
                                  <span className="text-[13px] font-semibold" style={{ color: entry.bankPilihan ? COLOR : 'var(--text-muted)' }}>
                                    {selectedRek ? selectedRek.bank : '— Pilih Bank —'}
                                  </span>
                                  <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform"
                                    style={{ color: entry.bankPilihan ? COLOR : 'var(--text-muted)', transform: isDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>

                                {isDropOpen && (
                                  <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden"
                                    style={{ border: `1.5px solid ${COLOR}40`, background: 'var(--surface)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
                                    {REKENING.map((r, ri) => {
                                      const isSelected = entry.bankPilihan === r.key;
                                      return (
                                        <button key={r.key} type="button"
                                          onClick={() => { updateEntry({ bankPilihan: isSelected ? null : r.key }); setOpenBankDrop(null); }}
                                          className="w-full flex items-center justify-between px-4 py-3 transition-all active:scale-[.99]"
                                          style={{ background: isSelected ? `${COLOR}12` : 'transparent', borderTop: ri > 0 ? '1px solid var(--border)' : 'none' }}>
                                          <div className="flex items-center gap-2.5">
                                            <BankLogo bank={r.bank} size={32} />
                                            <div className="text-left">
                                              <p className="text-[13px] font-semibold leading-tight" style={{ color: isSelected ? COLOR : 'var(--text-primary)' }}>{r.bank}</p>
                                              <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{r.no}</p>
                                            </div>
                                          </div>
                                          {isSelected && <Check className="h-4 w-4 flex-shrink-0" style={{ color: COLOR }} />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* No rekening terpilih — bisa disalin */}
                              {selectedRek && (
                                <button type="button" onClick={() => copyRekening(selectedRek.bank, selectedRek.no)}
                                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all active:scale-[.98]"
                                  style={{ background: copiedBank === selectedRek.bank ? `${COLOR}0D` : 'var(--surface-sunken)', border: `1.5px solid ${copiedBank === selectedRek.bank ? `${COLOR}60` : 'var(--border)'}` }}>
                                  <span className="text-[11px] font-bold w-16 flex-shrink-0" style={{ color: COLOR }}>{selectedRek.bank}</span>
                                  <span className="text-[12px] font-semibold flex-1 text-left font-mono" style={{ color: 'var(--text-primary)', letterSpacing: '.03em' }}>{selectedRek.no}</span>
                                  {copiedBank === selectedRek.bank
                                    ? <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: COLOR }} />
                                    : <Copy className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
                                </button>
                              )}

                              {/* Upload bukti transfer */}
                              <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                                  Bukti Transfer <span className="font-normal" style={{ color: 'var(--text-muted)' }}>— foto/screenshot dikirim ke Kledo</span>
                                </label>

                                {entry.buktiTransfer && entry.buktiPreviewUrl ? (
                                  /* Preview gambar yang sudah dipilih */
                                  <div className="relative rounded-xl overflow-hidden"
                                    style={{ border: `1.5px solid ${COLOR}50` }}>
                                    <img
                                      src={entry.buktiPreviewUrl}
                                      alt="Bukti Transfer"
                                      className="w-full object-cover"
                                      style={{ maxHeight: 180 }}
                                    />
                                    <div className="absolute inset-0 flex items-end p-2 justify-between"
                                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 60%)' }}>
                                      <span className="text-white text-[10px] font-semibold truncate max-w-[70%]">
                                        {entry.buktiTransfer.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (entry.buktiPreviewUrl) URL.revokeObjectURL(entry.buktiPreviewUrl);
                                          updateEntry({ buktiTransfer: null, buktiPreviewUrl: null });
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold"
                                        style={{ background: 'rgba(239,68,68,.85)' }}>
                                        <X className="h-3 w-3" /> Hapus
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Tombol pilih / ambil gambar */
                                  <div className="grid grid-cols-2 gap-2">
                                    {/* Pilih dari galeri */}
                                    <label
                                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl cursor-pointer transition-all active:scale-[.98]"
                                      style={{
                                        border: `2px dashed var(--border)`,
                                        background: 'var(--surface-sunken)',
                                      }}
                                      onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = COLOR;
                                        (e.currentTarget as HTMLElement).style.background = `${COLOR}08`;
                                      }}
                                      onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                                        (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)';
                                      }}>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => {
                                          const f = e.target.files?.[0] ?? null;
                                          if (entry.buktiPreviewUrl) URL.revokeObjectURL(entry.buktiPreviewUrl);
                                          const previewUrl = f ? URL.createObjectURL(f) : null;
                                          updateEntry({ buktiTransfer: f, buktiPreviewUrl: previewUrl });
                                          e.target.value = '';
                                        }}
                                      />
                                      <ImagePlus className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                                      <span className="text-[11px] font-semibold text-center" style={{ color: 'var(--text-muted)' }}>
                                        Pilih dari Galeri
                                      </span>
                                    </label>

                                    {/* Ambil foto langsung */}
                                    <label
                                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl cursor-pointer transition-all active:scale-[.98]"
                                      style={{
                                        border: `2px dashed ${COLOR}60`,
                                        background: `${COLOR}08`,
                                      }}
                                      onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = COLOR;
                                        (e.currentTarget as HTMLElement).style.background = `${COLOR}18`;
                                      }}
                                      onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = `${COLOR}60`;
                                        (e.currentTarget as HTMLElement).style.background = `${COLOR}08`;
                                      }}>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={e => {
                                          const f = e.target.files?.[0] ?? null;
                                          if (entry.buktiPreviewUrl) URL.revokeObjectURL(entry.buktiPreviewUrl);
                                          const previewUrl = f ? URL.createObjectURL(f) : null;
                                          updateEntry({ buktiTransfer: f, buktiPreviewUrl: previewUrl });
                                          e.target.value = '';
                                        }}
                                      />
                                      <Camera className="h-5 w-5" style={{ color: COLOR }} />
                                      <span className="text-[11px] font-semibold text-center" style={{ color: COLOR }}>
                                        Ambil Foto
                                      </span>
                                    </label>

                                    <span className="col-span-2 text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                                      JPG, PNG, WEBP — maks. 10 MB
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Bank selector — jika Debit */}
                        {entry.metode === 'debit' && (() => {
                          const isDropOpen = openBankDrop === `edc-${entry.id}`;
                          const selectedEdc = EDC_OPTIONS.find(x => x.key === entry.edcPilihan);
                          return (
                            <div className="space-y-2">
                              <label className="block text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                                Bank Debit
                              </label>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenBankDrop(isDropOpen ? null : `edc-${entry.id}`)}
                                  className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all active:scale-[.98]"
                                  style={{
                                    border: `1.5px solid ${entry.edcPilihan ? COLOR : isDropOpen ? COLOR : 'var(--border)'}`,
                                    background: entry.edcPilihan ? `${COLOR}0D` : isDropOpen ? `${COLOR}08` : 'var(--surface)',
                                    boxShadow: isDropOpen ? `0 0 0 3px ${COLOR}18` : 'none',
                                  }}>
                                  <span className="text-[13px] font-semibold" style={{ color: entry.edcPilihan ? COLOR : 'var(--text-muted)' }}>
                                    {selectedEdc ? selectedEdc.bank : '— Pilih Bank —'}
                                  </span>
                                  <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform"
                                    style={{ color: entry.edcPilihan ? COLOR : 'var(--text-muted)', transform: isDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>

                                {isDropOpen && (
                                  <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden"
                                    style={{ border: `1.5px solid ${COLOR}40`, background: 'var(--surface)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
                                    {EDC_OPTIONS.map((edc, ri) => {
                                      const isSelected = entry.edcPilihan === edc.key;
                                      return (
                                        <button key={edc.key} type="button"
                                          onClick={() => { updateEntry({ edcPilihan: isSelected ? null : edc.key }); setOpenBankDrop(null); }}
                                          className="w-full flex items-center justify-between px-4 py-3 transition-all active:scale-[.99]"
                                          style={{ background: isSelected ? `${COLOR}12` : 'transparent', borderTop: ri > 0 ? '1px solid var(--border)' : 'none' }}>
                                          <div className="flex items-center gap-2.5">
                                            <BankLogo bank={edc.bank} size={32} />
                                            <p className="text-[13px] font-semibold leading-tight" style={{ color: isSelected ? COLOR : 'var(--text-primary)' }}>{edc.bank}</p>
                                          </div>
                                          {isSelected && <Check className="h-4 w-4 flex-shrink-0" style={{ color: COLOR }} />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Jumlah — selalu di bawah bank selector */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>Jumlah (Rp)</label>
                            {entry.autoFill && grandTotal > 0 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${COLOR}15`, color: COLOR }}>
                                ✦ Otomatis
                              </span>
                            )}
                            {!entry.autoFill && (
                              <button type="button"
                                onClick={() => updateEntry({ jumlah: 0, autoFill: true })}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-all active:scale-95"
                                style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                Reset otomatis
                              </button>
                            )}
                          </div>
                          <input type="number" min={0}
                            className={`${inputCls} text-right`} style={inputSt}
                            placeholder="0"
                            value={entry.jumlah || ''}
                            onChange={e => updateEntry({ jumlah: Math.max(0, Number(e.target.value) || 0), autoFill: false })}
                            onFocus={focusColor} onBlur={blurColor} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Tambah metode pembayaran */}
                  <button type="button"
                    onClick={() => {
                      setPembayaranList(prev => redistributeAuto([...prev, newPembayaran()], grandTotal));
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
        <div className="flex flex-col gap-2 px-4 sm:px-7 py-4 sm:py-5"
          style={{
            borderTop: '1.5px solid var(--border)', flexShrink: 0,
            ...(mode === 'page' ? { position: 'sticky', bottom: 0, background: 'var(--surface)', zIndex: 10 } : {}),
          }}>
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
              className="modal-btn-text px-5 py-2.5 rounded-xl font-semibold transition-colors"
              style={{ color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {mode === 'page' ? 'Kembali' : 'Batal'}
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="modal-btn-text px-7 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-60"
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
  );

  /* ── Page mode: render langsung tanpa portal ── */
  if (mode === 'page') {
    return (
      <>
        {sharedStyle}
        {innerBox}
      </>
    );
  }

  /* ── Modal mode: render dengan overlay + portal ── */
  const modalContent = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', zIndex: 9999 }}
    >
      {sharedStyle}
      {innerBox}
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

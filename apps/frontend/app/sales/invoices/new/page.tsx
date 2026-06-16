'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { api } from '@/lib/api';
import {
  ArrowLeft, Plus, Trash2, Tag, Percent, Truck,
  Link2, CheckCircle2, AlertCircle, Package,
} from 'lucide-react';
import CustomerSearchDropdown, { type CustomerOption } from '../../../../components/ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '../../../../components/ui/ProductSearchDropdown';
import SalesDropdown from '../../../../components/ui/SalesDropdown';

const C = '#00ACC1';
const today = () => new Date().toISOString().slice(0, 10);

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors';
const inputSt: React.CSSProperties = {
  border: '1.5px solid var(--border)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--surface)',
};
const focusBorder = (e: React.FocusEvent<any>) => (e.target.style.borderColor = C);
const blurBorder  = (e: React.FocusEvent<any>) => (e.target.style.borderColor = 'var(--border)');

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {optional && <span className="ml-1 font-normal text-[11px]" style={{ color: 'var(--text-muted)' }}>(opsional)</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 space-y-4"
      style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'visible' }}>
      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {children}
    </div>
  );
}

interface InvoiceItem {
  id: number;
  productId?: string;
  kledoProductId?: string | null;
  nama: string;
  qty: number;
  harga: number;
  diskonItem: number;
  subtotal: number;
  unit?: string;
}

const emptyItem = (): InvoiceItem => ({ id: Date.now(), nama: '', qty: 1, harga: 0, diskonItem: 0, subtotal: 0 });
const calcSub = (it: InvoiceItem) => Math.max(0, it.qty * it.harga - it.diskonItem);

export default function NewInvoicePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [customerName, setCustomerName]     = useState('');
  const [customerId, setCustomerId]         = useState('');
  const [kledoContactId, setKledoContactId] = useState('');
  const [resolvingCustomer, setResolvingCustomer] = useState(false);

  const [salesName, setSalesName]     = useState(user?.name ?? '');
  const [tanggal]                     = useState(today());
  const [dueDate, setDueDate]         = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes]             = useState('');
  const [diskonTotal, setDiskonTotal] = useState(0);
  const [pajak, setPajak]             = useState(0);
  const [ongkir, setOngkir]           = useState(0);

  const [items, setItems]       = useState<InvoiceItem[]>([emptyItem()]);
  const [loading, setLoading]   = useState(false);
  const [kledoStatus, setKledoStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle');
  const [kledoError, setKledoError]   = useState('');
  const [error, setError]       = useState('');

  const [waPhone, setWaPhone]   = useState('087828609655');
  const [sendWa, setSendWa]     = useState(true);
  const [waStatus, setWaStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [waError, setWaError]   = useState('');

  const subtotalBruto = items.reduce((s, it) => s + it.subtotal, 0);
  const grandTotal    = Math.max(0, subtotalBruto - diskonTotal + pajak + ongkir);
  const fmtRp = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  const handleCustomerSelect = async (c: CustomerOption) => {
    if (c.source === 'local') {
      setCustomerId(c.id);
      setCustomerName(c.name);
      if ((c as any).kledoId) setKledoContactId((c as any).kledoId);
      return;
    }
    setResolvingCustomer(true);
    try {
      const kledoId = c.id.replace('kledo-', '');
      const res = await api.post('/customers/find-or-create', {
        name: c.name, phone: c.phone ?? undefined, email: c.email ?? undefined, kledoId,
      });
      setCustomerId(res.data.id);
      setKledoContactId(kledoId);
      setCustomerName(c.name);
    } catch { setError('Gagal menyimpan kontak Kledo.'); }
    finally { setResolvingCustomer(false); }
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (['qty', 'harga', 'diskonItem'].includes(field as string))
        updated.subtotal = calcSub(updated);
      return updated;
    }));
  };

  const handleProductSelect = (itemId: number, p: ProductOption) => {
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const updated = { ...it, nama: p.name, productId: p.id, kledoProductId: p.kledoProductId ?? null, harga: p.hargaJual, unit: p.unit?.name, diskonItem: 0 };
      updated.subtotal = calcSub(updated);
      return updated;
    }));
  };

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { setError('Nama pelanggan harus diisi.'); return; }
    if (items.some(it => !it.nama)) { setError('Semua produk harus diisi.'); return; }
    setLoading(true); setError('');

    try {
      let resolvedId = customerId;
      if (!resolvedId) {
        const res = await api.post('/customers/find-or-create', { name: customerName.trim() });
        resolvedId = res.data.id;
      }

      const res = await api.post('/invoices', {
        customerId: resolvedId,
        salesName: salesName.trim() || undefined,
        tanggal,
        notes: notes.trim() || undefined,
        diskon: diskonTotal || undefined,
        pajak: pajak || undefined,
        ongkir: ongkir || undefined,
        subtotal: subtotalBruto,
        grandTotal,
        items: items.map(it => ({
          nama: it.nama, qty: it.qty, harga: it.harga,
          diskon: it.diskonItem || undefined, subtotal: it.subtotal,
          productId: it.productId, kledoProductId: it.kledoProductId ?? undefined,
        })),
      });

      const savedInvoice = res.data?.data ?? res.data ?? {};
      const refNumber = savedInvoice.nomorInvoice ?? savedInvoice.invoiceNumber ?? savedInvoice.nomor ?? savedInvoice.ref_number ?? undefined;

      setKledoStatus('syncing'); setKledoError('');
      const invoicePayload = {
        trans_date: tanggal,
        due_date: dueDate,
        ref_number: refNumber,
        memo: notes.trim() || undefined,
        contact_id: kledoContactId ? Number(kledoContactId) : undefined,
        contact_name: customerName.trim(),
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
      };

      let kledoOk = false;
      try {
        await api.post('/kledo/invoices', invoicePayload);
        kledoOk = true;
      } catch {}

      if (!kledoOk) {
        try {
          const kledoLocal = JSON.parse(localStorage.getItem('erp_intg_kledo') ?? '{}');
          if (kledoLocal.token) {
            const dr = await fetch('/api/direct/kledo-invoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: kledoLocal.token, baseUrl: kledoLocal.baseUrl, invoice: invoicePayload }),
            });
            const dd = await dr.json();
            if (dr.ok && dd.success) kledoOk = true;
            else setKledoError(dd.message ?? 'Gagal kirim ke Kledo');
          } else {
            setKledoError('Token Kledo belum diatur. Isi di Settings → API Integration → Kledo.');
          }
        } catch (e: any) {
          setKledoError(e?.message ?? 'Gagal kirim ke Kledo');
        }
      }

      setKledoStatus(kledoOk ? 'ok' : 'error');

      if (sendWa && waPhone.trim()) {
        setWaStatus('sending'); setWaError('');
        try {
          const fonnteConfig = JSON.parse(localStorage.getItem('erp_intg_fonnte') ?? '{}');
          const fonnteToken = fonnteConfig.token ?? '';
          if (!fonnteToken) {
            setWaError('Token Fonnte belum diatur. Isi di Settings → WA Gateway.');
            setWaStatus('error');
          } else {
            const dueFmt = new Date(dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const amtFmt = `Rp ${grandTotal.toLocaleString('id-ID')}`;
            const waMsg = `Halo ${customerName}, invoice ${refNumber ?? 'baru'} senilai ${amtFmt} jatuh tempo pada ${dueFmt}. Mohon segera melakukan pembayaran. Terima kasih.`;
            const wr = await fetch('/api/direct/whatsapp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: fonnteToken, target: waPhone.trim(), message: waMsg }),
            });
            const wd = await wr.json();
            if (wr.ok && wd.status !== false) {
              setWaStatus('ok');
            } else {
              setWaError(wd.reason ?? wd.message ?? 'Gagal kirim WA');
              setWaStatus('error');
            }
          }
        } catch (e: any) {
          setWaError(e?.message ?? 'Gagal kirim WA');
          setWaStatus('error');
        }
      }

      router.push(`/sales/invoices/${savedInvoice.id ?? ''}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Terjadi kesalahan.');
      setKledoStatus('idle');
    } finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl transition-colors"
            style={{ border: '1.5px solid var(--border)', color: C }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Buat Invoice Baru</h1>
            <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Link2 className="h-3.5 w-3.5" /> Tersinkron otomatis ke Kledo
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-3 text-sm flex items-center gap-2"
            style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1.5px solid rgba(239,68,68,.25)' }}>
            ⚠ {error}
          </div>
        )}
        {kledoStatus !== 'idle' && (
          <div className="rounded-xl p-3 text-sm"
            style={{
              background: kledoStatus === 'ok' ? 'var(--success-light)' : kledoStatus === 'error' ? 'var(--danger-light)' : `${C}0A`,
              border: `1.5px solid ${kledoStatus === 'ok' ? 'rgba(16,185,129,.25)' : kledoStatus === 'error' ? 'rgba(239,68,68,.25)' : `${C}25`}`,
              color: kledoStatus === 'ok' ? 'var(--success)' : kledoStatus === 'error' ? 'var(--danger)' : C,
            }}>
            <div className="flex items-center gap-2">
              {kledoStatus === 'syncing' && <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: `${C}40`, borderTopColor: C }} />}
              {kledoStatus === 'ok' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
              {kledoStatus === 'error' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span>
                {kledoStatus === 'syncing' && 'Mengirim invoice ke Kledo…'}
                {kledoStatus === 'ok' && 'Invoice berhasil dikirim ke Kledo ✓'}
                {kledoStatus === 'error' && 'Invoice tersimpan di ERP, gagal kirim ke Kledo'}
              </span>
            </div>
            {kledoStatus === 'error' && kledoError && (
              <p className="mt-1.5 ml-6 text-xs opacity-80 font-mono break-all">{kledoError}</p>
            )}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">

          {/* ── Info Pelanggan ── */}
          <Section title="Info Pelanggan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Pelanggan">
                  <CustomerSearchDropdown
                    value={customerName}
                    onChange={v => { setCustomerName(v); setCustomerId(''); setKledoContactId(''); }}
                    onSelect={handleCustomerSelect}
                    placeholder="Ketik nama pelanggan atau cari dari Kledo..."
                    accentColor={C}
                    required
                  />
                  {resolvingCustomer && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: C }}>
                      <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: `${C}40`, borderTopColor: C }} />
                      Menyimpan kontak Kledo…
                    </div>
                  )}
                  {(customerId || kledoContactId) && !resolvingCustomer && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full w-fit font-semibold"
                      style={{ backgroundColor: `${C}12`, color: C }}>
                      <Link2 className="h-2.5 w-2.5" /> Pelanggan terhubung ke Kledo
                    </div>
                  )}
                </Field>
              </div>
              <Field label="Nama Sales" optional>
                <SalesDropdown value={salesName} onChange={setSalesName} accentColor={C} placeholder="Pilih atau ketik nama sales..." />
              </Field>
            </div>
          </Section>

          {/* ── Info Transaksi ── */}
          <Section title="Info Transaksi">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tanggal Invoice">
                <div className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface-sunken)' }}>
                  {tanggal}
                </div>
              </Field>
              <Field label="Jatuh Tempo">
                <input
                  type="date"
                  className={inputCls}
                  style={inputSt}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  min={tanggal}
                />
              </Field>
            </div>
            <Field label="Catatan / Pesan" optional>
              <input className={inputCls} style={inputSt} placeholder="Catatan atau pesan untuk order ini..."
                value={notes} onChange={e => setNotes(e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
            </Field>
          </Section>

          {/* ── Item Invoice ── */}
          <Section title="Item Invoice">
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={it.id} className="rounded-2xl p-4 space-y-3"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--surface-sunken)' }}>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ background: C }}>
                        {idx + 1}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Produk #{idx + 1}</span>
                      {it.unit && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${C}14`, color: C }}>{it.unit}</span>
                      )}
                      {it.kledoProductId && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(99,102,241,.1)', color: '#6366F1' }}>
                          <Link2 className="h-2.5 w-2.5" /> Kledo
                        </span>
                      )}
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(it.id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ color: 'var(--danger)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-light)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Package className="h-3 w-3 inline mr-1" style={{ color: C }} />
                      Nama Produk / Jasa <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <ProductSearchDropdown
                      value={it.nama}
                      onChange={nama => updateItem(it.id, 'nama', nama)}
                      onSelect={prod => handleProductSelect(it.id, prod)}
                      placeholder="Ketik nama produk, jasa, atau SKU..."
                      accentColor={C}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Qty</label>
                      <input type="number" className={`${inputCls} text-center`} style={inputSt} min={1}
                        value={it.qty} onChange={e => updateItem(it.id, 'qty', Number(e.target.value) || 1)}
                        onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Harga Satuan (Rp)</label>
                      <input type="number" className={`${inputCls} text-right`} style={inputSt} min={0}
                        value={it.harga} onChange={e => updateItem(it.id, 'harga', Number(e.target.value) || 0)}
                        onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Tag className="h-3 w-3 inline mr-0.5" style={{ color: 'var(--text-muted)' }} /> Diskon Item (Rp)
                      </label>
                      <input type="number" className={`${inputCls} text-right`} style={inputSt} min={0}
                        value={it.diskonItem || ''} placeholder="0"
                        onChange={e => updateItem(it.id, 'diskonItem', Number(e.target.value) || 0)}
                        onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subtotal</label>
                      <div className="w-full rounded-xl px-3 py-2.5 text-sm text-right font-bold"
                        style={{ background: `${C}0D`, color: C, border: `1.5px solid ${C}30` }}>
                        {fmtRp(it.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem}
              className="flex items-center gap-1.5 text-xs font-semibold mt-2 px-3 py-2 rounded-xl transition-colors"
              style={{ color: C, background: `${C}10` }}>
              <Plus className="h-3.5 w-3.5" /> Tambah Item
            </button>
          </Section>

          {/* ── Ringkasan ── */}
          <Section title="Ringkasan">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal ({items.length} item)</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtRp(subtotalBruto)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Tag className="h-3.5 w-3.5" /> Diskon Total (Rp)
                </span>
                <input type="number" min={0} className="w-36 rounded-xl px-3 py-2 text-sm text-right outline-none"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                  value={diskonTotal || ''} placeholder="0"
                  onChange={e => setDiskonTotal(Number(e.target.value) || 0)}
                  onFocus={focusBorder} onBlur={blurBorder} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Percent className="h-3.5 w-3.5" /> Pajak / PPN (Rp)
                </span>
                <input type="number" min={0} className="w-36 rounded-xl px-3 py-2 text-sm text-right outline-none"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                  value={pajak || ''} placeholder="0"
                  onChange={e => setPajak(Number(e.target.value) || 0)}
                  onFocus={focusBorder} onBlur={blurBorder} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Truck className="h-3.5 w-3.5" /> Biaya Pengiriman (Rp)
                </span>
                <input type="number" min={0} className="w-36 rounded-xl px-3 py-2 text-sm text-right outline-none"
                  style={{ border: '1.5px solid var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                  value={ongkir || ''} placeholder="0"
                  onChange={e => setOngkir(Number(e.target.value) || 0)}
                  onFocus={focusBorder} onBlur={blurBorder} />
              </div>

              <div className="flex justify-between items-center pt-3" style={{ borderTop: '1.5px solid var(--border)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                <span className="text-2xl font-bold" style={{ color: C }}>{fmtRp(grandTotal)}</span>
              </div>
            </div>
          </Section>

          {/* ── Notifikasi WhatsApp ── */}
          <Section title="Notifikasi WhatsApp">
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => setSendWa(v => !v)}
                className="relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors"
                style={{ backgroundColor: sendWa ? '#25D366' : 'var(--border)', padding: 0 }}>
                <span className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: sendWa ? 'translateX(18px)' : 'translateX(0)' }} />
              </button>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Kirim notifikasi WA setelah invoice dibuat
              </span>
            </div>
            {sendWa && (
              <div className="space-y-2">
                <Field label="Nomor WhatsApp Tujuan">
                  <input
                    className={inputCls}
                    style={inputSt}
                    placeholder="08xxxxxxxxxx"
                    value={waPhone}
                    onChange={e => setWaPhone(e.target.value)}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                </Field>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Pastikan token Fonnte sudah diatur di <strong>Settings → WA Gateway</strong>
                </p>
                {waStatus === 'sending' && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#25D366' }}>
                    <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#25D36640', borderTopColor: '#25D366' }} />
                    Mengirim notifikasi WA…
                  </div>
                )}
                {waStatus === 'ok' && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#25D366' }}>
                    <CheckCircle2 className="h-4 w-4" /> Notifikasi WA berhasil dikirim ✓
                  </div>
                )}
                {waStatus === 'error' && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--danger)' }}>
                    <AlertCircle className="h-4 w-4" />
                    <span>{waError || 'Gagal kirim WA'}</span>
                  </div>
                )}
              </div>
            )}
          </Section>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
              Batal
            </button>
            <button type="submit" disabled={loading || resolvingCustomer}
              className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: C, boxShadow: `0 4px 16px ${C}50` }}>
              {loading ? 'Menyimpan…' : '💾 Simpan & Kirim ke Kledo'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

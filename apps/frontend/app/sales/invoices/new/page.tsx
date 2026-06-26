'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import {
  ArrowLeft, Plus, Trash2, Tag, Percent, Truck,
  Link2, CheckCircle2, AlertCircle, Package, MessageSquare, Send,
} from 'lucide-react';
import CustomerSearchDropdown, { type CustomerOption } from '../../../../components/ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '../../../../components/ui/ProductSearchDropdown';
import SalesDropdown from '../../../../components/ui/SalesDropdown';
import { api } from '@/lib/api';

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

type StepStatus = 'idle' | 'loading' | 'ok' | 'error';

export default function NewInvoicePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [customerName, setCustomerName]     = useState('');
  const [customerId, setCustomerId]         = useState('');
  const [kledoContactId, setKledoContactId] = useState('');
  const [noHp, setNoHp]                     = useState('');
  const [resolvingCustomer, setResolvingCustomer] = useState(false);

  const [salesName, setSalesName] = useState(user?.name ?? '');
  const [tanggal]                 = useState(today());
  const [dueDate, setDueDate]     = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes]             = useState('');
  const [diskonTotal, setDiskonTotal] = useState(0);
  const [pajak, setPajak]             = useState(0);
  const [ongkir, setOngkir]           = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState('transfer');
  const [bankPilihan, setBankPilihan] = useState('');

  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const [stepSave,  setStepSave]  = useState<StepStatus>('idle');
  const [stepKledo, setStepKledo] = useState<StepStatus>('idle');
  const [stepWa,    setStepWa]    = useState<StepStatus>('idle');
  const [kledoMsg,  setKledoMsg]  = useState('');
  const [waMsg,     setWaMsg]     = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [done, setDone]           = useState(false);

  const subtotalBruto = items.reduce((s, it) => s + it.subtotal, 0);
  const grandTotal    = Math.max(0, subtotalBruto - diskonTotal + pajak + ongkir);
  const fmtRp = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  const handleCustomerSelect = async (c: CustomerOption) => {
    if (c.source === 'local') {
      setCustomerId(c.id);
      setCustomerName(c.name);
      setNoHp((c as any).phone ?? '');
      if ((c as any).kledoId) setKledoContactId((c as any).kledoId);
      return;
    }
    setResolvingCustomer(true);
    try {
      const kledoId = c.id.replace('kledo-', '');
      const res = await api.post('/customers/find-or-create', {
        name: c.name, phone: c.phone ?? undefined, email: c.email ?? undefined, kledoId,
      });
      setCustomerId(res.data.id ?? res.data?.data?.id ?? '');
      setKledoContactId(kledoId);
      setCustomerName(c.name);
      setNoHp(c.phone ?? '');
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
      const harga = p.hargaJual > 0 ? p.hargaJual : (p.hargaTertinggi > 0 ? p.hargaTertinggi : p.hargaBeli);
      const updated = { ...it, nama: p.name, productId: p.id, kledoProductId: p.kledoProductId ?? null, harga, unit: p.unit?.name, diskonItem: 0 };
      updated.subtotal = calcSub(updated);
      return updated;
    }));
  };

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { setError('Nama pelanggan harus diisi.'); return; }
    if (items.some(it => !it.nama.trim())) { setError('Semua nama produk harus diisi.'); return; }
    if (grandTotal <= 0) { setError('Grand total harus lebih dari 0.'); return; }

    setSubmitting(true);
    setError('');
    setStepSave('loading');
    setStepKledo('idle');
    setStepWa('idle');
    setDone(false);

    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') ?? '' : '';

      const res = await fetch('/api/sales/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          namaCustomer:    customerName.trim(),
          noHp:            noHp.trim() || null,
          customerId:      customerId || null,
          kledoContactId:  kledoContactId || null,
          salesName:       salesName.trim() || null,
          tanggal,
          dueDate,
          notes:           notes.trim() || null,
          diskonTotal,
          pajak,
          ongkir,
          grandTotal,
          metodePembayaran,
          bankPilihan:     bankPilihan.trim() || null,
          items: items.map(it => ({
            nama:           it.nama.trim(),
            qty:            it.qty,
            harga:          it.harga,
            diskonItem:     it.diskonItem,
            subtotal:       it.subtotal,
            unit:           it.unit,
            productId:      it.productId,
            kledoProductId: it.kledoProductId,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStepSave('error');
        setError(data.error ?? 'Gagal menyimpan invoice.');
        setSubmitting(false);
        return;
      }

      setStepSave('ok');
      setInvNumber(data.data?.invNumber ?? '');

      // Kledo status
      const kledo = data.kledo;
      if (kledo?.ok) {
        setStepKledo('ok');
        setKledoMsg(kledo.ref ? `Ref: ${kledo.ref}` : `ID: ${kledo.invoiceId}`);
      } else {
        setStepKledo('error');
        setKledoMsg(kledo?.error ?? 'Gagal push ke Kledo');
      }

      // WA status
      const wa = data.wa;
      if (wa?.skipped) {
        setStepWa('error');
        setWaMsg('Token Fonnte belum diatur di Settings → WA Gateway');
      } else {
        const grupOk  = wa?.grupOrder?.ok === true;
        const konsOk  = wa?.konsumen?.ok === true;
        if (grupOk || konsOk) {
          setStepWa('ok');
          const targets = [grupOk && 'grup', konsOk && 'konsumen'].filter(Boolean).join(' & ');
          setWaMsg(`Terkirim ke ${targets}`);
        } else {
          setStepWa('error');
          setWaMsg(wa?.grupOrder?.reason ?? wa?.konsumen?.reason ?? 'WA tidak terkirim');
        }
      }

      setDone(true);
    } catch (e: any) {
      setStepSave('error');
      setError(e.message ?? 'Terjadi kesalahan.');
    }

    setSubmitting(false);
  };

  const StatusRow = ({
    step, label, detail,
  }: { step: StepStatus; label: string; detail?: string }) => {
    if (step === 'idle') return null;
    const color = step === 'ok' ? 'var(--success)' : step === 'error' ? 'var(--danger)' : C;
    const bg    = step === 'ok' ? 'var(--success-light)' : step === 'error' ? 'var(--danger-light)' : `${C}0A`;
    const border = step === 'ok' ? 'rgba(16,185,129,.25)' : step === 'error' ? 'rgba(239,68,68,.25)' : `${C}25`;
    return (
      <div className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: bg, border: `1.5px solid ${border}`, color }}>
        <div className="mt-0.5 flex-shrink-0">
          {step === 'loading' && <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${C}40`, borderTopColor: C }} />}
          {step === 'ok'      && <CheckCircle2 className="h-4 w-4" />}
          {step === 'error'   && <AlertCircle  className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          {detail && <p className="text-xs opacity-80 mt-0.5 break-all">{detail}</p>}
        </div>
      </div>
    );
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
              <Link2 className="h-3.5 w-3.5" /> Tersinkron otomatis ke Kledo · Notifikasi WA otomatis
            </p>
          </div>
        </div>

        {/* Error umum */}
        {error && (
          <div className="rounded-xl p-3 text-sm flex items-center gap-2"
            style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1.5px solid rgba(239,68,68,.25)' }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Status steps setelah submit */}
        {(stepSave !== 'idle' || done) && (
          <div className="space-y-2">
            <StatusRow step={stepSave}
              label={stepSave === 'loading' ? 'Menyimpan invoice…' : stepSave === 'ok' ? `Invoice ${invNumber} tersimpan ✓` : 'Gagal menyimpan invoice'}
            />
            <StatusRow step={stepKledo}
              label={stepKledo === 'ok' ? 'Invoice berhasil dikirim ke Kledo ✓' : stepKledo === 'error' ? 'Invoice tersimpan — gagal ke Kledo' : 'Mengirim ke Kledo…'}
              detail={kledoMsg}
            />
            <StatusRow step={stepWa}
              label={stepWa === 'ok' ? 'Notifikasi WhatsApp terkirim ✓' : stepWa === 'error' ? 'WhatsApp tidak terkirim' : 'Mengirim WhatsApp…'}
              detail={waMsg}
            />
          </div>
        )}

        {/* Tombol kembali ke list jika selesai */}
        {done && (
          <div className="flex gap-3">
            <button onClick={() => router.push('/sales/invoices')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${C}, #0097A7)` }}>
              Lihat Semua Invoice
            </button>
            <button onClick={() => {
              setCustomerName(''); setCustomerId(''); setKledoContactId(''); setNoHp('');
              setSalesName(user?.name ?? ''); setNotes(''); setDiskonTotal(0); setPajak(0); setOngkir(0);
              setItems([emptyItem()]); setStepSave('idle'); setStepKledo('idle'); setStepWa('idle');
              setDone(false); setError(''); setInvNumber('');
            }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ border: `1.5px solid ${C}`, color: C, background: `${C}0A` }}>
              Buat Invoice Baru
            </button>
          </div>
        )}

        {!done && (
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
                        <Link2 className="h-2.5 w-2.5" /> Terhubung ke Kledo
                      </div>
                    )}
                  </Field>
                </div>

                <Field label="No. WhatsApp Pelanggan" optional>
                  <input
                    className={inputCls} style={inputSt}
                    placeholder="08xxxxxxxxxx"
                    value={noHp}
                    onChange={e => setNoHp(e.target.value)}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </Field>

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
                    type="date" className={inputCls} style={inputSt}
                    value={dueDate} min={tanggal}
                    onChange={e => setDueDate(e.target.value)}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Metode Pembayaran">
                  <select className={inputCls} style={inputSt} value={metodePembayaran}
                    onChange={e => setMetodePembayaran(e.target.value)}
                    onFocus={focusBorder} onBlur={blurBorder}>
                    <option value="transfer">Transfer Bank</option>
                    <option value="cash">Cash</option>
                    <option value="debit">Debit EDC</option>
                    <option value="dp">Uang Muka / DP</option>
                  </select>
                </Field>
                {(metodePembayaran === 'transfer' || metodePembayaran === 'debit') && (
                  <Field label={metodePembayaran === 'transfer' ? 'Bank Tujuan' : 'EDC'} optional>
                    <input className={inputCls} style={inputSt}
                      placeholder={metodePembayaran === 'transfer' ? 'BCA / BRI / Mandiri / BNI' : 'BCA EDC / BRI EDC / BNI'}
                      value={bankPilihan} onChange={e => setBankPilihan(e.target.value)}
                      onFocus={focusBorder} onBlur={blurBorder}
                    />
                  </Field>
                )}
              </div>

              <Field label="Catatan / Pesan" optional>
                <input className={inputCls} style={inputSt} placeholder="Catatan atau pesan untuk invoice ini..."
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
                          <Tag className="h-3 w-3 inline mr-0.5" style={{ color: 'var(--text-muted)' }} /> Diskon (Rp)
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

            {/* ── Info WA ── */}
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(37,211,102,.06)', border: '1.5px solid rgba(37,211,102,.2)' }}>
              <MessageSquare className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#25D366' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#15803D' }}>Notifikasi WhatsApp otomatis</p>
                <p className="text-xs mt-0.5" style={{ color: '#374151' }}>
                  Pesan akan dikirim ke <strong>grup order</strong> dan <strong>WhatsApp konsumen</strong> (jika No. WA diisi)
                  menggunakan konfigurasi Fonnte dari <strong>Settings → WA Gateway</strong>.
                </p>
              </div>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${C}, #0097A7)`, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses…</>
              ) : (
                <><Send className="h-4 w-4" /> Buat Invoice & Kirim ke Kledo + WA</>
              )}
            </button>

          </form>
        )}
      </div>
    </AppShell>
  );
}

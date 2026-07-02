'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Zap, User, ClipboardList, Search, Trash2, AlertCircle,
  CheckCircle2, FileText, Tag, Truck, Percent,
  CreditCard, Banknote, Smartphone, Wallet,
} from 'lucide-react';
import CustomerSearchDropdown, { type CustomerOption } from '@/components/ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '@/components/ui/ProductSearchDropdown';
import SalesDropdown from '@/components/ui/SalesDropdown';
import { useAuthStore } from '@/lib/store/useAuthStore';

const ACCENT = '#6366F1';
const fmtRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)',
  padding: 24, marginBottom: 14, boxShadow: 'var(--shadow-sm)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
  outline: 'none', fontSize: 14, boxSizing: 'border-box', color: 'var(--text-primary)',
  background: 'var(--surface)', fontFamily: 'inherit',
};

const numInput: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
  outline: 'none', fontSize: 13, color: 'var(--text-primary)',
  background: 'var(--surface)', textAlign: 'right', width: 140,
};

const METODE_OPTIONS = [
  { value: 'transfer', label: 'Transfer',   icon: Smartphone },
  { value: 'debit',   label: 'Debit/Kartu', icon: CreditCard },
  { value: 'cash',    label: 'Cash',        icon: Banknote },
  { value: 'cod',     label: 'COD',         icon: Truck },
  { value: 'dp',      label: 'Uang Muka',   icon: Wallet },
];

interface ParsedItem {
  raw: string; line: number; productName: string;
  qty: number; unitPrice: number; ok: boolean; error?: string;
}

interface ConfirmedItem {
  productId: string; kledoProductId?: string | null;
  productName: string; qty: number; unit: string;
  unitPrice: number; stok: number; source: 'bulk' | 'search';
}

function parseBulkText(text: string): ParsedItem[] {
  return text.split('\n').map((raw, i) => {
    const line = i + 1;
    const trimmed = raw.trim();
    if (!trimmed) return { raw, line, productName: '', qty: 0, unitPrice: 0, ok: false, error: 'Baris kosong' };
    const parts = trimmed.split(/[,;|\t]+/).map(s => s.trim());
    if (parts.length < 2) return { raw, line, productName: trimmed, qty: 1, unitPrice: 0, ok: false, error: 'Minimal 2 kolom: nama, qty' };
    const productName = parts[0];
    const qty = parseFloat(parts[1].replace(/[^\d.]/g, ''));
    const unitPrice = parts[2] ? parseFloat(parts[2].replace(/[^\d.]/g, '')) : 0;
    if (!productName) return { raw, line, productName: '', qty: 0, unitPrice: 0, ok: false, error: 'Nama produk kosong' };
    if (isNaN(qty) || qty <= 0) return { raw, line, productName, qty: 0, unitPrice: 0, ok: false, error: 'Qty tidak valid' };
    return { raw, line, productName, qty, unitPrice: isNaN(unitPrice) ? 0 : unitPrice, ok: true };
  }).filter(p => p.raw.trim() !== '');
}

export default function SmartOrderPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'bulk' | 'search'>('bulk');

  const [customerName, setCustomerName]       = useState('');
  const [kledoContactId, setKledoContactId]   = useState<string | null>(null);
  const [customerPhone, setCustomerPhone]     = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [salesName, setSalesName]             = useState(user?.name ?? '');
  const [notes, setNotes]                     = useState('');

  const [diskonTotal, setDiskonTotal]         = useState(0);
  const [pajak, setPajak]                     = useState(0);
  const [ongkir, setOngkir]                   = useState(0);
  const [metodePembayaran, setMetodePembayaran] = useState('transfer');
  const [bankPilihan, setBankPilihan]         = useState<string | null>(null);
  const [uangMuka, setUangMuka]               = useState(0);

  const [bulkText, setBulkText]               = useState('');
  const [parsed, setParsed]                   = useState<ParsedItem[]>([]);
  const [showPreview, setShowPreview]         = useState(false);

  const [items, setItems]                     = useState<ConfirmedItem[]>([]);
  const [productQuery, setProductQuery]       = useState('');

  const [submitting, setSubmitting]           = useState(false);
  const [kledoStatus, setKledoStatus]         = useState<'idle' | 'ok' | 'error'>('idle');
  const [success, setSuccess]                 = useState('');
  const [error, setError]                     = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const subtotalBruto = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const grandTotal    = Math.max(0, subtotalBruto - diskonTotal + pajak + ongkir);
  const sisaBayar     = Math.max(0, grandTotal - uangMuka);

  const handleBulkParse = useCallback(() => {
    if (!bulkText.trim()) return;
    const result = parseBulkText(bulkText);
    setParsed(result);
    setShowPreview(true);
    const valid = result.filter(p => p.ok);
    const bulkItems: ConfirmedItem[] = valid.map((p, idx) => ({
      productId: `bulk-${idx}-${p.productName}`,
      productName: p.productName, qty: p.qty, unit: 'pcs',
      unitPrice: p.unitPrice, stok: 999, source: 'bulk',
    }));
    setItems(prev => [...prev.filter(i => i.source === 'search'), ...bulkItems]);
  }, [bulkText]);

  const handleBulkTextChange = (val: string) => {
    setBulkText(val);
    if (showPreview) {
      const result = parseBulkText(val);
      setParsed(result);
      const valid = result.filter(p => p.ok);
      const bulkItems: ConfirmedItem[] = valid.map((p, idx) => ({
        productId: `bulk-${idx}-${p.productName}`,
        productName: p.productName, qty: p.qty, unit: 'pcs',
        unitPrice: p.unitPrice, stok: 999, source: 'bulk',
      }));
      setItems(prev => [...prev.filter(i => i.source === 'search'), ...bulkItems]);
    }
  };

  const handleCustomerSelect = (c: CustomerOption) => {
    setCustomerName(c.name);
    if (c.phone) setCustomerPhone(c.phone);
    if (c.address) setCustomerAddress(c.address);
    if (c.source === 'kledo') setKledoContactId(c.id.replace('kledo-', ''));
    else if ((c as any).kledoId) setKledoContactId((c as any).kledoId);
  };

  const handleProductSelect = (p: ProductOption) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        productId: p.id, kledoProductId: p.kledoProductId ?? null,
        productName: p.name, qty: 1, unit: p.unit?.name ?? 'pcs',
        unitPrice: p.hargaJual, stok: p.stok, source: 'search',
      }];
    });
    setProductQuery('');
  };

  const updateItem = (productId: string, field: 'qty' | 'unitPrice', val: number) => {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, [field]: val } : i));
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const validParsed   = parsed.filter(p => p.ok);
  const invalidParsed = parsed.filter(p => !p.ok);

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Masukkan nama pelanggan terlebih dahulu.'); return; }
    if (items.length === 0) { setError('Tambahkan minimal satu produk.'); return; }
    setError(''); setKledoStatus('idle');
    setSubmitting(true);
    try {
      const payload = {
        namaCustomer: customerName.trim(),
        noHp: customerPhone.trim() || undefined,
        alamat: customerAddress.trim() || undefined,
        catatan: notes || undefined,
        salesName: salesName.trim() || undefined,
        kledoContactId: kledoContactId || undefined,
        totalHarga: grandTotal,
        diskonTotal: diskonTotal || undefined,
        pajak: pajak || undefined,
        ongkir: ongkir || undefined,
        metodePembayaran,
        bankPilihan: metodePembayaran === 'transfer' ? (bankPilihan || undefined) : undefined,
        uangMuka: uangMuka || undefined,
        status: 'pending',
        items: items.map(i => ({
          nama: i.productName,
          qty: i.qty,
          harga: i.unitPrice,
          subtotal: i.qty * i.unitPrice,
          unit: i.unit,
          productId: i.productId.startsWith('bulk-') ? undefined : i.productId,
          kledoProductId: i.kledoProductId ?? undefined,
        })),
      };
      const res = await api.post('/sales/orders', payload);
      const kledoResult = (res.data as any)?.kledo;
      setKledoStatus(kledoResult?.ok ? 'ok' : 'error');
      const soNum = res.data?.data?.soNumber ?? res.data?.soNumber ?? '';
      setSuccess(`Order ${soNum} berhasil dibuat!`);
      setTimeout(() => router.push('/sales/orders'), 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.response?.data?.error ?? 'Gagal membuat order.');
    } finally { setSubmitting(false); }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>{success}</h2>
      {kledoStatus === 'ok' && (
        <p style={{ color: '#10B981', fontWeight: 600 }}>✓ Invoice otomatis masuk ke Kledo</p>
      )}
      {kledoStatus === 'error' && (
        <p style={{ color: '#F59E0B', fontWeight: 600 }}>⚠ Order tersimpan — Kledo tidak terjangkau, sync manual nanti</p>
      )}
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Mengalihkan ke daftar order…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>Smart Order Input</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Input banyak produk sekaligus — tanpa klik satu per satu.</p>
      </div>

      {/* Pelanggan */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
          <User size={15} style={{ color: ACCENT }} /> Informasi Pelanggan
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Nama Pelanggan <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <CustomerSearchDropdown
              value={customerName} onChange={v => { setCustomerName(v); setKledoContactId(null); }}
              onSelect={handleCustomerSelect}
              placeholder="Ketik nama atau nomor HP pelanggan..."
              accentColor={ACCENT}
            />
            {kledoContactId && (
              <p style={{ fontSize: 11, color: ACCENT, marginTop: 4, fontWeight: 600 }}>
                ✓ Terhubung ke Kledo (ID: {kledoContactId})
              </p>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>No. HP</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="081234567890" style={inputStyle}
                onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nama Sales</label>
              <SalesDropdown value={salesName} onChange={setSalesName} accentColor={ACCENT} placeholder="Pilih sales..." />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Alamat Pengiriman</label>
            <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Alamat pengiriman" style={inputStyle}
              onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
        </div>
      </div>

      {/* Produk — mode tabs */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <ClipboardList size={15} style={{ color: ACCENT }} /> Produk
            {items.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, background: ACCENT + '18', color: ACCENT, borderRadius: 20, padding: '2px 10px' }}>
                {items.length} item
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', borderRadius: 10, padding: 3 }}>
            {(['bulk', 'search'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? ACCENT : 'var(--text-muted)',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                }}>
                {m === 'bulk' ? <><ClipboardList size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Input Massal</> : <><Search size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Cari Produk</>}
              </button>
            ))}
          </div>
        </div>

        {/* MODE BULK */}
        {mode === 'bulk' && (
          <div>
            <div style={{ background: ACCENT + '08', border: `1px solid ${ACCENT}22`, borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: ACCENT }}>Format:</strong> satu produk per baris →{' '}
              <code style={{ background: 'var(--surface)', padding: '1px 6px', borderRadius: 5, fontSize: 11 }}>Nama Produk, Qty, Harga</code>
              <span style={{ margin: '0 6px', opacity: .5 }}>|</span>
              Pisahkan dengan koma, titik koma, atau tab.
            </div>
            <textarea ref={textareaRef} value={bulkText} onChange={e => handleBulkTextChange(e.target.value)}
              placeholder={`Contoh:\nSemen Gresik 40kg, 10, 75000\nBesi Beton 10mm, 20, 50000\nCat Tembok Avian 5L, 5, 125000`}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, minHeight: 180 }}
              onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bulkText.split('\n').filter(l => l.trim()).length} baris</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {bulkText.trim() && (
                  <button onClick={() => { setBulkText(''); setParsed([]); setShowPreview(false); setItems(prev => prev.filter(i => i.source === 'search')); }}
                    style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Hapus
                  </button>
                )}
                <button onClick={handleBulkParse} disabled={!bulkText.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 10, border: 'none',
                    background: bulkText.trim() ? ACCENT : 'var(--surface-sunken)',
                    color: bulkText.trim() ? '#fff' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 700, cursor: bulkText.trim() ? 'pointer' : 'not-allowed',
                  }}>
                  <Zap size={13} /> Parse & Preview
                </button>
              </div>
            </div>
            {showPreview && parsed.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Preview</span>
                  {validParsed.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 20 }}>✓ {validParsed.length} valid</span>}
                  {invalidParsed.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 20 }}>✗ {invalidParsed.length} error</span>}
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  {parsed.map((p, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 120px 100px', gap: 0, padding: '9px 14px', alignItems: 'center', borderBottom: idx < parsed.length - 1 ? '1px solid var(--border)' : 'none', background: !p.ok ? '#FFF8F8' : 'transparent' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{p.line}</span>
                      {p.ok ? (
                        <>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', padding: '0 6px' }}>{p.productName}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{p.qty}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{fmtRp(p.unitPrice)}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{fmtRp(p.qty * p.unitPrice)}</span>
                        </>
                      ) : (
                        <span style={{ gridColumn: '2 / 6', fontSize: 12, color: '#EF4444', padding: '0 6px' }}>
                          <AlertCircle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                          <em style={{ color: 'var(--text-muted)' }}>{p.raw}</em> — {p.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE SEARCH */}
        {mode === 'search' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Cari & tambah produk satu per satu
            </label>
            <ProductSearchDropdown value={productQuery} onChange={setProductQuery} onSelect={handleProductSelect}
              placeholder="Ketik nama atau SKU produk..." accentColor={ACCENT} />
          </div>
        )}

        {items.length > 0 && mode === 'search' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Item ({items.length})</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 110px 32px', padding: '8px 14px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                {['Produk', 'Qty', 'Harga', 'Subtotal', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 6px', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</span>
                ))}
              </div>
              {items.map((item, idx) => (
                <div key={item.productId} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 110px 32px', alignItems: 'center', padding: '9px 14px', borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ padding: '0 6px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1px' }}>{item.productName}</p>
                    {item.stok < 999 && <p style={{ fontSize: 11, color: item.stok > 5 ? '#10B981' : '#EF4444', margin: 0 }}>stok: {item.stok}</p>}
                  </div>
                  <input type="number" min={1} value={item.qty} onChange={e => updateItem(item.productId, 'qty', Number(e.target.value) || 1)}
                    style={{ ...inputStyle, padding: '5px 8px', fontSize: 13, textAlign: 'right' }} />
                  <input type="number" min={0} value={item.unitPrice} onChange={e => updateItem(item.productId, 'unitPrice', Number(e.target.value) || 0)}
                    style={{ ...inputStyle, padding: '5px 8px', fontSize: 13, textAlign: 'right' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', padding: '0 6px', textAlign: 'right' }}>{fmtRp(item.qty * item.unitPrice)}</span>
                  <button onClick={() => removeItem(item.productId)} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Catatan & Biaya Tambahan */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
          <FileText size={15} style={{ color: ACCENT }} /> Catatan & Biaya
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Instruksi pengiriman, catatan khusus…" rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Tag size={11} /> Diskon (Rp)
              </label>
              <input type="number" min={0} value={diskonTotal || ''} placeholder="0" style={numInput}
                onChange={e => setDiskonTotal(Number(e.target.value) || 0)}
                onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Percent size={11} /> Pajak/PPN (Rp)
              </label>
              <input type="number" min={0} value={pajak || ''} placeholder="0" style={numInput}
                onChange={e => setPajak(Number(e.target.value) || 0)}
                onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Truck size={11} /> Ongkir (Rp)
              </label>
              <input type="number" min={0} value={ongkir || ''} placeholder="0" style={numInput}
                onChange={e => setOngkir(Number(e.target.value) || 0)}
                onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
        </div>
      </div>

      {/* Detail Pembayaran */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
          <Banknote size={15} style={{ color: ACCENT }} /> Detail Pembayaran
        </h3>

        {/* Metode */}
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Metode Pembayaran</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {METODE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = metodePembayaran === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => setMetodePembayaran(opt.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
                  border: `2px solid ${active ? ACCENT : 'var(--border)'}`,
                  background: active ? ACCENT + '12' : 'var(--surface)',
                  color: active ? ACCENT : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                }}>
                <Icon size={14} /> {opt.label}
              </button>
            );
          })}
        </div>

        {/* Info Rekening Bank — tampil saat Transfer dipilih */}
        {metodePembayaran === 'transfer' && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: 'rgba(99,102,241,.06)', border: '1.5px solid rgba(99,102,241,.2)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: ACCENT, margin: '0 0 10px' }}>
              Pilih Bank Tujuan Transfer
            </p>
            {[
              { key: 'bri',     bank: 'BRI',     no: '0262 01 000031 562', nama: 'Dian Purnama Reza T.' },
              { key: 'mandiri', bank: 'MANDIRI', no: '136 000 4780612',    nama: 'Dian Purnama' },
              { key: 'bca',     bank: 'BCA',     no: '155 91 99999',       nama: 'Indarto Wibowo' },
              { key: 'bni',     bank: 'BNI',     no: '0822 705 836',       nama: 'Indarto Wibowo' },
            ].map(r => {
              const selected = bankPilihan === r.key;
              return (
                <div key={r.bank} onClick={() => setBankPilihan(selected ? null : r.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 10,
                    background: selected ? ACCENT + '18' : 'var(--surface)',
                    border: `1.5px solid ${selected ? ACCENT : 'transparent'}`,
                    marginBottom: 6, cursor: 'pointer', transition: 'all .15s' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, width: 60, flexShrink: 0 }}>{r.bank}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '.03em', flex: 1 }}>{r.no}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.nama}</span>
                  {selected && <CheckCircle2 size={14} style={{ color: ACCENT, flexShrink: 0 }} />}
                </div>
              );
            })}
            {bankPilihan && (
              <p style={{ fontSize: 11, color: ACCENT, fontWeight: 600, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Kledo otomatis <strong>LUNAS</strong> via {bankPilihan.toUpperCase()}
              </p>
            )}
          </div>
        )}

        {/* Uang Muka */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Uang Muka / DP (Rp) <span style={{ fontWeight: 400 }}>(opsional)</span>
            </label>
            <input type="number" min={0} max={grandTotal}
              value={uangMuka || ''} placeholder="0 jika bayar penuh"
              style={{ ...inputStyle, textAlign: 'right' }}
              onChange={e => setUangMuka(Math.min(grandTotal, Number(e.target.value) || 0))}
              onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          {uangMuka > 0 && (
            <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(245,158,11,.08)', border: '1.5px solid rgba(245,158,11,.25)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>Sisa yang harus dibayar</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>{fmtRp(sisaBayar)}</span>
            </div>
          )}
        </div>

      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#EF4444', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Footer submit */}
      <div style={{ background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>
            Grand Total · {items.length} item
            {diskonTotal > 0 && <span style={{ color: '#10B981', marginLeft: 6 }}>-{fmtRp(diskonTotal)}</span>}
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: ACCENT, margin: 0, letterSpacing: '-0.02em' }}>{fmtRp(grandTotal)}</p>
          {uangMuka > 0 && <p style={{ fontSize: 12, color: '#F59E0B', margin: '2px 0 0', fontWeight: 600 }}>DP: {fmtRp(uangMuka)} · Sisa: {fmtRp(sisaBayar)}</p>}
        </div>
        <button onClick={handleSubmit} disabled={submitting || items.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 12,
            border: 'none', background: items.length === 0 ? 'var(--surface-sunken)' : ACCENT,
            color: items.length === 0 ? 'var(--text-muted)' : '#fff',
            fontSize: 14, fontWeight: 700, cursor: items.length === 0 ? 'not-allowed' : 'pointer', transition: 'all .2s',
            boxShadow: items.length > 0 ? `0 4px 14px ${ACCENT}40` : 'none',
          }}>
          {submitting ? 'Menyimpan…' : <><Zap size={15} /> Buat Order ({items.length} item)</>}
        </button>
      </div>
    </div>
  );
}

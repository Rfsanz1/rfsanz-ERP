'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Zap, User, ClipboardList, Search, Trash2, AlertCircle, CheckCircle2, FileText, ChevronDown } from 'lucide-react';
import CustomerSearchDropdown, { type CustomerOption } from '@/components/ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '@/components/ui/ProductSearchDropdown';

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

interface ParsedItem {
  raw: string;
  line: number;
  productName: string;
  qty: number;
  unitPrice: number;
  ok: boolean;
  error?: string;
}

interface ConfirmedItem {
  productId: string;
  kledoProductId?: string | null;
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  stok: number;
  source: 'bulk' | 'search';
}

function parseBulkText(text: string): ParsedItem[] {
  return text.split('\n').map((raw, i) => {
    const line = i + 1;
    const trimmed = raw.trim();
    if (!trimmed) return { raw, line, productName: '', qty: 0, unitPrice: 0, ok: false, error: 'Baris kosong' };

    const parts = trimmed.split(/[,;|\t]+/).map(s => s.trim());
    if (parts.length < 2) return { raw, line, productName: trimmed, qty: 1, unitPrice: 0, ok: false, error: 'Minimal 2 kolom: nama, qty (atau nama, qty, harga)' };

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
  const [mode, setMode] = useState<'bulk' | 'search'>('bulk');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [items, setItems] = useState<ConfirmedItem[]>([]);
  const [productQuery, setProductQuery] = useState('');

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleBulkParse = useCallback(() => {
    if (!bulkText.trim()) return;
    const result = parseBulkText(bulkText);
    setParsed(result);
    setShowPreview(true);
    const valid = result.filter(p => p.ok);
    const bulkItems: ConfirmedItem[] = valid.map((p, idx) => ({
      productId: `bulk-${idx}-${p.productName}`,
      productName: p.productName,
      qty: p.qty,
      unit: 'pcs',
      unitPrice: p.unitPrice,
      stok: 999,
      source: 'bulk',
    }));
    setItems(prev => {
      const searchItems = prev.filter(i => i.source === 'search');
      return [...searchItems, ...bulkItems];
    });
  }, [bulkText]);

  const handleBulkTextChange = (val: string) => {
    setBulkText(val);
    if (showPreview) {
      const result = parseBulkText(val);
      setParsed(result);
      const valid = result.filter(p => p.ok);
      const bulkItems: ConfirmedItem[] = valid.map((p, idx) => ({
        productId: `bulk-${idx}-${p.productName}`,
        productName: p.productName,
        qty: p.qty,
        unit: 'pcs',
        unitPrice: p.unitPrice,
        stok: 999,
        source: 'bulk',
      }));
      setItems(prev => {
        const searchItems = prev.filter(i => i.source === 'search');
        return [...searchItems, ...bulkItems];
      });
    }
  };

  const handleCustomerSelect = (c: CustomerOption) => {
    setCustomerName(c.name);
    if (c.phone) setCustomerPhone(c.phone);
    if (c.address) setCustomerAddress(c.address);
  };

  const handleProductSelect = (p: ProductOption) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        productId: p.id,
        kledoProductId: p.kledoProductId ?? null,
        productName: p.name,
        qty: 1,
        unit: p.unit?.name ?? 'pcs',
        unitPrice: p.hargaJual,
        stok: p.stok,
        source: 'search',
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

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const validParsed = parsed.filter(p => p.ok);
  const invalidParsed = parsed.filter(p => !p.ok);

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Masukkan nama pelanggan terlebih dahulu.'); return; }
    if (items.length === 0) { setError('Tambahkan minimal satu produk.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        namaCustomer: customerName.trim(),
        noHp: customerPhone.trim() || undefined,
        alamat: customerAddress.trim() || undefined,
        catatan: notes || undefined,
        totalHarga: total,
        status: 'pending',
        items: items.map(i => ({
          nama: i.productName,
          qty: i.qty,
          harga: i.unitPrice,
          subtotal: i.qty * i.unitPrice,
          productId: i.productId.startsWith('bulk-') ? undefined : i.productId,
          kledoProductId: i.kledoProductId ?? undefined,
        })),
      };
      const res = await api.post('/sales/orders', payload);
      setSuccess(`Order #${res.data?.id ?? ''} berhasil dibuat!`);
      setTimeout(() => router.push('/sales/orders'), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Gagal membuat order.');
    } finally { setSubmitting(false); }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>{success}</h2>
      <p style={{ color: 'var(--text-muted)' }}>Mengalihkan ke daftar order…</p>
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
              value={customerName} onChange={setCustomerName}
              onSelect={handleCustomerSelect}
              placeholder="Ketik nama atau nomor HP pelanggan..."
              accentColor={ACCENT}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>No. HP</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="081234567890" style={inputStyle}
                onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Alamat Pengiriman</label>
              <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Alamat pengiriman" style={inputStyle}
                onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
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
            <button onClick={() => setMode('bulk')}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                background: mode === 'bulk' ? '#fff' : 'transparent',
                color: mode === 'bulk' ? ACCENT : 'var(--text-muted)',
                boxShadow: mode === 'bulk' ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
              <ClipboardList size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Input Massal
            </button>
            <button onClick={() => setMode('search')}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                background: mode === 'search' ? '#fff' : 'transparent',
                color: mode === 'search' ? ACCENT : 'var(--text-muted)',
                boxShadow: mode === 'search' ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
              <Search size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />Cari Produk
            </button>
          </div>
        </div>

        {/* ---- MODE BULK ---- */}
        {mode === 'bulk' && (
          <div>
            <div style={{ background: ACCENT + '08', border: `1px solid ${ACCENT}22`, borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: ACCENT }}>Format:</strong> satu produk per baris →{' '}
              <code style={{ background: 'var(--surface)', padding: '1px 6px', borderRadius: 5, fontSize: 11 }}>Nama Produk, Qty, Harga</code>
              <span style={{ margin: '0 6px', opacity: .5 }}>|</span>
              <span>Harga boleh dikosongkan. Pisahkan dengan koma, titik koma, atau tab.</span>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={bulkText}
                onChange={e => handleBulkTextChange(e.target.value)}
                placeholder={`Contoh:\nSemen Gresik 40kg, 10, 75000\nBesi Beton 10mm, 20, 50000\nCat Tembok Avian 5L, 5, 125000\nPaku Beton 3 inch, 100, 1500\nPasir Cor per sak, 15, 35000`}
                rows={10}
                style={{
                  ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13,
                  lineHeight: 1.7, minHeight: 200, letterSpacing: 0,
                }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {bulkText.split('\n').filter(l => l.trim()).length} baris tertulis
              </span>
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
                    fontSize: 12, fontWeight: 700, cursor: bulkText.trim() ? 'pointer' : 'not-allowed', transition: 'all .15s',
                  }}>
                  <Zap size={13} /> Parse & Preview
                </button>
              </div>
            </div>

            {/* Preview hasil parse */}
            {showPreview && parsed.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Preview</span>
                  {validParsed.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 20 }}>
                      ✓ {validParsed.length} valid
                    </span>
                  )}
                  {invalidParsed.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 20 }}>
                      ✗ {invalidParsed.length} error
                    </span>
                  )}
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 120px 100px 32px', gap: 0, padding: '8px 14px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Nama Produk', 'Qty', 'Harga Satuan', 'Subtotal', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: i >= 2 ? 'right' : 'left', padding: '0 6px' }}>{h}</span>
                    ))}
                  </div>

                  {parsed.map((p, idx) => (
                    <div key={idx} style={{
                      display: 'grid', gridTemplateColumns: '32px 1fr 80px 120px 100px 32px', gap: 0,
                      padding: '9px 14px', alignItems: 'center',
                      borderBottom: idx < parsed.length - 1 ? '1px solid var(--border)' : 'none',
                      background: !p.ok ? '#FFF8F8' : 'transparent',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 6px', textAlign: 'center' }}>{p.line}</span>

                      {p.ok ? (
                        <>
                          <div style={{ padding: '0 6px' }}>
                            <input
                              value={items.find(i => i.source === 'bulk' && i.productName === p.productName && items.indexOf(i) === idx) ? 
                                items.find(i => i.source === 'bulk')?.productName ?? p.productName : p.productName}
                              onChange={e => {
                                const bulkItems = items.filter(i => i.source === 'bulk');
                                if (bulkItems[idx - items.filter(i => i.source === 'search').length]) {
                                  const searchCount = items.filter(i => i.source === 'search').length;
                                  const bulkIdx = idx - (parsed.filter((pp, pi) => pi < idx && !pp.ok).length);
                                  setItems(prev => prev.map((item, i2) => {
                                    const bulkItems2 = prev.filter(x => x.source === 'bulk');
                                    const targetId = bulkItems2[Math.max(0, bulkIdx - searchCount)]?.productId;
                                    return item.productId === targetId ? { ...item, productName: e.target.value } : item;
                                  }));
                                }
                              }}
                              style={{ ...inputStyle, padding: '4px 8px', fontSize: 13, borderColor: 'transparent', background: 'transparent' }}
                              onFocus={e => e.target.style.borderColor = ACCENT}
                              onBlur={e => e.target.style.borderColor = 'transparent'}
                            />
                          </div>
                          <div style={{ padding: '0 6px', textAlign: 'right' }}>
                            <input type="number" defaultValue={p.qty} min={1}
                              onChange={e => {
                                const newQty = Number(e.target.value);
                                const bulkItems = items.filter(i => i.source === 'bulk');
                                const bulkValidIdx = parsed.filter((pp, pi) => pi < idx && pp.ok).length;
                                if (bulkItems[bulkValidIdx]) updateItem(bulkItems[bulkValidIdx].productId, 'qty', newQty);
                              }}
                              style={{ ...inputStyle, padding: '4px 8px', fontSize: 13, textAlign: 'right', width: '100%' }} />
                          </div>
                          <div style={{ padding: '0 6px', textAlign: 'right' }}>
                            <input type="number" defaultValue={p.unitPrice} min={0}
                              onChange={e => {
                                const newPrice = Number(e.target.value);
                                const bulkItems = items.filter(i => i.source === 'bulk');
                                const bulkValidIdx = parsed.filter((pp, pi) => pi < idx && pp.ok).length;
                                if (bulkItems[bulkValidIdx]) updateItem(bulkItems[bulkValidIdx].productId, 'unitPrice', newPrice);
                              }}
                              style={{ ...inputStyle, padding: '4px 8px', fontSize: 13, textAlign: 'right', width: '100%' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', padding: '0 6px', textAlign: 'right' }}>
                            {fmtRp(p.qty * p.unitPrice)}
                          </span>
                          <div style={{ padding: '0 6px', display: 'flex', justifyContent: 'center' }}>
                            <CheckCircle2 size={15} style={{ color: '#10B981' }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ padding: '0 6px', gridColumn: '2 / 6' }}>
                            <span style={{ fontSize: 12, color: '#EF4444' }}>
                              <AlertCircle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                              <em style={{ color: 'var(--text-muted)' }}>{p.raw}</em>
                              <span style={{ marginLeft: 8, fontSize: 11, color: '#EF4444' }}>— {p.error}</span>
                            </span>
                          </div>
                          <div />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- MODE SEARCH ---- */}
        {mode === 'search' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Cari & tambah produk satu per satu
            </label>
            <ProductSearchDropdown
              value={productQuery} onChange={setProductQuery}
              onSelect={handleProductSelect}
              placeholder="Ketik nama atau SKU produk..."
              accentColor={ACCENT}
            />
          </div>
        )}

        {/* Tabel ringkasan item (muncul di kedua mode kalau ada item) */}
        {items.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {mode === 'search' && (
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
                Item ({items.length})
              </p>
            )}
            {mode === 'search' && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 110px 32px', gap: 0, padding: '8px 14px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                  {['Produk', 'Qty', 'Harga', 'Subtotal', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', padding: '0 6px', textAlign: i >= 1 ? 'right' : 'left' }}>{h}</span>
                  ))}
                </div>
                {items.map((item, idx) => (
                  <div key={item.productId} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 110px 32px', alignItems: 'center', padding: '9px 14px', borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ padding: '0 6px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1px' }}>{item.productName}</p>
                      {item.stok < 999 && <p style={{ fontSize: 11, color: item.stok > 5 ? '#10B981' : '#EF4444', margin: 0 }}>stok: {item.stok}</p>}
                    </div>
                    <input type="number" min={1} value={item.qty}
                      onChange={e => updateItem(item.productId, 'qty', Number(e.target.value) || 1)}
                      style={{ ...inputStyle, padding: '5px 8px', fontSize: 13, textAlign: 'right' }} />
                    <input type="number" min={0} value={item.unitPrice}
                      onChange={e => updateItem(item.productId, 'unitPrice', Number(e.target.value) || 0)}
                      style={{ ...inputStyle, padding: '5px 8px', fontSize: 13, textAlign: 'right' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', padding: '0 6px', textAlign: 'right' }}>{fmtRp(item.qty * item.unitPrice)}</span>
                    <button onClick={() => removeItem(item.productId)}
                      style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', justifyContent: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Catatan */}
      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
          <FileText size={15} style={{ color: ACCENT }} /> Catatan
        </h3>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Instruksi pengiriman, catatan khusus…" rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = ACCENT}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#EF4444', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Footer submit */}
      <div style={{ background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Total Order · {items.length} item</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: ACCENT, margin: 0, letterSpacing: '-0.02em' }}>{fmtRp(total)}</p>
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

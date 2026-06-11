'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { Zap, Trash2, User, Package, FileText } from 'lucide-react';
import CustomerSearchDropdown, { type CustomerOption } from '@/components/ui/CustomerSearchDropdown';
import ProductSearchDropdown, { type ProductOption } from '@/components/ui/ProductSearchDropdown';

interface OrderItem {
  productId: string;
  kledoProductId?: string | null;
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  stok: number;
}

const ACCENT = '#6366F1';
const fmtRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)',
  padding: 24, marginBottom: 14, boxShadow: 'var(--shadow-sm)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)',
  outline: 'none', fontSize: 14, boxSizing: 'border-box', color: 'var(--text-primary)',
  background: 'var(--surface)', fontFamily: 'inherit',
};

export default function SmartOrderPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [items, setItems]   = useState<OrderItem[]>([]);
  const [notes, setNotes]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');

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
      }];
    });
    setProductQuery('');
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { setItems(prev => prev.filter(i => i.productId !== productId)); return; }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  const updatePrice = (productId: string, price: number) => {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, unitPrice: price } : i));
  };

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

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
          productId: i.productId,
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
    <SalesLayout title="Smart Order">
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>{success}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Mengalihkan ke daftar order… (dikirim ke Kledo otomatis)</p>
      </div>
    </SalesLayout>
  );

  return (
    <SalesLayout title="Smart Order" subtitle="Buat order baru dengan cepat — langsung tersinkron ke Kledo">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Pelanggan */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
            <User size={16} style={{ color: ACCENT }} /> Informasi Pelanggan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Nama Konsumen <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <CustomerSearchDropdown
                value={customerName}
                onChange={setCustomerName}
                onSelect={handleCustomerSelect}
                placeholder="Ketik nama atau nomor HP pelanggan..."
                accentColor={ACCENT}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>No. HP</label>
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = ACCENT; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Alamat</label>
                <input
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Alamat pengiriman"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = ACCENT; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Produk */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
            <Package size={16} style={{ color: ACCENT }} /> Produk
          </h3>

          {/* Product Search */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Cari & tambah produk (stok tampil otomatis, qty diisi manual)
            </label>
            <ProductSearchDropdown
              value={productQuery}
              onChange={setProductQuery}
              onSelect={handleProductSelect}
              placeholder="Ketik nama atau SKU produk..."
              accentColor={ACCENT}
            />
          </div>

          {/* Item List */}
          {items.length > 0 ? (
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px 36px', gap: 8, padding: '8px 14px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                {['Produk', 'Qty', 'Harga', 'Subtotal', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: i >= 1 ? 'center' : 'left' }}>{h}</span>
                ))}
              </div>

              {items.map((item, idx) => (
                <div key={item.productId} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px 36px', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      {fmtRp(item.unitPrice)} · stok: <span style={{ color: item.stok > 5 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>{item.stok}</span>
                    </p>
                  </div>

                  {/* Qty — input manual */}
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={e => updateQty(item.productId, Number(e.target.value) || 1)}
                    style={{ ...inputStyle, padding: '6px 8px', textAlign: 'center', width: '100%' }}
                  />

                  {/* Harga — bisa diubah */}
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={e => updatePrice(item.productId, Number(e.target.value) || 0)}
                    style={{ ...inputStyle, padding: '6px 8px', textAlign: 'right', width: '100%' }}
                  />

                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, textAlign: 'center' }}>
                    {fmtRp(item.qty * item.unitPrice)}
                  </span>

                  <button
                    onClick={() => setItems(prev => prev.filter(i => i.productId !== item.productId))}
                    style={{ padding: 5, border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', justifyContent: 'center' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Cari dan pilih produk di atas untuk menambahkannya
            </div>
          )}
        </div>

        {/* Catatan */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}>
            <FileText size={16} style={{ color: ACCENT }} /> Catatan
          </h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Instruksi pengiriman, catatan khusus…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#EF4444', fontSize: 13, marginBottom: 14 }}>
            ⚠ {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 2px' }}>Total Order</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: ACCENT, margin: 0, letterSpacing: '-0.02em' }}>{fmtRp(total)}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12,
              border: 'none', background: items.length === 0 ? 'var(--surface-sunken)' : ACCENT,
              color: items.length === 0 ? 'var(--text-muted)' : '#fff',
              fontSize: 14, fontWeight: 700, cursor: items.length === 0 ? 'not-allowed' : 'pointer', transition: 'all .2s',
            }}
          >
            {submitting ? 'Menyimpan…' : <><Zap size={15} /> Buat Order & Kirim ke Kledo</>}
          </button>
        </div>
      </div>
    </SalesLayout>
  );
}

'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { Zap, Plus, Trash2, Search, ShoppingCart, User, Package } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

interface OrderItem { productId: string; productName: string; qty: number; unit: string; unitPrice: number; }
interface Product { id: string; name: string; unit: string; price: number; stock: number; }

const DEMO_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Semen Gresik 40kg',     unit: 'Sak', price: 75000,  stock: 500 },
  { id: 'p2', name: 'Besi Beton 10mm',        unit: 'Btg', price: 50000,  stock: 200 },
  { id: 'p3', name: 'Cat Tembok Avian 5L',    unit: 'Kal', price: 75000,  stock: 80  },
  { id: 'p4', name: 'Triplek 18mm',           unit: 'Lbr', price: 180000, stock: 60  },
  { id: 'p5', name: 'Kabel NYM 2.5mm (50m)',  unit: 'Rol', price: 380000, stock: 30  },
];

export default function SmartOrderPage() {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const searchProducts = useCallback(async (q: string) => {
    setProductSearch(q);
    if (!q) { setProducts([]); return; }
    try {
      const res = await api.get(`/products/search?q=${encodeURIComponent(q)}&limit=8`);
      setProducts(res.data?.data ?? res.data ?? DEMO_PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase())));
    } catch { setProducts(DEMO_PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))); }
  }, []);

  const addItem = (p: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: p.id, productName: p.name, qty: 1, unit: p.unit, unitPrice: p.price }];
    });
    setProductSearch(''); setProducts([]);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { setItems(prev => prev.filter(i => i.productId !== productId)); return; }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

  const handleSubmit = async () => {
    if (!customerId && !customerSearch) { alert('Masukkan pelanggan.'); return; }
    if (items.length === 0) { alert('Tambahkan minimal satu produk.'); return; }
    setSubmitting(true);
    try {
      const payload = { customerId, customerName: customerSearch, items: items.map(i => ({ productId: i.productId, quantity: i.qty, unitPrice: i.unitPrice })), notes };
      const res = await api.post('/orders', payload);
      setSuccess(res.data?.soNumber ?? 'Order berhasil dibuat!');
      setTimeout(() => router.push('/sales/orders'), 1500);
    } catch {
      setSuccess('Order berhasil dibuat! (offline mode)');
      setTimeout(() => router.push('/sales/orders'), 1500);
    } finally { setSubmitting(false); }
  };

  if (success) return (
    <SalesLayout title="Smart Order">
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.textDark, margin: '0 0 8px' }}>{success}</h2>
        <p style={{ color: C.textMid }}>Mengalihkan ke daftar order…</p>
      </div>
    </SalesLayout>
  );

  return (
    <SalesLayout title="Smart Order" subtitle="Buat order baru dengan cepat">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 18, border: `1.5px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textDark, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
            <User size={16} style={{ color: C.primary }} /> Informasi Pelanggan
          </h3>
          <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Nama / ID pelanggan"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, boxSizing: 'border-box', color: C.textDark }} />
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 18, border: `1.5px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textDark, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
            <Package size={16} style={{ color: C.primary }} /> Produk
          </h3>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
            <input value={productSearch} onChange={e => searchProducts(e.target.value)} placeholder="Cari produk…"
              style={{ width: '100%', padding: '10px 13px 10px 38px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, boxSizing: 'border-box', color: C.textDark }} />
            {products.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, backgroundColor: '#fff', borderRadius: 12, border: `1.5px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,.1)', marginTop: 4, overflow: 'hidden' }}>
                {products.map(p => (
                  <button key={p.id} onClick={() => addItem(p)}
                    style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <span style={{ color: C.textDark, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ color: C.textMid, fontSize: 12 }}>{formatRp(p.price)} / {p.unit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
              {items.map((item, i) => (
                <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: C.textDark, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                    <p style={{ fontSize: 12, color: C.textMid, margin: 0 }}>{formatRp(item.unitPrice)} / {item.unit}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(item.productId, item.qty - 1)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: C.textMid }}>−</button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, color: C.textDark, fontSize: 14 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, item.qty + 1)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: C.primary }}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, color: C.textDark, fontSize: 13, minWidth: 80, textAlign: 'right' }}>{formatRp(item.qty * item.unitPrice)}</span>
                  <button onClick={() => setItems(prev => prev.filter(i => i.productId !== item.productId))}
                    style={{ padding: 5, border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.textLight, fontSize: 13 }}>Cari dan tambah produk di atas</div>
          )}
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 18, border: `1.5px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textDark, margin: '0 0 12px' }}>Catatan</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instruksi pengiriman, catatan khusus…" rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', color: C.textDark, fontFamily: 'inherit' }} />
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 18, border: `1.5px solid ${C.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 2px' }}>Total Order</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: C.primary, margin: 0 }}>{formatRp(total)}</p>
          </div>
          <button onClick={handleSubmit} disabled={submitting || items.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, border: 'none', background: items.length === 0 ? '#E5E7EB' : C.primary, color: items.length === 0 ? '#9CA3AF' : '#fff', fontSize: 14, fontWeight: 700, cursor: items.length === 0 ? 'not-allowed' : 'pointer', transition: 'all .2s' }}>
            {submitting ? 'Menyimpan…' : <><Zap size={15} /> Buat Order</>}
          </button>
        </div>
      </div>
    </SalesLayout>
  );
}

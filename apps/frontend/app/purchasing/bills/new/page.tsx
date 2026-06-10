'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ModernLayout } from '../../../../components/layout/ModernLayout';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { ArrowLeft, Plus, Trash2, Save, Building2, Package, Search } from 'lucide-react';

interface Supplier { id: string; name: string; code?: string }
interface Product  { id: string; name: string; sku?: string; hargaBeli?: number; stok?: number }
interface LineItem  { productId: string; productName: string; qty: number; unitPrice: number; subtotal: number }

const IDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function NewBillPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDrop, setShowSupplierDrop] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', productName: '', qty: 1, unitPrice: 0, subtotal: 0 }]);
  const [loading, setLoading] = useState(false);
  const [prodSearch, setProdSearch] = useState<string[]>(['']);
  const [showProdDrop, setShowProdDrop] = useState<boolean[]>([false]);

  useEffect(() => {
    api.get('/purchasing/suppliers', { params: { limit: 100 } }).then(r => setSuppliers(r.data.data ?? []));
    api.get('/products', { params: { limit: 200 } }).then(r => setProducts(r.data.data ?? r.data ?? []));
  }, []);

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  const filteredProducts  = (idx: number) => products.filter(p => p.name.toLowerCase().includes((prodSearch[idx] ?? '').toLowerCase())).slice(0, 10);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const updateItem = (idx: number, field: keyof LineItem, val: any) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      if (field === 'qty' || field === 'unitPrice') updated.subtotal = Number(updated.qty) * Number(updated.unitPrice);
      return updated;
    }));
  };

  const selectProduct = (idx: number, prod: Product) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const unitPrice = Number(prod.hargaBeli ?? 0);
      return { ...it, productId: prod.id, productName: prod.name, unitPrice, subtotal: unitPrice * Number(it.qty) };
    }));
    setProdSearch(prev => prev.map((s, i) => i === idx ? prod.name : s));
    setShowProdDrop(prev => prev.map((_, i) => i === idx ? false : _));
  };

  const addItem = () => {
    setItems(prev => [...prev, { productId: '', productName: '', qty: 1, unitPrice: 0, subtotal: 0 }]);
    setProdSearch(prev => [...prev, '']);
    setShowProdDrop(prev => [...prev, false]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    setProdSearch(prev => prev.filter((_, i) => i !== idx));
    setShowProdDrop(prev => prev.filter((_, i) => i !== idx));
  };

  const grandTotal = items.reduce((s, it) => s + Number(it.subtotal), 0);

  const submit = async () => {
    if (!supplierId) return alert('Pilih supplier terlebih dahulu');
    if (items.some(it => !it.productId)) return alert('Semua item harus dipilih produknya');
    setLoading(true);
    try {
      await api.post('/purchasing/bills', {
        supplierId,
        dueDate: dueDate || undefined,
        note,
        items: items.map(it => ({ productId: it.productId, nama: it.productName, qty: it.qty, unitPrice: it.unitPrice, subtotal: it.subtotal })),
      });
      router.push('/purchasing/bills');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Gagal membuat bill');
    } finally { setLoading(false); }
  };

  return (
    <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Buat Vendor Bill">
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={14} /> Kembali
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#5D4037' }}>Vendor Bill Baru</h2>
        </div>

        {/* Supplier & Tanggal */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 6 }}>Supplier *</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Building2 size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                <input
                  value={supplierId ? (selectedSupplier?.name ?? '') : supplierSearch}
                  onChange={e => { setSupplierSearch(e.target.value); setSupplierId(''); setShowSupplierDrop(true); }}
                  onFocus={() => setShowSupplierDrop(true)}
                  placeholder="Cari supplier…"
                  style={{ width: '100%', paddingLeft: 30, paddingRight: 10, height: 36, borderRadius: 7, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              {showSupplierDrop && filteredSuppliers.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 7, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                  {filteredSuppliers.slice(0, 8).map(s => (
                    <div key={s.id} onClick={() => { setSupplierId(s.id); setSupplierSearch(s.name); setShowSupplierDrop(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9F5F0')} onMouseLeave={e => (e.currentTarget.style.background = '')}>{s.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 6 }}>Jatuh Tempo</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', height: 36, borderRadius: 7, border: '1px solid #E0E0E0', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 6 }}>Catatan</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ width: '100%', borderRadius: 7, border: '1px solid #E0E0E0', padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Items */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F3F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#5D4037' }}>Item Tagihan</span>
            <button onClick={addItem} style={{ padding: '5px 12px', borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={13} /> Tambah Item
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9F5F0' }}>
                {['Produk', 'Qty', 'Harga Beli (Rp)', 'Subtotal', ''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5D4037' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #F3F3F3' }}>
                  <td style={{ padding: '8px 12px', width: '40%' }}>
                    <div style={{ position: 'relative' }}>
                      <input value={item.productId ? item.productName : prodSearch[idx] ?? ''} onChange={e => { setProdSearch(prev => prev.map((s, i) => i === idx ? e.target.value : s)); setShowProdDrop(prev => prev.map((_, i) => i === idx ? true : _)); updateItem(idx, 'productId', ''); }} onFocus={() => setShowProdDrop(prev => prev.map((_, i) => i === idx ? true : _))} placeholder="Cari produk…" style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 8px', fontSize: 12, boxSizing: 'border-box' }} />
                      {showProdDrop[idx] && filteredProducts(idx).length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 50, maxHeight: 160, overflowY: 'auto' }}>
                          {filteredProducts(idx).map(p => (
                            <div key={p.id} onMouseDown={() => selectProduct(idx, p)} style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12 }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#F9F5F0')} onMouseLeave={e => (e.currentTarget.style.background = '')}>{p.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', width: '12%' }}>
                    <input type="number" min={1} value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 8px', fontSize: 12, boxSizing: 'border-box' }} />
                  </td>
                  <td style={{ padding: '8px 12px', width: '22%' }}>
                    <input type="number" min={0} value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 8px', fontSize: 12, boxSizing: 'border-box' }} />
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#5D4037' }}>{IDR(item.subtotal)}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <button onClick={() => removeItem(idx)} style={{ padding: 5, borderRadius: 5, border: 'none', background: '#FFEBEE', cursor: 'pointer', color: '#C62828' }}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '14px 20px', borderTop: '1px solid #F3F3F3', textAlign: 'right' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#5D4037' }}>Total: {IDR(grandTotal)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => router.back()} style={{ padding: '8px 20px', borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Batal</button>
          <button onClick={submit} disabled={loading} style={{ padding: '8px 20px', borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} /> {loading ? 'Menyimpan…' : 'Simpan Bill'}
          </button>
        </div>
      </div>
    </ModernLayout>
  );
}

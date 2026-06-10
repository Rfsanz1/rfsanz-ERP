'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Plus, Search, RefreshCw, RotateCcw, CheckSquare, Trash2, Building2 } from 'lucide-react';

const IDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',      color: '#78909C' },
  submitted: { label: 'Dikirim',    color: '#1976D2' },
  validated: { label: 'Divalidasi', color: '#388E3C' },
  cancelled: { label: 'Dibatalkan', color: '#BDBDBD' },
};

export default function PurchaseReturnsPage() {
  const [data, setData]         = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products,  setProducts]  = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ supplierId: '', note: '', items: [{ productId: '', nama: '', qty: 1, unitPrice: 0, subtotal: 0 }] });
  const [saving, setSaving]     = useState(false);
  const [actionId, setActionId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/purchasing/returns', { params: { search, status, page, limit: 20 } });
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, status, page]);
  useEffect(() => {
    api.get('/purchasing/suppliers', { params: { limit: 100 } }).then(r => setSuppliers(r.data.data ?? []));
    api.get('/products', { params: { limit: 200 } }).then(r => setProducts(r.data.data ?? r.data ?? []));
  }, []);

  const totalPages = Math.ceil(total / 20);

  const updateItem = (idx: number, field: string, val: any) => {
    setForm(f => ({ ...f, items: f.items.map((it, i) => {
      if (i !== idx) return it;
      const updated: any = { ...it, [field]: val };
      if (field === 'qty' || field === 'unitPrice') updated.subtotal = Number(updated.qty) * Number(updated.unitPrice);
      if (field === 'productId') { const p = products.find(p => p.id === val); if (p) { updated.nama = p.name; updated.unitPrice = Number(p.hargaBeli ?? 0); updated.subtotal = updated.unitPrice * updated.qty; } }
      return updated;
    }) }));
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', nama: '', qty: 1, unitPrice: 0, subtotal: 0 }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const grandTotal = form.items.reduce((s, it) => s + Number(it.subtotal), 0);

  const submit = async () => {
    if (!form.supplierId) return alert('Pilih supplier');
    setSaving(true);
    try {
      await api.post('/purchasing/returns', { supplierId: form.supplierId, note: form.note, items: form.items });
      setShowForm(false);
      setForm({ supplierId: '', note: '', items: [{ productId: '', nama: '', qty: 1, unitPrice: 0, subtotal: 0 }] });
      load();
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Gagal'); }
    finally { setSaving(false); }
  };

  const doValidate = async (id: string) => {
    if (!confirm('Validasi akan mengurangi stok. Lanjutkan?')) return;
    setActionId(id);
    try { await api.post(`/purchasing/returns/${id}/validate`); load(); }
    catch (e: any) { alert(e?.response?.data?.message ?? 'Gagal'); }
    finally { setActionId(''); }
  };

  return (
    <ModernLayout config={PURCHASING_CONFIG} navItems={PURCHASING_NAV} pageTitle="Retur Pembelian">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Controls */}
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nomor retur…" style={{ width: '100%', paddingLeft: 32, height: 36, borderRadius: 7, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ height: 36, borderRadius: 7, border: '1px solid #E0E0E0', padding: '0 10px', fontSize: 13 }}>
            <option value="">Semua Status</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={load} style={{ height: 36, width: 36, borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={14} /></button>
          <button onClick={() => setShowForm(true)} style={{ height: 36, borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', padding: '0 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Buat Retur
          </button>
        </div>

        {/* Form Buat Retur */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <div style={{ fontWeight: 700, color: '#5D4037', marginBottom: 16, fontSize: 15 }}>Buat Retur Pembelian</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 6 }}>Supplier *</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} style={{ width: '100%', height: 36, borderRadius: 7, border: '1px solid #E0E0E0', padding: '0 10px', fontSize: 13 }}>
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5D4037', display: 'block', marginBottom: 6 }}>Catatan</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ width: '100%', height: 36, borderRadius: 7, border: '1px solid #E0E0E0', padding: '0 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#5D4037' }}>Item Retur</span>
                <button onClick={addItem} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: '#5D4037', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Tambah</button>
              </div>
              {form.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.2fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <select value={it.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} style={{ height: 34, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 8px', fontSize: 12 }}>
                    <option value="">-- Produk --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min={1} value={it.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} placeholder="Qty" style={{ height: 34, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 8px', fontSize: 12 }} />
                  <input type="number" min={0} value={it.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} placeholder="Harga" style={{ height: 34, borderRadius: 6, border: '1px solid #E0E0E0', padding: '0 8px', fontSize: 12 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#5D4037' }}>{IDR(it.subtotal)}</div>
                  <button onClick={() => removeItem(idx)} style={{ padding: 5, borderRadius: 5, border: 'none', background: '#FFEBEE', cursor: 'pointer', color: '#C62828' }}><Trash2 size={13} /></button>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontWeight: 700, color: '#5D4037', marginTop: 8 }}>Total: {IDR(grandTotal)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Batal</button>
              <button onClick={submit} disabled={saving} style={{ padding: '7px 16px', borderRadius: 7, background: '#5D4037', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {saving ? 'Menyimpan…' : 'Simpan Retur'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9F5F0' }}>
                {['No. Retur', 'Supplier', 'Total', 'Status', 'Dibuat', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5D4037' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Memuat…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Belum ada retur pembelian</td></tr>
              ) : data.map(ret => {
                const meta = STATUS_META[ret.status] ?? { label: ret.status, color: '#888' };
                return (
                  <tr key={ret.id} style={{ borderTop: '1px solid #F3F3F3' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#5D4037' }}>{ret.noReturn}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{ret.supplier?.name ?? '-'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{IDR(Number(ret.totalAmount))}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: meta.color + '22', color: meta.color }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#888' }}>{new Date(ret.createdAt).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {ret.status === 'draft' && (
                        <button onClick={() => doValidate(ret.id)} disabled={actionId === ret.id} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, border: 'none', background: '#388E3C', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckSquare size={12} /> Validasi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '14px 0', borderTop: '1px solid #F3F3F3' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E0E0E0', background: p === page ? '#5D4037' : '#fff', color: p === page ? '#fff' : '#444', cursor: 'pointer', fontSize: 12 }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
}

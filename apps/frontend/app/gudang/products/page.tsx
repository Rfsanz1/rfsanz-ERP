'use client';
import { useEffect, useState, useCallback } from 'react';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { Package, Search, RefreshCw, AlertTriangle } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const DEMO: any[] = [
  { id: 'p1', sku: 'SGR-40', name: 'Semen Gresik 40kg',     category: 'Material', unit: 'Sak', stock: 485, minStock: 100, location: 'A-01' },
  { id: 'p2', sku: 'BB-10',  name: 'Besi Beton 10mm',       category: 'Material', unit: 'Btg', stock: 82,  minStock: 50,  location: 'B-03' },
  { id: 'p3', sku: 'CAT-5',  name: 'Cat Tembok Avian 5L',   category: 'Cat',      unit: 'Kal', stock: 28,  minStock: 30,  location: 'C-02' },
  { id: 'p4', sku: 'TRP-18', name: 'Triplek 18mm',          category: 'Kayu',     unit: 'Lbr', stock: 55,  minStock: 20,  location: 'D-01' },
  { id: 'p5', sku: 'PVC-25', name: 'Pipa PVC 2.5 inch',     category: 'Pipa',     unit: 'Btg', stock: 12,  minStock: 40,  location: 'E-02' },
  { id: 'p6', sku: 'KAB-25', name: 'Kabel NYM 2.5mm (50m)', category: 'Listrik',  unit: 'Rol', stock: 18,  minStock: 15,  location: 'F-03' },
];

export default function ProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/products?limit=100');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categories = [...new Set(rows.map(r => r.category).filter(Boolean))];
  const filtered = rows.filter(r =>
    (!categoryFilter || r.category === categoryFilter) &&
    (!showLowOnly || (r.stock ?? 0) <= (r.minStock ?? 0)) &&
    (!search || (r.name + (r.sku ?? '') + (r.category ?? '')).toLowerCase().includes(search.toLowerCase()))
  );
  const lowStockCount = rows.filter(r => (r.stock ?? 0) <= (r.minStock ?? 0)).length;

  return (
    <GudangLayout title="Cek Stok" subtitle="Monitor stok semua produk">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>Cek Stok</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: 0 }}>{rows.length} produk terdaftar{lowStockCount > 0 ? ` · ${lowStockCount} stok kritis` : ''}</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {lowStockCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, backgroundColor: '#FEF3C7', border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
          <AlertTriangle size={16} style={{ color: C.primary, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: C.dark, fontWeight: 600, margin: 0 }}>{lowStockCount} produk di bawah stok minimum. Segera lakukan pemesanan ulang.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / SKU / kategori…"
            style={{ width: '100%', height: 48, padding: '0 14px 0 42px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, boxSizing: 'border-box', color: C.dark, backgroundColor: '#fff' }} />
        </div>
        {categories.length > 0 && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ height: 48, padding: '0 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, cursor: 'pointer', color: C.textMid, backgroundColor: '#fff' }}>
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', height: 48, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${showLowOnly ? C.primary : C.border}`, backgroundColor: showLowOnly ? `${C.primary}10` : '#fff' }}>
          <input type="checkbox" checked={showLowOnly} onChange={e => setShowLowOnly(e.target.checked)} style={{ accentColor: C.primary, width: 16, height: 16 }} />
          <span style={{ fontSize: 13.5, fontWeight: 500, color: showLowOnly ? C.dark : C.textMid, whiteSpace: 'nowrap' }}>Stok Kritis</span>
        </label>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}`, backgroundColor: C.bg }}>
                {['SKU', 'Nama Produk', 'Kategori', 'Lokasi', 'Stok', 'Min. Stok', 'Status'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.textLight }}>Memuat…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: C.textLight }}>Tidak ada produk</td></tr>
              : filtered.map(r => {
                const isLow = (r.stock ?? 0) <= (r.minStock ?? 0);
                const pct = r.minStock > 0 ? Math.min((r.stock / r.minStock) * 100, 200) : 100;
                return (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: isLow ? 'rgba(217,119,6,.03)' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = isLow ? 'rgba(217,119,6,.07)' : '#FFFBEB')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = isLow ? 'rgba(217,119,6,.03)' : 'transparent')}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: C.primary, fontFamily: 'monospace', fontSize: 12.5 }}>{r.sku}</td>
                    <td style={{ padding: '14px 16px', color: C.dark, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '14px 16px', color: C.textMid }}>{r.category ?? '–'}</td>
                    <td style={{ padding: '14px 16px', color: C.textMid }}>{r.location ?? '–'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: isLow ? '#DC2626' : C.dark }}>{r.stock}</span>
                        <span style={{ fontSize: 12, color: C.textLight }}>{r.unit}</span>
                      </div>
                      <div style={{ width: 60, height: 4, borderRadius: 100, backgroundColor: '#F3F4F6', marginTop: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: pct < 100 ? '#EF4444' : pct < 150 ? '#F59E0B' : '#22C55E', borderRadius: 100 }} />
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: C.textMid }}>{r.minStock ?? '–'} {r.unit}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {isLow ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: '#DC2626', backgroundColor: 'rgba(220,38,38,.12)' }}>KRITIS</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: '#22C55E', backgroundColor: 'rgba(34,197,94,.12)' }}>AMAN</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </GudangLayout>
  );
}

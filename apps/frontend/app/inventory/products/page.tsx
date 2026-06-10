'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Package, Search, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function InventoryProductsPage() {
  const [data, setData]       = useState<any[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/products', { params: { search, limit: 50 } });
      const raw = r.data;
      setData(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch { setData([]); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search]);

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
  };

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/products">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Produk &amp; Stok</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Katalog produk dan manajemen stok</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Produk Baru
            </button>
          </div>
        </div>

        {/* Sub-nav tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {[
            { label: 'Semua Produk', href: '/inventory/products', active: true },
            { label: 'Kategori',     href: '/inventory/products/categories', active: false },
          ].map(tab => (
            <Link key={tab.href} href={tab.href}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                background: tab.active ? 'var(--surface)' : 'transparent',
                color: tab.active ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab.active ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s',
              }}
            >{tab.label}</Link>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nama produk / SKU…" />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Produk', 'SKU / Kode', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat produk…</td></tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                      <Package size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Tidak ada produk ditemukan</p>
                    </td>
                  </tr>
                ) : data.map((p: any, i: number) => {
                  const stock = p.stock ?? p.qty ?? 0;
                  const lowStock = stock < 10;
                  return (
                    <tr key={p.id ?? i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div className="flex items-center gap-2.5">
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={14} style={{ color: '#6366F1' }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.code || p.sku || '–'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {Number(p.buyPrice || p.purchase_price || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Number(p.price || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div className="flex items-center gap-1.5">
                          {lowStock && <AlertTriangle size={12} style={{ color: '#F59E0B' }} />}
                          <span style={{ fontSize: 13, fontWeight: 700, color: lowStock ? '#EF4444' : 'var(--text-primary)' }}>{stock}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                        {typeof p.unit === 'object' ? (p.unit?.name || p.unit?.symbol || '–') : (p.unit || p.satuan || '–')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            {data.length} produk
          </div>
        </div>
      </div>
    </AppShell>
  );
}

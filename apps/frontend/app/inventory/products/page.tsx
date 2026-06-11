'use client';
import { useEffect, useState, useCallback } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { kledoService } from '../../../lib/services/kledo';
import { Package, Search, Plus, RefreshCw, AlertTriangle, Zap, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const fmt = (v: number) =>
  Number(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function InventoryProductsPage() {
  const [data, setData]             = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [source, setSource]         = useState<'kledo' | 'local'>('kledo');
  const [kledoConnected, setKledoConnected] = useState<boolean | null>(null);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const PER_PAGE = 50;

  const loadKledo = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await kledoService.getProducts({ page: p, per_page: PER_PAGE, search: q || undefined });
      // Kledo response: { data: { data: [...], total: N, last_page: N } }
      const kledoData = (res as any)?.data;
      const items: any[] = Array.isArray(kledoData?.data)
        ? kledoData.data
        : Array.isArray(kledoData)
        ? kledoData
        : Array.isArray(res)
        ? res as any[]
        : [];
      setData(items);
      setTotal(kledoData?.total ?? items.length);
      setSource('kledo');
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocal = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/products', { params: { search: q, limit: PER_PAGE } });
      const raw = r.data;
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setData(items);
      setTotal(raw?.total ?? items.length);
      setSource('local');
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const load = useCallback(async (p = page, q = search) => {
    if (kledoConnected === null) return;
    if (kledoConnected) {
      await loadKledo(p, q);
    } else {
      await loadLocal(q);
    }
  }, [kledoConnected, page, search, loadKledo, loadLocal]);

  useEffect(() => {
    kledoService.getStatus().then(s => {
      setKledoConnected(s.connected);
    }).catch(() => setKledoConnected(false));
  }, []);

  useEffect(() => {
    if (kledoConnected === null) return;
    setPage(1);
    load(1, search);
  }, [kledoConnected, search]);

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/products">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Produk &amp; Stok</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Katalog produk dan manajemen stok
              {kledoConnected && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#22C55E', background: 'rgba(34,197,94,.1)', padding: '2px 8px', borderRadius: 20 }}>
                  <Zap size={10} style={{ display: 'inline', marginRight: 3 }} />
                  Live dari Kledo
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => load(page, search)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            {kledoConnected && (
              <Link href="/integrations/kledo"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #EDE9FE', background: '#F5F3FF', color: '#5B52D1', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                <ExternalLink size={13} /> Kelola Kledo
              </Link>
            )}
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
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nama produk / SKU…" />
            </div>
            {source === 'kledo' && (
              <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600, whiteSpace: 'nowrap' }}>
                ● Data real-time Kledo
              </span>
            )}
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
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-sunken)', animation: 'pulse 1.5s infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                      <Package size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Tidak ada produk ditemukan</p>
                      {!kledoConnected && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                          Hubungkan Kledo di <Link href="/integrations/kledo" style={{ color: '#6366F1' }}>Integrasi → Kledo</Link> untuk tampilkan produk
                        </p>
                      )}
                    </td>
                  </tr>
                ) : data.map((p: any, i: number) => {
                  const stock = p.stock ?? p.qty ?? 0;
                  const lowStock = stock > 0 && stock < 10;
                  const outOfStock = stock === 0;
                  const buyPrice = p.base_price ?? p.buyPrice ?? p.purchase_price ?? 0;
                  const sellPrice = p.price ?? p.hargaJual ?? 0;
                  const unit = typeof p.unit === 'object'
                    ? (p.unit?.name || p.unit?.symbol || '–')
                    : (p.unit || p.satuan || '–');
                  return (
                    <tr key={p.id ?? i}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
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
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmt(buyPrice)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(sellPrice)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div className="flex items-center gap-1.5">
                          {lowStock && <AlertTriangle size={12} style={{ color: '#F59E0B' }} />}
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: outOfStock ? '#EF4444' : lowStock ? '#F59E0B' : 'var(--text-primary)',
                          }}>
                            {stock}
                          </span>
                          {outOfStock && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', background: 'rgba(239,68,68,.1)', padding: '1px 6px', borderRadius: 10 }}>Habis</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer: count + pagination */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>{total} produk{source === 'kledo' ? ' dari Kledo' : ''}</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => { const p = page - 1; setPage(p); load(p, search); }}
                  style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                >‹ Sebelumnya</button>
                <span style={{ fontSize: 12 }}>Hal {page} / {totalPages}</span>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => { const p = page + 1; setPage(p); load(p, search); }}
                  style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
                >Berikutnya ›</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

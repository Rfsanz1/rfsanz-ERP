'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Package, Search, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const fmt = (v: number | string) =>
  Number(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const PER_PAGE = 50;

export default function InventoryProductsPage() {
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  const load = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const r = await api.get('/kledo/products', {
        params: { page: p, per_page: PER_PAGE, ...(q ? { name: q } : {}) },
      });
      const kd = r.data?.data ?? r.data;
      setData(Array.isArray(kd?.data) ? kd.data : []);
      setTotal(kd?.total ?? 0);
      setLastPage(kd?.last_page ?? 1);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, ''); }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const goPage = (p: number) => { setPage(p); load(p, search); };

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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Produk &amp; Stok
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Katalog produk dari Kledo
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load(page, search)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Produk Baru
            </button>
          </div>
        </div>

        {/* Sub-nav */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {[
            { label: 'Semua Produk', href: '/inventory/products', active: true },
            { label: 'Kategori',     href: '/inventory/products/categories', active: false },
          ].map(tab => (
            <Link key={tab.href} href={tab.href}
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: tab.active ? 'var(--surface)' : 'transparent', color: tab.active ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: tab.active ? 'var(--shadow-xs)' : 'none' }}
            >{tab.label}</Link>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

          {/* Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', maxWidth: 340, flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama produk / kode…"
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {total > 0 ? `${total.toLocaleString('id-ID')} produk` : ''}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Produk / Kode', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan', 'Gudang'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-sunken)', width: j === 0 ? '60%' : '40%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                      <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Tidak ada produk</p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        {search ? `Tidak ditemukan hasil untuk "${search}"` : 'Tidak ada produk dari Kledo.'}
                      </p>
                    </td>
                  </tr>
                ) : data.map((p: any, i: number) => {
                  const stok   = Number(p.qty ?? 0);
                  const habis  = stok === 0;
                  const menipis = stok > 0 && stok < 10;
                  const satuan  = p.unit?.name ?? '–';
                  // Ringkas daftar gudang jadi satu baris
                  const gudangList: string = (p.warehouse_qty ?? [])
                    .filter((w: any) => w.qty > 0)
                    .map((w: any) => `${w.name} (${w.qty})`)
                    .join(', ') || '–';

                  return (
                    <tr key={p.id ?? i}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      {/* Nama & kode */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={14} style={{ color: '#6366F1' }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                            <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.code ?? '–'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Harga beli */}
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {fmt(p.base_price ?? 0)}
                      </td>

                      {/* Harga jual */}
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {fmt(p.price ?? 0)}
                      </td>

                      {/* Stok */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {menipis && !habis && <AlertTriangle size={12} style={{ color: '#F59E0B' }} />}
                          <span style={{ fontSize: 13, fontWeight: 700, color: habis ? '#EF4444' : menipis ? '#F59E0B' : 'var(--text-primary)' }}>
                            {stok.toLocaleString('id-ID')}
                          </span>
                          {habis && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', background: 'rgba(239,68,68,.1)', padding: '1px 6px', borderRadius: 10 }}>Habis</span>
                          )}
                        </div>
                      </td>

                      {/* Satuan */}
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                        {satuan}
                      </td>

                      {/* Gudang */}
                      <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 200 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {gudangList}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {data.length} dari {total.toLocaleString('id-ID')} produk — hal {page} / {lastPage}
            </span>
            {lastPage > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button disabled={page <= 1 || loading} onClick={() => goPage(page - 1)}
                  style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.45 : 1 }}>
                  ‹ Sebelumnya
                </button>
                <button disabled={page >= lastPage || loading} onClick={() => goPage(page + 1)}
                  style={{ padding: '4px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, cursor: page >= lastPage ? 'not-allowed' : 'pointer', opacity: page >= lastPage ? 0.45 : 1 }}>
                  Berikutnya ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

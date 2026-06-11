'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Package, Search, Plus, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const fmt = (v: number | string) =>
  Number(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const PAGE_SIZES = [15, 25, 50, 100];

function getPageNumbers(current: number, last: number): (number | '...')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) pages.push(i);
  if (current < last - 2) pages.push('...');
  pages.push(last);
  return pages;
}

export default function InventoryProductsPage() {
  const [data, setData]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [perPage, setPerPage]   = useState(25);

  const load = async (p = 1, q = '', pp = perPage) => {
    setLoading(true);
    try {
      const r = await api.get('/kledo/products', {
        params: { page: p, per_page: pp, ...(q ? { name: q } : {}) },
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

  useEffect(() => { load(1, '', perPage); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search, perPage); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const goPage = (p: number) => { setPage(p); load(p, search, perPage); };

  const handlePerPage = (pp: number) => {
    setPerPage(pp);
    setPage(1);
    load(1, search, pp);
  };

  const pageNums = getPageNumbers(page, lastPage);

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
  };

  const btnBase: React.CSSProperties = {
    minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)',
    fontSize: 13, cursor: 'pointer', padding: '0 8px', transition: 'all .12s',
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
            <button onClick={() => load(page, search, perPage)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
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
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: tab.active ? 'var(--surface)' : 'transparent', color: tab.active ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: tab.active ? 'var(--shadow-xs)' : 'none' }}>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

          {/* Toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', maxWidth: 340, flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama produk / kode…"
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
            </div>
            {total > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Total {total.toLocaleString('id-ID')} data
              </span>
            )}
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
                  Array.from({ length: perPage > 25 ? 10 : perPage }).map((_, i) => (
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
                  const stok    = Number(p.qty ?? 0);
                  const habis   = stok === 0;
                  const menipis = stok > 0 && stok < 10;
                  const satuan  = p.unit?.name ?? '–';
                  const gudangList = (p.warehouse_qty ?? [])
                    .filter((w: any) => w.qty > 0)
                    .map((w: any) => `${w.name} (${w.qty})`)
                    .join(', ') || '–';

                  return (
                    <tr key={p.id ?? i}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={13} style={{ color: '#6366F1' }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                            <p style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.code ?? '–'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmt(p.base_price ?? 0)}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(p.price ?? 0)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {menipis && !habis && <AlertTriangle size={12} style={{ color: '#F59E0B' }} />}
                          <span style={{ fontSize: 13, fontWeight: 700, color: habis ? '#EF4444' : menipis ? '#F59E0B' : 'var(--text-primary)' }}>
                            {stok.toLocaleString('id-ID')}
                          </span>
                          {habis && <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', background: 'rgba(239,68,68,.1)', padding: '1px 6px', borderRadius: 10 }}>Habis</span>}
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{satuan}</td>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 180 }}>
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

        </div>

        {/* Pagination — di luar table card agar tidak terhalang bottom nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '4px 2px' }}>

          {/* Kiri: total */}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Total {total.toLocaleString('id-ID')} data
          </span>

          {/* Tengah: nomor halaman */}
          {lastPage > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button disabled={page <= 1 || loading} onClick={() => goPage(page - 1)}
                style={{ ...btnBase, color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', opacity: page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} />
              </button>

              {pageNums.map((n, idx) =>
                n === '...' ? (
                  <span key={`dots-${idx}`} style={{ width: 32, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>…</span>
                ) : (
                  <button key={n} onClick={() => goPage(n as number)}
                    style={{
                      ...btnBase,
                      background: page === n ? '#6366F1' : 'var(--surface)',
                      color:      page === n ? '#fff'     : 'var(--text-primary)',
                      border:     page === n ? 'none'     : '1px solid var(--border)',
                      fontWeight: page === n ? 700 : 400,
                    }}>
                    {n}
                  </button>
                )
              )}

              <button disabled={page >= lastPage || loading} onClick={() => goPage(page + 1)}
                style={{ ...btnBase, color: page >= lastPage ? 'var(--text-muted)' : 'var(--text-primary)', opacity: page >= lastPage ? 0.4 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Kanan: per-page selector */}
          <select value={perPage} onChange={e => handlePerPage(Number(e.target.value))}
            style={{ padding: '5px 28px 5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', outline: 'none' }}>
            {PAGE_SIZES.map(s => (
              <option key={s} value={s}>{s} / halaman</option>
            ))}
          </select>

        </div>

        {/* Spacer untuk bottom nav bar */}
        <div style={{ height: 16 }} />

      </div>
    </AppShell>
  );
}

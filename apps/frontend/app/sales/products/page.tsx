'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SALES_CONFIG, SALES_NAV } from '../../../lib/nav-configs';
import { api } from '@/lib/api';
import { Package, Search, RefreshCw, Link2, Layers } from 'lucide-react';

const C      = '#00ACC1';
const PURPLE = '#6366F1';

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  unit: string;
  source: 'local' | 'kledo';
  kledoId?: string;
}

export default function SalesProductsPage() {
  const { token } = useAuthStore();
  const [data, setData]         = useState<Product[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [sourceFilter, setSrc]  = useState<'all' | 'local' | 'kledo'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [localRes, kledoRes] = await Promise.allSettled([
        api.get('/inventory/products', { params: { limit: 200 } }),
        api.get('/kledo/products',     { params: { per_page: 200 } }),
      ]);

      /* Lokal */
      const localRaw: any[] = (() => {
        if (localRes.status !== 'fulfilled') return [];
        const d = localRes.value.data;
        return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      })();
      const localList: Product[] = localRaw.map(p => ({
        id:      String(p.id),
        name:    p.name ?? '',
        code:    p.code ?? p.sku ?? '',
        price:   Number(p.price ?? p.hargaJual ?? 0),
        stock:   Number(p.stock ?? p.qty ?? p.stok ?? 0),
        unit:    typeof p.unit === 'object' ? (p.unit?.name ?? '–') : (p.unit ?? p.satuan ?? '–'),
        source:  'local',
        kledoId: p.kledoId ?? undefined,
      }));

      /* Kledo */
      const kledoRaw: any[] = (() => {
        if (kledoRes.status !== 'fulfilled') return [];
        const d = kledoRes.value.data;
        const inner = d?.data ?? d;
        return Array.isArray(inner?.data) ? inner.data : Array.isArray(inner) ? inner : [];
      })();
      const localKledoIds = new Set(localList.map(p => p.kledoId).filter(Boolean));
      const localNames    = new Set(localList.map(p => p.name.toLowerCase().trim()));

      const kledoList: Product[] = kledoRaw
        .filter((p: any) => !localKledoIds.has(String(p.id)) && !localNames.has((p.name ?? '').toLowerCase().trim()))
        .map((p: any) => ({
          id:      `kledo-${p.id}`,
          name:    p.name ?? '',
          code:    p.code ?? p.product_code ?? '',
          price:   Number(p.price ?? p.sell_price ?? 0),
          stock:   Number(p.stock ?? p.qty ?? 0),
          unit:    typeof p.unit === 'object' ? (p.unit?.name ?? '–') : (p.unit ?? '–'),
          source:  'kledo' as const,
          kledoId: String(p.id),
        }));

      setData([...localList, ...kledoList]);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) load(); }, [token, load]);


  const filtered = data.filter(p => {
    const matchSrc = sourceFilter === 'all' || p.source === sourceFilter;
    const matchSearch = !search || (p.name + p.code).toLowerCase().includes(search.toLowerCase());
    return matchSrc && matchSearch;
  });

  const localCount = data.filter(p => p.source === 'local').length;
  const kledoCount = data.filter(p => p.source === 'kledo').length;

  return (
    <AppShell {...SALES_CONFIG} navItems={SALES_NAV} activeHref="/sales/products">
      <div className="p-6 space-y-5 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Katalog Produk</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {localCount} produk lokal · {kledoCount} produk Kledo · total {data.length}
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
            <input className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
              style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', background: '#fff' }}
              placeholder="Cari produk atau kode..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Source toggle */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F3F4F6' }}>
            {([['all', 'Semua', ''], ['local', 'Lokal', C], ['kledo', 'Kledo', PURPLE]] as [typeof sourceFilter, string, string][]).map(([k, label, color]) => (
              <button key={k} onClick={() => setSrc(k)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: sourceFilter === k ? '#fff' : 'transparent',
                  color: sourceFilter === k ? (color || '#1E1B4B') : '#9CA3AF',
                  boxShadow: sourceFilter === k ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total Produk', value: data.length, color: '#1E1B4B' },
            { label: 'Stok Aman',   value: data.filter(p => p.stock >= 10).length, color: '#22C55E' },
            { label: 'Stok Rendah', value: data.filter(p => p.stock > 0 && p.stock < 10).length, color: '#F59E0B' },
            { label: 'Habis',       value: data.filter(p => p.stock <= 0).length, color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: s.color + '10', border: `1.5px solid ${s.color}25` }}>
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{s.label}</span>
              <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', background: '#FDFCFF' }}>
                  {['Produk', 'Kode / SKU', 'Harga Jual', 'Stok', 'Satuan', 'Sumber'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat produk…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>Tidak ada produk ditemukan</td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F5F3FF' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FDFCFF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                    {/* Nama */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
                          style={{ background: p.source === 'kledo' ? `${PURPLE}12` : `${C}12` }}>
                          <Package className="h-3.5 w-3.5" style={{ color: p.source === 'kledo' ? PURPLE : C }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{p.name}</span>
                      </div>
                    </td>

                    {/* Kode */}
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{p.code || '–'}</td>

                    {/* Harga */}
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>
                      {p.price > 0 ? p.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }) : '–'}
                    </td>

                    {/* Stok */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold"
                        style={{ color: p.stock <= 0 ? '#EF4444' : p.stock < 10 ? '#F59E0B' : '#22C55E' }}>
                        {p.stock}
                      </span>
                    </td>

                    {/* Satuan */}
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{p.unit}</td>

                    {/* Sumber */}
                    <td className="px-5 py-3.5">
                      {p.source === 'kledo' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: `${PURPLE}12`, color: PURPLE }}>
                          <Link2 className="h-2.5 w-2.5" /> Kledo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: `${C}12`, color: C }}>
                          <Layers className="h-2.5 w-2.5" /> Lokal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

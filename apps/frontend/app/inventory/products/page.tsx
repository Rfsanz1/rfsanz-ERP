'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Package, Search, Plus, RefreshCw } from 'lucide-react';

export default function InventoryProductsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/products', { params: { search, limit: 50 } });
      const raw = r.data;
      setData(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch { setData([]); } finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [token, search]);
  if (!token) return null;

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/products">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Produk & Stok</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Katalog produk dan manajemen stok</p></div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ border: '1.5px solid #EDE8F5', color: '#9CA3AF' }}><RefreshCw className="h-4 w-4" /></button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: INVENTORY_CONFIG.appColor }}><Plus className="h-4 w-4" /> Produk Baru</button>
          </div>
        </div>

        {/* sub-nav */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F5F2FB' }}>
          <a href="/inventory/products" className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'white', color: '#1E1B4B', boxShadow: '0 1px 3px rgba(47,43,61,.1)' }}>Semua Produk</a>
          <a href="/inventory/products/categories" className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ color: '#9CA3AF' }}>Kategori</a>
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Produk', 'SKU / Kode', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>Memuat produk...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: '#9CA3AF' }}>Tidak ada produk ditemukan</td></tr>
                ) : data.map((p: any, i: number) => (
                  <tr key={p.id ?? i} style={{ borderBottom: i < data.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{p.name}</td>
                    <td className="px-6 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{p.code || p.sku || '–'}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#9CA3AF' }}>{Number(p.buyPrice || p.purchase_price || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{Number(p.price || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: (p.stock ?? p.qty ?? 0) < 10 ? '#EA5455' : '#1E1B4B' }}>{p.stock ?? p.qty ?? 0}</td>
                    <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{typeof p.unit === 'object' ? (p.unit?.name || p.unit?.symbol || '–') : (p.unit || p.satuan || '–')}</td>
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

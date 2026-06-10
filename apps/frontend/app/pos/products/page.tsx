'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { POS_CONFIG, POS_NAV } from '../../../lib/nav-configs';
import { Package, Plus, Search } from 'lucide-react';

const PRODUCTS = [
  { name: 'Semen Portland 40kg', sku: 'SEM-001', price: 'Rp 50.000', stock: 84,  emoji: '🏗️', active: true },
  { name: 'Cat Tembok Dulux 5L', sku: 'CAT-023', price: 'Rp 55.000', stock: 3,   emoji: '🎨', active: true },
  { name: 'Pipa PVC 4 inch',     sku: 'PIP-007', price: 'Rp 25.000', stock: 45,  emoji: '🚰', active: true },
  { name: 'Besi Beton 10mm',     sku: 'BES-012', price: 'Rp 50.000', stock: 120, emoji: '⚙️', active: true },
  { name: 'Keramik 60x60 Putih', sku: 'KER-004', price: 'Rp 40.000', stock: 18,  emoji: '🪟', active: true },
  { name: 'Triplek 9mm 4x8',     sku: 'KAY-008', price: 'Rp 85.000', stock: 32,  emoji: '🌲', active: false },
];

export default function PosProductsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...POS_CONFIG} navItems={POS_NAV} activeHref="/pos/products">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Produk POS</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Produk yang tersedia di kasir</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: POS_CONFIG.appColor }}><Plus className="h-4 w-4" /> Tambah Produk</button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari produk..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Produk', 'SKU', 'Harga', 'Stok', 'Aktif di POS'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {PRODUCTS.map((p, i) => (
                  <tr key={p.sku} style={{ borderBottom: i < PRODUCTS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{p.emoji}</span>
                        <span className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{p.sku}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{p.price}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: p.stock < 10 ? '#EA5455' : '#1E1B4B' }}>{p.stock}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: p.active ? '#4CAF50' : '#9CA3AF', backgroundColor: p.active ? 'rgba(76,175,80,.1)' : 'rgba(165,163,174,.12)' }}>
                        {p.active ? 'Aktif' : 'Nonaktif'}
                      </span>
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

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../../lib/nav-configs';
import { Tag, Plus } from 'lucide-react';

const CATEGORIES = [
  { name: 'Semen & Bahan Bangunan', slug: 'semen',     produk: 42, icon: '🏗️' },
  { name: 'Cat & Pelapis',          slug: 'cat',       produk: 28, icon: '🎨' },
  { name: 'Pipa & Sanitasi',        slug: 'pipa',      produk: 35, icon: '🚰' },
  { name: 'Besi & Baja',            slug: 'besi',      produk: 19, icon: '⚙️' },
  { name: 'Keramik & Granit',       slug: 'keramik',   produk: 54, icon: '🪟' },
  { name: 'Kayu & Triplek',         slug: 'kayu',      produk: 31, icon: '🌲' },
  { name: 'Listrik & Kabel',        slug: 'listrik',   produk: 47, icon: '⚡' },
  { name: 'Atap & Rangka',          slug: 'atap',      produk: 22, icon: '🏠' },
];

export default function ProductCategoriesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/products/categories">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Kategori Produk</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola kategori dan sub-kategori produk</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: INVENTORY_CONFIG.appColor }}><Plus className="h-4 w-4" /> Kategori Baru</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => (
            <div key={c.slug} className="bg-white rounded-2xl p-5 cursor-pointer transition" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = INVENTORY_CONFIG.appColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE8F5'; }}>
              <p className="text-2xl mb-2">{c.icon}</p>
              <p className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{c.name}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{c.produk} produk</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

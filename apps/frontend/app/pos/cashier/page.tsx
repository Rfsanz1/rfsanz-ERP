'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { POS_CONFIG, POS_NAV } from '../../../lib/nav-configs';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react';

const PRODUCTS = [
  { id: 1, name: 'Semen Portland 40kg', price: 50000,  emoji: '🏗️' },
  { id: 2, name: 'Cat Tembok 5L',       price: 55000,  emoji: '🎨' },
  { id: 3, name: 'Pipa PVC 4"',         price: 25000,  emoji: '🚰' },
  { id: 4, name: 'Besi Beton 10mm',     price: 50000,  emoji: '⚙️' },
  { id: 5, name: 'Keramik 60x60',       price: 40000,  emoji: '🪟' },
  { id: 6, name: 'Triplek 9mm',         price: 85000,  emoji: '🌲' },
  { id: 7, name: 'Kabel NYM 2x1.5',    price: 15000,  emoji: '⚡' },
  { id: 8, name: 'Genteng Beton',       price: 8000,   emoji: '🏠' },
];

export default function PosCashierPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [cart, setCart] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);


  const addToCart = (p: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  if (!token) return null;

  return (
    <AppShell {...POS_CONFIG} navItems={POS_NAV} activeHref="/pos/cashier">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Product grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-lg font-bold mb-4" style={{ color: '#1E1B4B' }}>Kasir — Pilih Produk</h1>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PRODUCTS.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="bg-white rounded-2xl p-4 text-left transition"
                style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = POS_CONFIG.appColor; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE8F5'; }}>
                <p className="text-2xl mb-2">{p.emoji}</p>
                <p className="text-xs font-semibold leading-tight" style={{ color: '#1E1B4B' }}>{p.name}</p>
                <p className="text-sm font-bold mt-1" style={{ color: POS_CONFIG.appColor }}>Rp {p.price.toLocaleString('id-ID')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-80 flex flex-col bg-white" style={{ borderLeft: '1.5px solid #EDE8F5' }}>
          <div className="px-4 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" style={{ color: POS_CONFIG.appColor }} />
              <h2 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Keranjang ({cart.length} item)</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: '#9CA3AF' }}>Belum ada item dipilih</p>
            ) : cart.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F5F2FB' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#1E1B4B' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Rp {c.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button onClick={() => updateQty(c.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#F5F2FB' }}><Minus className="h-3 w-3" style={{ color: '#1E1B4B' }} /></button>
                  <span className="text-xs font-bold w-4 text-center" style={{ color: '#1E1B4B' }}>{c.qty}</span>
                  <button onClick={() => updateQty(c.id, +1)} className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: POS_CONFIG.appColor }}><Plus className="h-3 w-3 text-white" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 space-y-3" style={{ borderTop: '1.5px solid #EDE8F5' }}>
            <div className="flex justify-between">
              <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Subtotal</span>
              <span className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>PPN 11%</span>
              <span className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Rp {Math.round(total * 0.11).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
              <span className="text-sm font-bold" style={{ color: '#1E1B4B' }}>TOTAL</span>
              <span className="text-lg font-bold" style={{ color: POS_CONFIG.appColor }}>Rp {Math.round(total * 1.11).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: '#4CAF50' }}>
                <Banknote className="h-4 w-4" /> Tunai
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: POS_CONFIG.appColor }}>
                <CreditCard className="h-4 w-4" /> Transfer
              </button>
            </div>
            <button onClick={() => setCart([])} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium" style={{ color: '#EA5455', border: '1px solid rgba(234,84,85,.25)' }}>
              <Trash2 className="h-3.5 w-3.5" /> Bersihkan
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

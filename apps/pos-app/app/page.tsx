'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/useAuthStore';
import api from '../lib/api';
import { useToast } from '../lib/toast';
import { printReceipt } from '../lib/printReceipt';
import { fmtDate } from '../lib/utils';
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard,
  Banknote, Smartphone, QrCode, Bell, LogOut, Search,
  Package, RefreshCw, X, Tag, Users, Receipt, Printer,
} from 'lucide-react';

const C = '#059669';
const CLT = '#ECFDF5';
const CBG = '#F0FDF4';

interface Product { id: string; name: string; price: number; emoji: string; category: string; stock?: number; }
interface CartItem extends Product { qty: number; }

type PayMethod = 'cash' | 'transfer' | 'card' | 'qris';

const PAY_METHODS = [
  { key: 'cash', label: 'Tunai', icon: Banknote },
  { key: 'transfer', label: 'Transfer', icon: Smartphone },
  { key: 'card', label: 'Kartu', icon: CreditCard },
  { key: 'qris', label: 'QRIS', icon: QrCode },
] as const;
const CATEGORIES = ['Semua', 'Material', 'Cat', 'Plumbing', 'Besi', 'Keramik', 'Kayu', 'Listrik', 'Atap', 'Aksesori'];
const STORAGE_KEY = 'pos_pending_transactions';

const DEMO_PRODUCTS: Product[] = [
  { id: '1', name: 'Semen Portland 40kg', price: 50000, emoji: '🏗️', category: 'Material', stock: 200 },
  { id: '2', name: 'Cat Tembok 5L', price: 55000, emoji: '🎨', category: 'Cat', stock: 50 },
  { id: '3', name: 'Pipa PVC 4"', price: 25000, emoji: '🚰', category: 'Plumbing', stock: 80 },
  { id: '4', name: 'Besi Beton 10mm', price: 50000, emoji: '⚙️', category: 'Besi', stock: 150 },
  { id: '5', name: 'Keramik 60x60', price: 40000, emoji: '🪟', category: 'Keramik', stock: 300 },
  { id: '6', name: 'Triplek 9mm', price: 85000, emoji: '🌲', category: 'Kayu', stock: 40 },
  { id: '7', name: 'Kabel NYM 2x1.5', price: 15000, emoji: '⚡', category: 'Listrik', stock: 500 },
  { id: '8', name: 'Genteng Beton', price: 8000, emoji: '🏠', category: 'Atap', stock: 1000 },
  { id: '9', name: 'Lem Kayu Super', price: 12000, emoji: '🔧', category: 'Aksesori', stock: 100 },
  { id: '10', name: 'Bata Merah', price: 1500, emoji: '🧱', category: 'Material', stock: 5000 },
  { id: '11', name: 'Pasir Halus /kg', price: 2000, emoji: '⬛', category: 'Material', stock: 10000 },
  { id: '12', name: 'Plamir Tembok', price: 35000, emoji: '🪣', category: 'Cat', stock: 60 },
];

export default function POSPage() {
  const { token, user, loadProfile, logout } = useAuthStore();
  const router = useRouter();
  const { show: showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [voucher, setVoucher] = useState('');
  const [discount, setDiscount] = useState(0);
  const [member, setMember] = useState('');
  const [mounted, setMounted] = useState(false);
  const [receipt, setReceipt] = useState<{ no: string; total: number; method: string; offline?: boolean } | null>(null);
  const [offline, setOffline] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [splitPayments, setSplitPayments] = useState<{ method: PayMethod; amount: number }[]>([
    { method: 'cash', amount: 0 },
    { method: 'transfer', amount: 0 },
  ]);
  const [useSplitPayment, setUseSplitPayment] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal - discount + tax;
  const paymentTotal = useSplitPayment ? splitPayments.reduce((sum, item) => sum + item.amount, 0) : Number(cashInput || total);
  const change = payMethod === 'cash' && !useSplitPayment ? Math.max(0, Number(cashInput || 0) - total) : 0;
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    const init = async () => {
      if (!user) {
        await loadProfile().catch(() => { logout(); router.replace('/login'); });
      }

      try {
        const res = await api.get('/pos/products');
        if (Array.isArray(res.data?.data)) {
          setProducts(res.data.data.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            price: Number(item.price ?? 0),
            emoji: item.emoji ?? '🛒',
            category: item.category?.name ?? 'Umum',
            stock: item.stock ?? undefined,
          })));
        }
      } catch (error) {
        console.warn('Unable to fetch POS products', error);
      }

      setLoading(false);
      setTimeout(() => setMounted(true), 60);
    };

    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try { setPendingQueue(JSON.parse(stored)); } catch { setPendingQueue([]); }
    }

    setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    init();

    if (typeof window !== 'undefined') {
      const handleOnline = () => { setOffline(false); syncPendingTransactions(); };
      const handleOffline = () => setOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingQueue));
    }
  }, [pendingQueue]);

  const syncPendingTransactions = async () => {
    if (pendingQueue.length === 0 || offline) return;
    setSyncing(true);
    try {
      await api.post('/pos/transactions/sync', { transactions: pendingQueue });
      setPendingQueue([]);
    } catch (error) {
      console.warn('Sync failed', error);
    } finally {
      setSyncing(false);
    }
  };

  const savePendingTransaction = (payload: any) => {
    setPendingQueue(prev => [...prev, payload]);
  };

  const addToCart = (p: Product) => setCart(prev => {
    const existing = prev.find(item => item.id === p.id);
    return existing ? prev.map(item => item.id === p.id ? { ...item, qty: item.qty + 1 } : item) : [...prev, { ...p, qty: 1 }];
  });

  const updateQty = (id: string, delta: number) =>
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(item => item.qty > 0));

  const handleBarcode = () => {
    if (!barcode) return;
    const match = products.find(p => p.id === barcode || p.name.toLowerCase().includes(barcode.toLowerCase()));
    if (match) addToCart(match);
    setBarcode('');
  };

  const createPayload = () => ({
    customerId: member || undefined,
    items: cart.map(item => ({
      posProductId: item.id,
      nama: item.name,
      qty: item.qty,
      harga: item.price,
      subtotal: item.price * item.qty,
    })),
    totalHarga: subtotal,
    diskon: discount,
    pajak: tax,
    grandTotal: total,
    bayar: useSplitPayment ? paymentTotal : Number(cashInput || total),
    metodeBayar: useSplitPayment ? 'split' : payMethod,
    splitPayments: useSplitPayment ? splitPayments.filter(it => it.amount > 0).map(it => ({ method: it.method, amount: it.amount })) : undefined,
    loyaltyPointsUsed: 0,
    loyaltyPointsEarned: 0,
    status: 'selesai',
  });

  const handleCheckout = async (hold = false) => {
    if (cart.length === 0) {
      showToast('Keranjang kosong, tambahkan produk terlebih dahulu', 'warning');
      return;
    }
    const payload = createPayload();
    const localId = `offline-${Date.now()}`;

    if (offline) {
      savePendingTransaction({ ...payload, noStruk: localId, status: hold ? 'hold' : 'selesai' });
      setReceipt({ no: localId, total, method: hold ? 'Hold' : 'Offline', offline: true });
      showToast(hold ? 'Transaksi disimpan sebagai HOLD' : 'Transaksi disimpan (offline mode)', 'success');
    } else {
      try {
        const res = await api.post(hold ? '/pos/transactions/hold' : '/pos/transactions', payload);
        const receiptNo = res.data?.id || res.data?.noStruk || `TRX-${Date.now()}`;
        setReceipt({ no: receiptNo, total, method: hold ? 'Hold' : PAY_METHODS.find(m => m.key === payMethod)?.label ?? payMethod });
        showToast(hold ? 'Transaksi disimpan sebagai HOLD' : 'Transaksi berhasil', 'success');
      } catch (error: any) {
        const msg = error?.response?.data?.message || 'Transaksi gagal, disimpan untuk sinkronisasi';
        showToast(msg, 'error');
        savePendingTransaction({ ...payload, noStruk: localId, status: hold ? 'hold' : 'selesai' });
        setReceipt({ no: localId, total, method: 'Offline', offline: true });
      }
    }

    setCart([]);
    setCashInput('');
    setVoucher('');
    setDiscount(0);
    setMember('');
    setUseSplitPayment(false);
    setSplitPayments([{ method: 'cash', amount: 0 }, { method: 'transfer', amount: 0 }]);
    setPaying(false);
  };

  const applyVoucher = () => {
    const code = voucher.toUpperCase();
    if (code === 'DISKON10') setDiscount(Math.round(subtotal * 0.1));
    else if (code === 'DISKON50K') setDiscount(50000);
    else alert('Voucher tidak valid');
  };

  useEffect(() => {
    if (!offline && pendingQueue.length > 0) {
      syncPendingTransactions();
    }
  }, [offline, pendingQueue.length]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.warn);
    }
  }, []);

  if (!token || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: CBG }}>
      <svg style={{ width: 28, height: 28, animation: 'spin .8s linear infinite', color: C }} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <circle opacity=".2" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path opacity=".8" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
      </svg>
    </div>
  );

  if (receipt) return (
    <div style={{ minHeight: '100vh', backgroundColor: CBG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: `0 12px 40px ${C}20` }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: CLT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Receipt size={28} style={{ color: C }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#064E3B', margin: '0 0 8px' }}>Transaksi Berhasil</h2>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>{receipt.no}</p>
        <div style={{ backgroundColor: CBG, borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Total Bayar</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#064E3B' }}>Rp {receipt.total.toLocaleString('id-ID')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Metode</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C }}>{receipt.method}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <button onClick={() => {
            printReceipt({
              noStruk: receipt.no,
              tanggal: fmtDate(new Date()),
              kasir: user?.name || 'Kasir',
              items: cart.map(item => ({ nama: item.name, qty: item.qty, harga: item.price, subtotal: item.price * item.qty })),
              subtotal: receipt.total - tax + discount,
              pajak: tax,
              diskon: discount,
              total: receipt.total,
              metodeBayar: receipt.method,
              bayar: receipt.total,
            });
            showToast('Struk dicetak', 'success');
          }} style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${C}`, background: '#fff', color: C, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Printer size={14} /> Cetak Struk
          </button>
          <button onClick={() => setReceipt(null)} style={{ padding: '12px', borderRadius: 12, border: 'none', background: C, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Transaksi Baru</button>
          <button onClick={() => router.push('/orders')} style={{ padding: '12px', borderRadius: 12, border: `1px solid ${CLT}`, background: '#fff', color: C, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Lihat Riwayat</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: CBG, opacity: mounted ? 1 : 0, transition: 'opacity .4s', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ height: 56, backgroundColor: '#fff', borderBottom: `1px solid ${CLT}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,#047857,${C})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>POS</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#064E3B', flex: 1 }}>Kasir — {user?.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: offline ? '#B91C1C' : '#047857', backgroundColor: offline ? '#FEE2E2' : CLT, padding: '6px 10px', borderRadius: 999 }}>
              {offline ? 'Offline' : syncing ? 'Menyinkronkan...' : 'Online'}
            </span>
            <span style={{ fontSize: 12, color: '#475569', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: 999 }}>
              Queue {pendingQueue.length}
            </span>
          </div>
        </header>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', backgroundColor: '#fff', borderBottom: `1px solid ${CLT}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <Search size={14} style={{ color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk atau scan barcode…"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${CLT}`, outline: 'none', fontSize: 13, backgroundColor: '#F8FAFC' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBarcode()} placeholder="Scan / SKU"
              style={{ width: 120, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${CLT}`, outline: 'none', fontSize: 13, backgroundColor: '#F8FAFC' }} />
            <button onClick={handleBarcode} style={{ padding: '10px 12px', borderRadius: 12, border: 'none', backgroundColor: C, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Scan</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', backgroundColor: '#fff', borderBottom: `1px solid ${CLT}`, overflowX: 'auto', flexShrink: 0 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{ padding: '7px 16px', borderRadius: 999, border: 'none', flexShrink: 0, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', backgroundColor: activeCategory === cat ? C : CLT, color: activeCategory === cat ? '#fff' : '#475569' }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
            {filtered.map(product => (
              <button key={product.id} onClick={() => addToCart(product)}
                style={{ padding: 14, borderRadius: 18, backgroundColor: '#fff', border: `1.5px solid ${CLT}`, textAlign: 'left', cursor: 'pointer', transition: 'all .2s' }}>
                <p style={{ fontSize: 24, margin: '0 0 10px' }}>{product.emoji}</p>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 }}>{product.name}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: C, margin: 0 }}>Rp {product.price.toLocaleString('id-ID')}</p>
                <p style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>{product.stock !== undefined ? `Stok ${product.stock}` : 'Stok tersedia'}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: 380, flexShrink: 0, backgroundColor: '#fff', borderLeft: `1px solid ${CLT}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${CLT}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.1em', margin: 0, color: '#10B981' }}>Keranjang</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 0', color: '#0F172A' }}>{cart.length} item</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/orders')} style={{ padding: '10px 12px', borderRadius: 12, border: 'none', backgroundColor: CLT, color: '#047857', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Receipt size={14} /> Riwayat</button>
            <button onClick={() => router.push('/sessions')} style={{ padding: '10px 12px', borderRadius: 12, border: 'none', backgroundColor: CLT, color: '#047857', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={14} /> Sesi</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'grid', placeItems: 'center', minHeight: '100%', color: '#9CA3AF' }}>
              <Package size={48} />
              <p style={{ fontSize: 13, marginTop: 12 }}>Tambahkan produk ke keranjang untuk memulai transaksi.</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${CLT}` }}>
              <span style={{ fontSize: 22 }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                <p style={{ fontSize: 12, color: '#059669', fontWeight: 700, margin: '4px 0 0' }}>Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => updateQty(item.id, -1)} style={{ width: 26, height: 26, borderRadius: 10, border: `1px solid ${CLT}`, background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#475569' }}><Minus size={12} /></button>
                <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} style={{ width: 26, height: 26, borderRadius: 10, border: 'none', background: C, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff' }}><Plus size={12} /></button>
                <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} style={{ width: 26, height: 26, borderRadius: 10, border: 'none', background: '#FEE2E2', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#B91C1C' }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', borderTop: `1px solid ${CLT}` }}>
          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={voucher} onChange={e => setVoucher(e.target.value)} placeholder="Kode voucher"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${CLT}`, outline: 'none', fontSize: 13, background: '#F8FAFC' }} />
              <button onClick={applyVoucher} disabled={!voucher}
                style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: voucher ? C : '#E5E7EB', color: voucher ? '#fff' : '#9CA3AF', fontWeight: 700, cursor: voucher ? 'pointer' : 'not-allowed' }}>Gunakan</button>
            </div>
            <input value={member} onChange={e => setMember(e.target.value)} placeholder="ID pelanggan / member"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${CLT}`, outline: 'none', fontSize: 13, background: '#F8FAFC' }} />
          </div>

          <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Subtotal</span><strong>Rp {subtotal.toLocaleString('id-ID')}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Diskon</span><strong>- Rp {discount.toLocaleString('id-ID')}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>PPN 11%</span><strong>Rp {tax.toLocaleString('id-ID')}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${CLT}` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Total Bayar</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PAY_METHODS.map(method => (
                <button key={method.key} onClick={() => { setPayMethod(method.key); setUseSplitPayment(false); }}
                  style={{ flex: 1, minWidth: 100, padding: '10px', borderRadius: 12, border: `2px solid ${payMethod === method.key ? C : CLT}`, background: payMethod === method.key ? `${C}15` : '#fff', color: payMethod === method.key ? C : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                  <method.icon size={14} /> {method.label}
                </button>
              ))}
              <button onClick={() => setUseSplitPayment(prev => !prev)}
                style={{ flex: 1, minWidth: 100, padding: '10px', borderRadius: 12, border: `2px solid ${useSplitPayment ? C : CLT}`, background: useSplitPayment ? `${C}15` : '#fff', color: useSplitPayment ? C : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, fontWeight: 700 }}>
                <RefreshCw size={14} /> Split
              </button>
            </div>

            {useSplitPayment ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {splitPayments.map((payment, index) => (
                  <div key={`${payment.method}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
                    <select value={payment.method} onChange={e => setSplitPayments(prev => prev.map((item, idx) => idx === index ? { ...item, method: e.target.value as PayMethod } : item))}
                      style={{ padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${CLT}`, background: '#F8FAFC', fontSize: 13 }}>
                      {PAY_METHODS.map(method => <option key={method.key} value={method.key}>{method.label}</option>)}
                    </select>
                    <input type="number" value={payment.amount} onChange={e => setSplitPayments(prev => prev.map((item, idx) => idx === index ? { ...item, amount: Number(e.target.value) } : item))}
                      style={{ padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${CLT}`, background: '#F8FAFC', fontSize: 13 }} />
                  </div>
                ))}
                <button onClick={() => setSplitPayments(prev => [...prev, { method: 'cash', amount: 0 }])}
                  style={{ padding: '10px 12px', borderRadius: 12, border: `1px dashed ${CLT}`, background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 700 }}>Tambah Metode</button>
              </div>
            ) : (
              payMethod === 'cash' && (
                <input type="number" placeholder="Nominal diterima" value={cashInput} onChange={e => setCashInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: `1.5px solid ${CLT}`, background: '#F8FAFC', fontSize: 13, outline: 'none' }} />
              )
            )}
          </div>

          {payMethod === 'cash' && !useSplitPayment && cashInput && (
            <div style={{ padding: '12px', borderRadius: 16, background: CLT, color: '#064E3B', fontWeight: 700 }}>Kembalian: Rp {change.toLocaleString('id-ID')}</div>
          )}
          {useSplitPayment && (
            <div style={{ padding: '12px', borderRadius: 16, background: CLT, color: '#064E3B', fontWeight: 700 }}>Total Pembayaran: Rp {paymentTotal.toLocaleString('id-ID')}</div>
          )}

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <button onClick={() => handleCheckout(true)} disabled={cart.length === 0}
              style={{ padding: '14px', borderRadius: 14, border: 'none', background: cart.length === 0 ? '#E5E7EB' : '#FBBF24', color: cart.length === 0 ? '#9CA3AF' : '#0F172A', fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              Simpan Sebagai HOLD
            </button>
            <button onClick={() => handleCheckout(false)}
              disabled={cart.length === 0 || (payMethod === 'cash' && !useSplitPayment && Number(cashInput || 0) < total) || (useSplitPayment && paymentTotal < total)}
              style={{ padding: '14px', borderRadius: 14, border: 'none', background: cart.length === 0 ? '#E5E7EB' : `linear-gradient(135deg,#047857,${C})`, color: '#fff', fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              Bayar Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

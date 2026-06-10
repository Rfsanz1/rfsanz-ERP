'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { MARKETPLACE_CONFIG, MARKETPLACE_NAV } from '../../../lib/nav-configs';
import { RefreshCw, Check, X, AlertTriangle, Search } from 'lucide-react';

const C = MARKETPLACE_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const PLATFORMS = [
  { id: 'shopee', name: 'Shopee', color: '#EE4D2D', logo: '🛒' },
  { id: 'tokopedia', name: 'Tokopedia', color: '#03AC0E', logo: '🟢' },
  { id: 'tiktok', name: 'TikTok Shop', color: '#000000', logo: '⚫' },
];

const SAMPLE_PRODUCTS = [
  { id: 1, sku: 'PRD-001', name: 'Produk A - 1L', erp_price: 50000, shopee_price: 50000, tokopedia_price: 52000, tiktok_price: 49000, shopee_stock: 45, tokopedia_stock: 45, tiktok_stock: 45, erp_stock: 50, shopee_sync: 'synced', tokopedia_sync: 'diff_price', tiktok_sync: 'diff_price' },
  { id: 2, sku: 'PRD-002', name: 'Produk B - 5L', erp_price: 120000, shopee_price: 120000, tokopedia_price: 120000, tiktok_price: 120000, shopee_stock: 20, tokopedia_stock: 18, tiktok_stock: 20, erp_stock: 20, shopee_sync: 'synced', tokopedia_sync: 'diff_stock', tiktok_sync: 'synced' },
  { id: 3, sku: 'PRD-003', name: 'Produk C - 20L', erp_price: 350000, shopee_price: null, tokopedia_price: 345000, tiktok_price: null, shopee_stock: null, tokopedia_stock: 5, tiktok_stock: null, erp_stock: 8, shopee_sync: 'not_listed', tokopedia_sync: 'diff_price', tiktok_sync: 'not_listed' },
];

const SYNC_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  synced:      { label: 'Sinkron',       color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  diff_price:  { label: 'Harga Beda',   color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  diff_stock:  { label: 'Stok Beda',    color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  not_listed:  { label: 'Belum Listed', color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  error:       { label: 'Error',        color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

export default function PriceSyncPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2025-06-25 10:30');
  const [search, setSearch] = useState('');

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const runSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setLastSync(new Date().toLocaleString('id-ID')); }, 2500);
  };

  const filtered = SAMPLE_PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const issueCount = SAMPLE_PRODUCTS.filter(p => p.shopee_sync !== 'synced' || p.tokopedia_sync !== 'synced' || p.tiktok_sync !== 'synced').length;

  return (
    <AppShell {...MARKETPLACE_CONFIG} navItems={MARKETPLACE_NAV} activeHref="/marketplace/price-sync">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Sinkronisasi Harga Marketplace</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Sinkronkan harga dan stok ke semua platform marketplace</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Terakhir sync: {lastSync}</p>
            <button onClick={runSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
              {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {syncing ? 'Menyinkronkan...' : 'Sync Sekarang'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {PLATFORMS.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{p.logo}</span>
                <div>
                  <p className="font-bold" style={{ color: '#1E1B4B' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: '#4CAF50' }}>● Terhubung</p>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: '#9CA3AF' }}>Produk Sinkron</span>
                <span className="font-bold" style={{ color: '#4CAF50' }}>
                  {SAMPLE_PRODUCTS.filter(pr => (pr as any)[`${p.id}_sync`] === 'synced').length}/{SAMPLE_PRODUCTS.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                <div className="h-full rounded-full" style={{ width: `${SAMPLE_PRODUCTS.filter(pr => (pr as any)[`${p.id}_sync`] === 'synced').length / SAMPLE_PRODUCTS.length * 100}%`, backgroundColor: p.color }} />
              </div>
            </div>
          ))}
        </div>

        {issueCount > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(255,152,0,.08)', border: '1.5px solid rgba(255,152,0,.3)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#FF9800' }} />
            <p className="text-sm" style={{ color: '#E65100' }}>
              <span className="font-bold">{issueCount} produk</span> memiliki perbedaan harga atau stok dengan marketplace. Klik "Sync Sekarang" untuk menyinkronkan.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari produk atau SKU..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>Produk</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#1E1B4B' }}>Harga ERP</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#EE4D2D' }}>Shopee</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#EE4D2D' }}>Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#03AC0E' }}>Tokopedia</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#03AC0E' }}>Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#1E1B4B' }}>TikTok</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold" style={{ color: '#1E1B4B' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const ss = SYNC_STATUS[p.shopee_sync];
                  const ts = SYNC_STATUS[p.tokopedia_sync];
                  const tt = SYNC_STATUS[p.tiktok_sync];
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: C }}>{p.sku}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{p.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-xs" style={{ color: '#1E1B4B' }}>{fmt(p.erp_price)}</td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: p.shopee_price !== p.erp_price && p.shopee_price ? '#FF9800' : '#1E1B4B' }}>
                        {p.shopee_price ? fmt(p.shopee_price) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ color: ss.color, backgroundColor: ss.bg }}>{ss.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: p.tokopedia_price !== p.erp_price && p.tokopedia_price ? '#FF9800' : '#1E1B4B' }}>
                        {p.tokopedia_price ? fmt(p.tokopedia_price) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ color: ts.color, backgroundColor: ts.bg }}>{ts.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: p.tiktok_price !== p.erp_price && p.tiktok_price ? '#FF9800' : '#1E1B4B' }}>
                        {p.tiktok_price ? fmt(p.tiktok_price) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ color: tt.color, backgroundColor: tt.bg }}>{tt.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

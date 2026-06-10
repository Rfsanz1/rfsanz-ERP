'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { ShoppingBag, TrendingUp, AlertTriangle, RefreshCw, CheckCircle, BarChart2, Tag, Package } from 'lucide-react';

const CHANNEL_STATS = [
  { name: 'Shopee', revenue: 'Rp 48,2 jt', orders: 284, growth: 18.5, color: '#F97316', syncStatus: 'synced' },
  { name: 'Tokopedia', revenue: 'Rp 32,8 jt', orders: 192, growth: 12.3, color: '#22C55E', syncStatus: 'synced' },
  { name: 'Lazada', revenue: 'Rp 18,5 jt', orders: 98, growth: -4.2, color: '#3B82F6', syncStatus: 'error' },
  { name: 'TikTok Shop', revenue: 'Rp 24,1 jt', orders: 157, growth: 42.8, color: '#000000', syncStatus: 'synced' },
];

const AI_SUGGESTIONS = [
  { platform: 'Shopee', title: 'Optimasi judul listing Semen Portland', action: 'Tambahkan keyword "semen murah", "pengiriman cepat", "terpercaya"', impact: '+15-25% CTR' },
  { platform: 'Tokopedia', title: 'Naikkan harga Cat Tembok 3%', action: 'Harga Anda 8% di bawah rata-rata kompetitor untuk kualitas sama', impact: '+Rp 2,4 jt margin' },
  { platform: 'TikTok Shop', title: 'Buat konten video Besi Beton', action: 'Produk trending di TikTok Shop, potensi viral tinggi', impact: '+40% exposure' },
  { platform: 'Lazada', title: 'Perbaiki sinkronisasi stok Lazada', action: '7 produk gagal sync — stok tidak akurat berisiko overselling', impact: 'Hindari kerugian Rp 8 jt' },
];

const SYNC_LOGS = [
  { platform: 'Shopee', product: 'Semen Portland 50kg', status: 'success', time: '5 mnt lalu' },
  { platform: 'Tokopedia', product: 'Bata Merah (ikat)', status: 'success', time: '8 mnt lalu' },
  { platform: 'Lazada', product: 'Pasir Cor (m³)', status: 'error', time: '12 mnt lalu', error: 'Invalid SKU format' },
  { platform: 'TikTok Shop', product: 'Cat Tembok 25kg', status: 'success', time: '15 mnt lalu' },
  { platform: 'Lazada', product: 'Besi Beton 10mm', status: 'error', time: '20 mnt lalu', error: 'Stock sync timeout' },
];

export default function AiMarketplaceAssistantPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI Marketplace Assistant" subtitle="Optimasi listing, harga, dan sinkronisasi marketplace">
      <div className="space-y-6">
        {/* Banner */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', color: 'white' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Marketplace Assistant</h2>
              <p className="text-sm opacity-80">4 marketplace terhubung · Sync otomatis setiap 15 menit · AI optimasi aktif</p>
            </div>
            <button
              onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 2000); }}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 text-sm font-semibold hover:bg-white/30 transition"
            >
              {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync Sekarang
            </button>
          </div>
        </div>

        {/* Channel Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CHANNEL_STATS.map((c, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${c.syncStatus === 'error' ? 'rgba(239,68,68,.3)' : '#EDE9FE'}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm" style={{ color: c.color }}>{c.name}</span>
                {c.syncStatus === 'synced'
                  ? <CheckCircle className="h-4 w-4" style={{ color: '#22C55E' }} />
                  : <AlertTriangle className="h-4 w-4" style={{ color: '#EF4444' }} />
                }
              </div>
              <p className="text-base font-bold" style={{ color: '#1E1B4B' }}>{c.revenue}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{c.orders} order</p>
              <span className="text-xs font-semibold" style={{ color: c.growth >= 0 ? '#22C55E' : '#EF4444' }}>
                {c.growth >= 0 ? '+' : ''}{c.growth}%
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Suggestions */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <Tag className="h-4 w-4" style={{ color: '#F97316' }} /> AI Optimasi Suggestions
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {AI_SUGGESTIONS.map((s, i) => (
                <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#F97316' + '15', color: '#F97316' }}>{s.platform}</span>
                    <p className="text-xs font-bold" style={{ color: '#1E1B4B' }}>{s.title}</p>
                  </div>
                  <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{s.action}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,.1)', color: '#22C55E' }}>
                    💡 {s.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Logs */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <RefreshCw className="h-4 w-4" style={{ color: '#F97316' }} /> Sync Log Terbaru
              </h3>
              <a href="/marketplace/sync-logs" className="text-xs font-semibold" style={{ color: '#5B52D1' }}>Lihat Semua</a>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE9FE' }}>
              {SYNC_LOGS.map((log, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5">
                    {log.status === 'success'
                      ? <CheckCircle className="h-4 w-4" style={{ color: '#22C55E' }} />
                      : <AlertTriangle className="h-4 w-4" style={{ color: '#EF4444' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F5F3FF', color: '#1E1B4B' }}>{log.platform}</span>
                      <p className="text-xs truncate" style={{ color: '#1E1B4B' }}>{log.product}</p>
                    </div>
                    {log.error && <p className="text-[10px] mt-0.5" style={{ color: '#EF4444' }}>{log.error}</p>}
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: '#9CA3AF' }}>{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

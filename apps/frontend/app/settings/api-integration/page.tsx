'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Link2, CheckCircle, AlertCircle, RefreshCw, Key, Globe, Zap, Settings } from 'lucide-react';

const INTEGRATIONS = [
  { name: 'Kledo Accounting', desc: 'Sinkronisasi jurnal, invoice, dan pembayaran', status: 'connected', icon: '📊', color: '#3B82F6', lastSync: '5 mnt lalu' },
  { name: 'Shopee', desc: 'Sinkronisasi produk, stok, dan pesanan Shopee', status: 'connected', icon: '🛒', color: '#F97316', lastSync: '15 mnt lalu' },
  { name: 'Tokopedia', desc: 'Sinkronisasi produk, stok, dan pesanan Tokopedia', status: 'connected', icon: '🟢', color: '#22C55E', lastSync: '12 mnt lalu' },
  { name: 'Lazada', desc: 'Sinkronisasi produk, stok, dan pesanan Lazada', status: 'error', icon: '🔵', color: '#EF4444', lastSync: 'Error 20 mnt lalu' },
  { name: 'TikTok Shop', desc: 'Sinkronisasi produk, stok, dan pesanan TikTok Shop', status: 'connected', icon: '🎵', color: '#000000', lastSync: '8 mnt lalu' },
  { name: 'Fonnte WhatsApp', desc: 'Gateway WhatsApp untuk notifikasi dan reminder', status: 'connected', icon: '💬', color: '#22C55E', lastSync: 'Aktif' },
  { name: 'OpenAI GPT-4', desc: 'AI Engine untuk seluruh fitur AI Center', status: 'connected', icon: '🤖', color: '#8B5CF6', lastSync: 'Aktif' },
  { name: 'Midtrans Payment', desc: 'Gateway pembayaran online', status: 'disconnected', icon: '💳', color: '#F59E0B', lastSync: '-' },
];

const API_KEYS = [
  { name: 'ERP API Key (Production)', key: 'gm_live_••••••••••••••••••••••••', created: '1 Jan 2026', lastUsed: '5 mnt lalu' },
  { name: 'ERP API Key (Development)', key: 'gm_test_••••••••••••••••••••••••', created: '15 Jan 2026', lastUsed: '2 jam lalu' },
  { name: 'Webhook Secret', key: 'whsec_••••••••••••••••••••••••', created: '1 Jan 2026', lastUsed: '1 jam lalu' },
];

export default function ApiIntegrationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="API & Integrasi" subtitle="Kelola koneksi ke sistem dan layanan third-party">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Integrasi', value: INTEGRATIONS.length, color: '#5B52D1' },
            { label: 'Terhubung', value: INTEGRATIONS.filter(i => i.status === 'connected').length, color: '#22C55E' },
            { label: 'Error', value: INTEGRATIONS.filter(i => i.status === 'error').length, color: '#EF4444' },
            { label: 'Belum Terhubung', value: INTEGRATIONS.filter(i => i.status === 'disconnected').length, color: '#6B7280' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Integrations Grid */}
        <div>
          <h3 className="font-bold mb-4" style={{ color: '#1E1B4B' }}>Integrasi Third-Party</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATIONS.map((int, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${int.status === 'error' ? 'rgba(239,68,68,.3)' : '#EDE9FE'}` }}
              >
                <div className="text-2xl flex-shrink-0">{int.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{int.name}</p>
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{
                      color: int.status === 'connected' ? '#22C55E' : int.status === 'error' ? '#EF4444' : '#6B7280',
                    }}>
                      {int.status === 'connected' ? <CheckCircle className="h-3 w-3" /> : int.status === 'error' ? <AlertCircle className="h-3 w-3" /> : null}
                      {int.status === 'connected' ? 'Terhubung' : int.status === 'error' ? 'Error' : 'Belum Terhubung'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{int.desc}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>Sync: {int.lastSync}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {int.status === 'error' && (
                    <button className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,.1)', color: '#EF4444' }}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition" style={{ color: '#9CA3AF' }}>
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: '#1E1B4B' }}>API Keys</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
              <Key className="h-3.5 w-3.5" /> Generate Key Baru
            </button>
          </div>
          <div className="space-y-3">
            {API_KEYS.map((k, i) => (
              <div key={i} className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <Key className="h-5 w-5 flex-shrink-0" style={{ color: '#5B52D1' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{k.name}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: '#9CA3AF' }}>{k.key}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>Dibuat: {k.created} · Terakhir digunakan: {k.lastUsed}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ backgroundColor: '#F5F3FF', color: '#1E1B4B' }}>Salin</button>
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,.1)', color: '#DC2626' }}>Revoke</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

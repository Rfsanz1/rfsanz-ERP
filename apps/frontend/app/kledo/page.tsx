'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import {
  Zap, RefreshCw, CheckCircle, XCircle, Package, Users,
  FileText, Clock, AlertTriangle, Play, Database,
} from 'lucide-react';

type SyncLog = {
  id: string; type: string; status: 'running' | 'success' | 'error'; message: string; createdAt: string;
};

export default function KledoPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [dbCounts, setDbCounts] = useState<{ products: number; customers: number; orders: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSyncs, setActiveSyncs] = useState<Set<string>>(new Set());

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const loadLogs = useCallback(async () => {
    try {
      const r = await api.get('/kledo/sync-logs', { params: { limit: 15 } });
      const logs: SyncLog[] = r.data.data ?? [];
      setSyncLogs(logs);
      const running = new Set(logs.filter(l => l.status === 'running').map(l => l.type));
      setActiveSyncs(running);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, br] = await Promise.all([
        api.get('/kledo/status'),
        api.get('/kledo/spm-brands'),
      ]);
      setStatus(st.data);
      setBrands(br.data ?? []);
      await loadLogs();
    } catch {} finally { setLoading(false); }
  }, [loadLogs]);

  useEffect(() => { if (token) load(); }, [token]);

  // Auto-refresh saat ada sync yang running
  useEffect(() => {
    if (activeSyncs.size === 0) return;
    const interval = setInterval(loadLogs, 4000);
    return () => clearInterval(interval);
  }, [activeSyncs.size, loadLogs]);

  const triggerSync = async (endpoint: string, label: string) => {
    try {
      const r = await api.post(`/kledo/${endpoint}`);
      await loadLogs();
      return r.data;
    } catch (e: any) {
      alert(`Gagal memulai ${label}: ` + (e.response?.data?.message || e.message));
    }
  };

  if (!token) return null;

  const hasRunning = activeSyncs.size > 0;

  const syncButtons = [
    { key: 'products', endpoint: 'sync', label: 'Sync Produk', icon: Package, color: '#5B52D1', bg: '#EDE8F5', desc: '5.378 produk dari Kledo' },
    { key: 'contacts', endpoint: 'sync-contacts', label: 'Sync Kontak', icon: Users, color: '#8B80F9', bg: '#F0EDFF', desc: '21.492 kontak dari Kledo' },
    { key: 'invoices', endpoint: 'sync-invoices', label: 'Sync Invoice', icon: FileText, color: '#06B6D4', bg: '#ECFEFF', desc: '500 invoice terbaru' },
    { key: 'all', endpoint: 'sync-all', label: 'Sync Semua', icon: Zap, color: '#F59E0B', bg: '#FFFBEB', desc: 'Sinkronisasi semua data sekaligus' },
  ];

  const getLatestLog = (type: string) => syncLogs.find(l => l.type === type);

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/kledo">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Integrasi Kledo ERP</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Sinkronisasi produk, pelanggan &amp; invoice dari Kledo secara background</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition" style={{ background: '#F5F3FF', color: '#5B52D1', border: '1.5px solid #EDE8F5' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Status Banner */}
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{
          backgroundColor: status?.connected ? 'rgba(76,175,80,.07)' : 'rgba(234,84,85,.07)',
          border: `1.5px solid ${status?.connected ? 'rgba(76,175,80,.25)' : 'rgba(234,84,85,.25)'}`,
        }}>
          {status?.connected
            ? <CheckCircle className="h-7 w-7 flex-shrink-0" style={{ color: '#4CAF50' }} />
            : <XCircle className="h-7 w-7 flex-shrink-0" style={{ color: '#EA5455' }} />}
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: status?.connected ? '#388E3C' : '#C62828' }}>
              {status?.connected ? '✅ Kledo Terhubung' : '❌ Kledo Tidak Terhubung'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{status?.message || 'Mengecek koneksi...'}</p>
          </div>
          {hasRunning && (
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(245,158,11,.12)', color: '#D97706' }}>
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Sync berjalan...
            </div>
          )}
        </div>

        {/* Sync Action Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {syncButtons.map(({ key, endpoint, label, icon: Icon, color, bg, desc }) => {
            const isRunning = activeSyncs.has(key) || (key === 'all' && activeSyncs.size > 0);
            const log = getLatestLog(key === 'all' ? 'products' : key);
            return (
              <div key={key} className="bg-white rounded-2xl p-4 flex flex-col gap-3" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  {isRunning && <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: color }} />}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{desc}</p>
                </div>
                <button
                  onClick={() => triggerSync(endpoint, label)}
                  disabled={isRunning || !status?.connected}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                  style={{ background: isRunning ? bg : color, color: isRunning ? color : '#fff' }}
                >
                  {isRunning
                    ? <><RefreshCw className="h-3 w-3 animate-spin" /> Berjalan...</>
                    : <><Play className="h-3 w-3" /> Mulai</>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Sync Log Table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F5F2FB' }}>
            <h3 className="text-sm font-bold" style={{ color: '#1E1B4B' }}>Riwayat Sinkronisasi</h3>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Auto-refresh tiap 4 detik saat sync berjalan</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#F5F2FB' }}>
            {syncLogs.length === 0 ? (
              <p className="p-5 text-sm text-center" style={{ color: '#9CA3AF' }}>Belum ada riwayat sync</p>
            ) : syncLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                  background: log.status === 'success' ? 'rgba(76,175,80,.08)' : log.status === 'error' ? 'rgba(234,84,85,.08)' : 'rgba(245,158,11,.08)',
                }}>
                  {log.status === 'success' && <CheckCircle className="h-4 w-4" style={{ color: '#4CAF50' }} />}
                  {log.status === 'error' && <AlertTriangle className="h-4 w-4" style={{ color: '#EA5455' }} />}
                  {log.status === 'running' && <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#F59E0B' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded" style={{ background: '#F5F3FF', color: '#5B52D1' }}>{log.type}</span>
                    <span className="text-xs truncate" style={{ color: '#1E1B4B' }}>{log.message}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{
                  background: log.status === 'success' ? 'rgba(76,175,80,.1)' : log.status === 'error' ? 'rgba(234,84,85,.1)' : 'rgba(245,158,11,.1)',
                  color: log.status === 'success' ? '#388E3C' : log.status === 'error' ? '#C62828' : '#D97706',
                }}>
                  {log.status === 'running' ? 'Berjalan' : log.status === 'success' ? 'Selesai' : 'Error'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SPM Brands */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: '#1E1B4B' }}>SPM Brand &amp; PIC</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {brands.map((b: any) => (
              <div key={b.brand} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: '#F5F3FF' }}>
                <span className="text-xs font-bold" style={{ color: '#5B52D1' }}>{b.brand}</span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{b.pic}</span>
              </div>
            ))}
            {brands.length === 0 && <p className="col-span-3 text-sm" style={{ color: '#9CA3AF' }}>Belum ada data</p>}
          </div>
        </div>

      </div>
    </AppShell>
  );
}

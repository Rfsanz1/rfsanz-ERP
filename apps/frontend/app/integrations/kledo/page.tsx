'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { kledoService, type KledoProduct, type KledoContact, type KledoInvoice, type KledoSyncLog } from '../../../lib/services';
import {
  RefreshCw, CheckCircle, XCircle, BarChart2, Package, Users,
  FileText, Zap, Clock, AlertCircle, Search, ChevronRight, ExternalLink,
} from 'lucide-react';

type Tab = 'overview' | 'products' | 'contacts' | 'invoices' | 'sync-logs';

const formatRp = (v: number) => {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${v.toLocaleString('id')}`;
};

export default function KledoPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [status, setStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [products, setProducts] = useState<KledoProduct[]>([]);
  const [contacts, setContacts] = useState<KledoContact[]>([]);
  const [invoices, setInvoices] = useState<KledoInvoice[]>([]);
  const [syncLogs, setSyncLogs] = useState<KledoSyncLog[]>([]);
  const [spmBrands, setSpmBrands] = useState<{ brand: string; pic: string }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; synced: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, brands] = await Promise.all([
        kledoService.getStatus(),
        kledoService.getSpmBrands(),
      ]);
      setStatus(st);
      setSpmBrands(brands);
      if (st.connected) {
        const [prods, conts, invs, logs] = await Promise.allSettled([
          kledoService.getProducts({ per_page: 50 }),
          kledoService.getContacts({ per_page: 30 }),
          kledoService.getInvoices({ per_page: 20 }),
          kledoService.getSyncLogs({ limit: 20 }),
        ]);
        if (prods.status === 'fulfilled') setProducts(prods.value?.data ?? []);
        if (conts.status === 'fulfilled') setContacts(conts.value?.data ?? []);
        if (invs.status === 'fulfilled') setInvoices(invs.value?.data ?? []);
        if (logs.status === 'fulfilled') setSyncLogs(logs.value?.data ?? []);
      } else {
        const logs = await kledoService.getSyncLogs({ limit: 20 }).catch(() => ({ data: [] }));
        setSyncLogs(logs.data);
      }
    } catch { /* silently handle */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
    load();
  }, [token]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await kledoService.syncNow();
      setSyncResult(res);
      await load();
    } catch { setSyncResult({ success: false, synced: 0 }); }
    finally { setSyncing(false); }
  };

  if (!mounted || !token) return null;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'products', label: `Produk (${products.length})`, icon: Package },
    { key: 'contacts', label: `Kontak (${contacts.length})`, icon: Users },
    { key: 'invoices', label: `Invoice (${invoices.length})`, icon: FileText },
    { key: 'sync-logs', label: 'Sync Logs', icon: Clock },
  ];

  const filteredProducts = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OdooLayout title="Kledo Accounting" subtitle="Integrasi dengan Kledo ERP — sinkronisasi produk, kontak, dan invoice">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Status Banner */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: status?.connected
              ? 'linear-gradient(135deg, #22C55E, #15803D)'
              : 'linear-gradient(135deg, #EF4444, #B91C1C)',
            color: 'white',
          }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 flex-shrink-0 text-2xl font-bold">K</div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-lg">Kledo Accounting</h2>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin opacity-70" />
              ) : status?.connected ? (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle className="h-3 w-3" /> Terhubung
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  <XCircle className="h-3 w-3" /> Tidak Terhubung
                </span>
              )}
            </div>
            <p className="text-sm opacity-80 mt-0.5">
              {status?.message ?? 'Memeriksa koneksi...'}
            </p>
            {!status?.connected && !loading && (
              <p className="text-xs mt-1 opacity-70">
                💡 Set env var <code className="bg-white/20 px-1 rounded">KLEDO_TOKEN</code> di Settings → Secrets untuk mengaktifkan koneksi
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Cek Status
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 transition disabled:opacity-50"
            >
              <Zap className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Sync...' : 'Sync Sekarang'}
            </button>
          </div>
        </div>

        {syncResult && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
            style={{
              backgroundColor: syncResult.success ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
              border: `1px solid ${syncResult.success ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
              color: syncResult.success ? '#15803D' : '#DC2626',
            }}
          >
            {syncResult.success
              ? <><CheckCircle className="h-4 w-4" /> Sync berhasil! {syncResult.synced} produk disinkronisasi ke database lokal.</>
              : <><AlertCircle className="h-4 w-4" /> Sync gagal. Periksa koneksi dan KLEDO_TOKEN.</>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: '#F5F3FF' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition"
              style={{
                backgroundColor: tab === t.key ? '#FFFFFF' : 'transparent',
                color: tab === t.key ? '#5B52D1' : '#6B7280',
                boxShadow: tab === t.key ? '0 1px 4px rgba(47,43,61,.08)' : 'none',
              }}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Produk di Kledo', value: products.length || '-', color: '#3B82F6', icon: Package },
                { label: 'Kontak', value: contacts.length || '-', color: '#22C55E', icon: Users },
                { label: 'Invoice', value: invoices.length || '-', color: '#F59E0B', icon: FileText },
                { label: 'SPM Brands', value: spmBrands.length, color: '#8B5CF6', icon: BarChart2 },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{loading ? '...' : s.value}</p>
                </div>
              ))}
            </div>

            {/* SPM Brands */}
            {spmBrands.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
                  <h3 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>SPM Brand → PIC Mapping</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Brand SPM dengan margin 15% otomatis dari Kledo</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-y" style={{ borderColor: '#EDE9FE' }}>
                  {spmBrands.map((b, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
                        {b.brand.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#1E1B4B' }}>{b.brand}</p>
                        <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{b.pic}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Margin Info */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: '#1E1B4B' }}>Logika Harga Kledo</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#9CA3AF' }}>Harga Kledo</p>
                  <p className="text-base font-bold" style={{ color: '#1E1B4B' }}>Rp 100.000</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs font-semibold" style={{ color: '#5B52D1' }}>× 1.15</p>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Margin 15%</p>
                    <ChevronRight className="h-4 w-4 mx-auto mt-1" style={{ color: '#5B52D1' }} />
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(91,82,209,.08)', border: '1.5px solid rgba(91,82,209,.2)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#5B52D1' }}>Harga Jual ERP</p>
                  <p className="text-base font-bold" style={{ color: '#5B52D1' }}>Rp 115.000</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
              />
            </div>
            {!status?.connected ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <XCircle className="h-10 w-10 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                <p className="font-semibold" style={{ color: '#1E1B4B' }}>Kledo tidak terhubung</p>
                <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Set KLEDO_TOKEN di environment secrets untuk melihat produk dari Kledo</p>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#F5F3FF' }}>
                      {['Kode', 'Nama Produk', 'Harga Kledo', 'Harga Jual (+15%)', 'Satuan'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #F0EDF8' }}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <td key={j} className="px-4 py-3"><div className="h-3 rounded animate-pulse bg-gray-100" /></td>
                            ))}
                          </tr>
                        ))
                      : filteredProducts.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                            <td className="px-4 py-3 text-xs font-mono" style={{ color: '#9CA3AF' }}>{p.code || '-'}</td>
                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#1E1B4B' }}>{p.name}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{formatRp(p.price || 0)}</td>
                            <td className="px-4 py-3 text-xs font-bold" style={{ color: '#5B52D1' }}>{formatRp(Math.ceil((p.price || 0) * 1.15))}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{p.unit || '-'}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
                {!loading && filteredProducts.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>Tidak ada produk ditemukan</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {tab === 'contacts' && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            {!status?.connected ? (
              <div className="p-12 text-center">
                <XCircle className="h-10 w-10 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                <p className="font-semibold" style={{ color: '#1E1B4B' }}>Kledo tidak terhubung</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F5F3FF' }}>
                    {['Nama', 'Email', 'Telepon', 'Tipe'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #F0EDF8' }}>
                          {Array.from({ length: 4 }).map((_, j) => (
                            <td key={j} className="px-5 py-3"><div className="h-3 rounded animate-pulse bg-gray-100" /></td>
                          ))}
                        </tr>
                      ))
                    : contacts.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                          <td className="px-5 py-3 text-xs font-semibold" style={{ color: '#1E1B4B' }}>{c.name}</td>
                          <td className="px-5 py-3 text-xs" style={{ color: '#6B7280' }}>{c.email || '-'}</td>
                          <td className="px-5 py-3 text-xs" style={{ color: '#6B7280' }}>{c.phone || '-'}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
                              {c.type || 'Kontak'}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {tab === 'invoices' && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            {!status?.connected ? (
              <div className="p-12 text-center">
                <XCircle className="h-10 w-10 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                <p className="font-semibold" style={{ color: '#1E1B4B' }}>Kledo tidak terhubung</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F5F3FF' }}>
                    {['No. Referensi', 'Pelanggan', 'Tgl Transaksi', 'Jatuh Tempo', 'Jumlah', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #F0EDF8' }}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-5 py-3"><div className="h-3 rounded animate-pulse bg-gray-100" /></td>
                          ))}
                        </tr>
                      ))
                    : invoices.map((inv, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                          <td className="px-5 py-3 text-xs font-mono font-semibold" style={{ color: '#5B52D1' }}>{inv.ref_number}</td>
                          <td className="px-5 py-3 text-xs" style={{ color: '#1E1B4B' }}>{inv.contact?.name || '-'}</td>
                          <td className="px-5 py-3 text-xs" style={{ color: '#6B7280' }}>{inv.trans_date}</td>
                          <td className="px-5 py-3 text-xs" style={{ color: '#6B7280' }}>{inv.due_date}</td>
                          <td className="px-5 py-3 text-xs font-semibold" style={{ color: '#1E1B4B' }}>{formatRp(inv.amount || 0)}</td>
                          <td className="px-5 py-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                              backgroundColor: inv.status === 'paid' ? 'rgba(34,197,94,.1)' : 'rgba(245,158,11,.1)',
                              color: inv.status === 'paid' ? '#22C55E' : '#F59E0B',
                            }}>
                              {inv.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Sync Logs Tab */}
        {tab === 'sync-logs' && (
          <div className="space-y-3">
            {syncLogs.length === 0 && !loading && (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Belum ada riwayat sync. Klik "Sync Sekarang" untuk memulai.</p>
              </div>
            )}
            {syncLogs.map((log, i) => (
              <div key={i} className="rounded-2xl p-4 flex items-start gap-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    backgroundColor: log.status === 'success' ? 'rgba(34,197,94,.1)' : log.status === 'error' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)',
                  }}
                >
                  {log.status === 'success' ? <CheckCircle className="h-4 w-4" style={{ color: '#22C55E' }} />
                    : log.status === 'error' ? <XCircle className="h-4 w-4" style={{ color: '#EF4444' }} />
                    : <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#F59E0B' }} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{
                      backgroundColor: log.status === 'success' ? 'rgba(34,197,94,.1)' : log.status === 'error' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)',
                      color: log.status === 'success' ? '#22C55E' : log.status === 'error' ? '#EF4444' : '#F59E0B',
                    }}>
                      {log.status}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{log.type}</span>
                  </div>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#1E1B4B' }}>{log.message}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OdooLayout>
  );
}

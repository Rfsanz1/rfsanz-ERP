'use client';
import { useEffect, useState, useRef } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Package, Search, Plus, RefreshCw, AlertTriangle, Download, CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

const fmt = (v: number | string) =>
  Number(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

type SyncStatus = 'idle' | 'running' | 'success' | 'error';

export default function InventoryProductsPage() {
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const PER_PAGE = 50;

  const [kledoConnected, setKledoConnected] = useState(false);
  const [syncStatus, setSyncStatus]         = useState<SyncStatus>('idle');
  const [syncMsg, setSyncMsg]               = useState('');
  const [syncJobId, setSyncJobId]           = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const r = await api.get('/inventory/products', { params: { search: q || undefined, page: p, limit: PER_PAGE } });
      const raw = r.data;
      setData(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      setTotal(raw?.total ?? raw?.length ?? 0);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/kledo/status').then(r => setKledoConnected(r.data?.connected)).catch(() => {});
    load();
  }, []);

  useEffect(() => { setPage(1); load(1, search); }, [search]);

  const pollSyncLog = (jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get('/kledo/sync-logs', { params: { limit: 5 } });
        const logs: any[] = r.data?.data ?? [];
        const job = logs.find((l: any) => l.id === jobId);
        if (job) {
          setSyncMsg(job.message ?? '');
          if (job.status === 'success') {
            setSyncStatus('success');
            clearInterval(pollRef.current!);
            load(1, search);
          } else if (job.status === 'error') {
            setSyncStatus('error');
            clearInterval(pollRef.current!);
          }
        }
      } catch { /* silently ignore */ }
    }, 2000);
  };

  const handleSync = async () => {
    setSyncStatus('running');
    setSyncMsg('Menghubungi Kledo...');
    try {
      const r = await api.post('/kledo/sync');
      const jobId = r.data?.jobId;
      setSyncMsg(r.data?.message ?? 'Sync berjalan di background...');
      if (jobId) {
        setSyncJobId(jobId);
        pollSyncLog(jobId);
      } else {
        setSyncStatus('success');
        load(1, search);
      }
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMsg(e?.response?.data?.message ?? 'Sync gagal. Coba lagi.');
    }
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/products">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Produk &amp; Stok</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Katalog produk dan manajemen stok</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => load(page, search)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            {kledoConnected && (
              <button
                onClick={handleSync}
                disabled={syncStatus === 'running'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: syncStatus === 'running' ? 'not-allowed' : 'pointer',
                  background: syncStatus === 'running' ? '#C4B5FD' : 'linear-gradient(135deg,#7C3AED,#6366F1)',
                  color: '#fff', opacity: syncStatus === 'running' ? 0.8 : 1,
                }}
              >
                {syncStatus === 'running'
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Download size={13} />}
                {syncStatus === 'running' ? 'Mengimpor...' : 'Import dari Kledo'}
              </button>
            )}

            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Produk Baru
            </button>
          </div>
        </div>

        {/* Sync status banner */}
        {syncStatus !== 'idle' && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 12,
            border: `1px solid ${syncStatus === 'success' ? 'rgba(34,197,94,.3)' : syncStatus === 'error' ? 'rgba(239,68,68,.3)' : 'rgba(99,102,241,.3)'}`,
            background: syncStatus === 'success' ? 'rgba(34,197,94,.06)' : syncStatus === 'error' ? 'rgba(239,68,68,.06)' : 'rgba(99,102,241,.06)',
          }}>
            <div style={{ marginTop: 1, flexShrink: 0 }}>
              {syncStatus === 'running' && <Loader2 size={16} className="animate-spin" style={{ color: '#6366F1' }} />}
              {syncStatus === 'success' && <CheckCircle size={16} style={{ color: '#22C55E' }} />}
              {syncStatus === 'error' && <XCircle size={16} style={{ color: '#EF4444' }} />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: syncStatus === 'success' ? '#15803D' : syncStatus === 'error' ? '#DC2626' : '#4F46E5' }}>
                {syncStatus === 'running' ? 'Import berjalan di background' : syncStatus === 'success' ? 'Import selesai!' : 'Import gagal'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{syncMsg}</p>
            </div>
            {syncStatus !== 'running' && (
              <button onClick={() => { setSyncStatus('idle'); setSyncMsg(''); }}
                style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* Sub-nav tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {[
            { label: 'Semua Produk', href: '/inventory/products', active: true },
            { label: 'Kategori',     href: '/inventory/products/categories', active: false },
          ].map(tab => (
            <Link key={tab.href} href={tab.href}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                background: tab.active ? 'var(--surface)' : 'transparent',
                color: tab.active ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab.active ? 'var(--shadow-xs)' : 'none',
              }}
            >{tab.label}</Link>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nama produk / SKU…" />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{total} produk</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Produk', 'SKU / Kode', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}>
                          <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-sunken)' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                      <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Belum ada produk</p>
                      {kledoConnected ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                          Klik <strong>"Import dari Kledo"</strong> di atas untuk mengimpor produk, SKU, dan stok dari Kledo ke ERP.
                        </p>
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                          Hubungkan Kledo di{' '}
                          <Link href="/integrations/kledo" style={{ color: '#6366F1' }}>Integrasi → Kledo</Link>
                          {' '}untuk impor produk.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : data.map((p: any, i: number) => {
                  const stok = Number(p.stok ?? p.stock ?? p.qty ?? 0);
                  const habis = stok === 0;
                  const menipis = stok > 0 && stok <= Number(p.stokMinimum ?? 10);
                  const hargaBeli = Number(p.hargaBeli ?? p.buyPrice ?? p.purchase_price ?? 0);
                  const hargaJual = Number(p.hargaJual ?? p.price ?? 0);
                  const satuan = typeof p.unit === 'object'
                    ? (p.unit?.name || p.unit?.symbol || '–')
                    : (p.unit || p.satuan || '–');
                  return (
                    <tr key={p.id ?? i}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-2.5">
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={14} style={{ color: '#6366F1' }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                            {p.brand && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {p.sku || p.code || '–'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{fmt(hargaBeli)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(hargaJual)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-1.5">
                          {menipis && !habis && <AlertTriangle size={12} style={{ color: '#F59E0B' }} />}
                          <span style={{ fontSize: 13, fontWeight: 700, color: habis ? '#EF4444' : menipis ? '#F59E0B' : 'var(--text-primary)' }}>
                            {stok.toLocaleString('id-ID')}
                          </span>
                          {habis && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', background: 'rgba(239,68,68,.1)', padding: '1px 6px', borderRadius: 10 }}>Habis</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{satuan}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer pagination */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>{data.length} dari {total} produk</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button disabled={page <= 1 || loading} onClick={() => { const p = page - 1; setPage(p); load(p, search); }}
                  style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
                  ‹ Sebelumnya
                </button>
                <span>Hal {page} / {totalPages}</span>
                <button disabled={page >= totalPages || loading} onClick={() => { const p = page + 1; setPage(p); load(p, search); }}
                  style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>
                  Berikutnya ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

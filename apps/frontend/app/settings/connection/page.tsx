'use client';

import { useEffect, useState } from 'react';
import {
  Wifi, Save, RotateCcw, CheckCircle2, XCircle,
  Server, Smartphone, RefreshCw, Trash2, Globe,
} from 'lucide-react';
import { DEFAULT_SERVER_URL, saveServerUrl, loadServerUrl, isNativePlatform } from '../../../lib/api-config';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  fontSize: 14,
  background: 'var(--surface-sunken)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'monospace',
};

type TestResult = { ok: boolean; latency?: number; message: string } | null;

interface BackendConfig {
  envUrl: string;
  configUrl: string;
  effectiveUrl: string;
  source: 'config' | 'env';
}

export default function ConnectionPage() {
  const [isNative, setIsNative] = useState(false);

  /* ── Web config state ─────────────────────────── */
  const [webConfig, setWebConfig]       = useState<BackendConfig | null>(null);
  const [webUrl, setWebUrl]             = useState('');
  const [webSaving, setWebSaving]       = useState(false);
  const [webTesting, setWebTesting]     = useState(false);
  const [webResult, setWebResult]       = useState<TestResult>(null);
  const [webLoading, setWebLoading]     = useState(true);

  /* ── Native config state ──────────────────────── */
  const [nativeUrl, setNativeUrl]       = useState('');
  const [nativeSaved, setNativeSaved]   = useState<string | null>(null);
  const [nativeTesting, setNativeTesting] = useState(false);
  const [nativeSaving, setNativeSaving] = useState(false);
  const [nativeResult, setNativeResult] = useState<TestResult>(null);

  useEffect(() => {
    const native = isNativePlatform();
    setIsNative(native);

    /* Always load web config (for browser) */
    fetch('/api/admin/backend-url')
      .then(r => r.json())
      .then((cfg: BackendConfig) => {
        setWebConfig(cfg);
        setWebUrl(cfg.configUrl || cfg.envUrl || '');
      })
      .catch(() => {})
      .finally(() => setWebLoading(false));

    /* Load native config too */
    if (native) {
      loadServerUrl().then(v => {
        const val = v || DEFAULT_SERVER_URL;
        setNativeUrl(val);
        setNativeSaved(val);
      });
    }
  }, []);

  /* ── Web handlers ─────────────────────────────── */
  const handleWebTest = async () => {
    setWebTesting(true);
    setWebResult(null);
    const target = (webUrl || webConfig?.effectiveUrl || '').replace(/\/$/, '');
    if (!target) {
      setWebResult({ ok: false, message: 'Masukkan URL backend terlebih dahulu.' });
      setWebTesting(false);
      return;
    }
    const start = Date.now();
    try {
      const res = await fetch(`${target}/api/health`, {
        signal: AbortSignal.timeout(6000),
        headers: { 'ngrok-skip-browser-warning': '1' },
      });
      const latency = Date.now() - start;
      setWebResult(res.ok
        ? { ok: true, latency, message: `Berhasil! Server merespons dalam ${latency}ms` }
        : { ok: false, message: `Server merespons dengan status ${res.status}` });
    } catch (e: any) {
      setWebResult({ ok: false, message: e?.message ?? 'Tidak dapat terhubung ke server' });
    } finally {
      setWebTesting(false);
    }
  };

  const handleWebSave = async () => {
    setWebSaving(true);
    setWebResult(null);
    try {
      const res = await fetch('/api/admin/backend-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backendUrl: webUrl }),
      });
      const data = await res.json();
      if (data.ok) {
        setWebResult({ ok: true, message: 'URL berhasil disimpan! Proxy langsung menggunakan URL baru.' });
        const refreshed = await fetch('/api/admin/backend-url').then(r => r.json());
        setWebConfig(refreshed);
      } else {
        setWebResult({ ok: false, message: data.message ?? 'Gagal menyimpan.' });
      }
    } catch (e: any) {
      setWebResult({ ok: false, message: e?.message ?? 'Gagal menyimpan.' });
    } finally {
      setWebSaving(false);
    }
  };

  const handleWebReset = async () => {
    setWebResult(null);
    await fetch('/api/admin/backend-url', { method: 'DELETE' });
    const refreshed = await fetch('/api/admin/backend-url').then(r => r.json());
    setWebConfig(refreshed);
    setWebUrl(refreshed.envUrl || '');
    setWebResult({ ok: true, message: 'Dikembalikan ke default dari environment variable.' });
  };

  /* ── Native handlers ──────────────────────────── */
  const handleNativeTest = async () => {
    setNativeTesting(true);
    setNativeResult(null);
    const target = nativeUrl.replace(/\/$/, '');
    const start = Date.now();
    try {
      const res = await fetch(`${target}/api/health`, { signal: AbortSignal.timeout(5000) });
      const latency = Date.now() - start;
      setNativeResult(res.ok
        ? { ok: true, latency, message: `Berhasil! Server merespons dalam ${latency}ms` }
        : { ok: false, message: `Server merespons dengan status ${res.status}` });
    } catch (e: any) {
      setNativeResult({ ok: false, message: e?.message ?? 'Tidak dapat terhubung ke server' });
    } finally {
      setNativeTesting(false);
    }
  };

  const handleNativeSave = async () => {
    setNativeSaving(true);
    try {
      await saveServerUrl(nativeUrl);
      setNativeSaved(nativeUrl);
      setNativeResult({ ok: true, message: 'URL berhasil disimpan! Restart app untuk menerapkan perubahan.' });
    } catch {
      setNativeResult({ ok: false, message: 'Gagal menyimpan URL.' });
    } finally {
      setNativeSaving(false);
    }
  };

  const nativeIsDirty = nativeUrl !== nativeSaved;

  const webIsDirty = !!webConfig && webUrl !== (webConfig.configUrl || webConfig.envUrl || '');

  /* ── Render helpers ───────────────────────────── */
  const ResultBox = ({ result }: { result: TestResult }) =>
    result ? (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        marginTop: 14, padding: '12px 14px', borderRadius: 12,
        background: result.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${result.ok ? '#10B98130' : '#EF444430'}`,
      }}>
        {result.ok
          ? <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }} />
          : <XCircle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />}
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: result.ok ? '#10B981' : '#EF4444' }}>
            {result.ok ? 'Berhasil' : 'Gagal'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{result.message}</p>
        </div>
      </div>
    ) : null;

  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Koneksi Server
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Atur URL backend NestJS yang digunakan oleh ERP ini.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — Web Browser Config (always shown)
      ════════════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--surface)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)', marginBottom: 24,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          background: 'rgba(99,102,241,0.04)',
        }}>
          <Globe size={16} style={{ color: '#6366F1' }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>Konfigurasi Web Browser</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              Berlaku langsung — tidak perlu restart server
            </p>
          </div>
          {!webLoading && webConfig && (
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 20,
              background: webConfig.source === 'config' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
              color: webConfig.source === 'config' ? '#10B981' : '#D97706',
            }}>
              {webConfig.source === 'config' ? '● Kustom' : '● Default (env)'}
            </span>
          )}
        </div>

        {/* Effective URL display */}
        {!webLoading && webConfig?.effectiveUrl && (
          <div style={{ padding: '10px 20px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
              URL aktif saat ini:{' '}
              <code style={{ fontSize: 11, color: '#6366F1', background: 'rgba(99,102,241,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                {webConfig.effectiveUrl}
              </code>
            </p>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            URL Backend Server
          </p>
          <input
            value={webUrl}
            onChange={e => { setWebUrl(e.target.value); setWebResult(null); }}
            placeholder="Contoh: https://api.yourdomain.com atau http://192.168.1.100:8000"
            style={inputStyle}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <p style={{ margin: '7px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Masukkan URL backend yang sudah di-deploy. Jika pakai ngrok, paste URL ngrok-nya.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--surface-sunken)' }}>
          <button
            onClick={handleWebTest}
            disabled={webTesting || !webUrl.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
              cursor: webTesting || !webUrl.trim() ? 'not-allowed' : 'pointer',
              opacity: !webUrl.trim() ? 0.5 : 1,
            }}
          >
            {webTesting
              ? <RefreshCw size={13} style={{ animation: 'spin .7s linear infinite' }} />
              : <Wifi size={13} />}
            {webTesting ? 'Mengetes…' : 'Test Koneksi'}
          </button>

          <button
            onClick={handleWebSave}
            disabled={webSaving || !webUrl.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              border: 'none',
              background: webUrl.trim() ? '#6366F1' : '#94A3B8',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: webSaving || !webUrl.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={13} />
            {webSaving ? 'Menyimpan…' : 'Simpan'}
          </button>

          {webConfig?.source === 'config' && (
            <button
              onClick={handleWebReset}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10,
                border: '1.5px solid #EF444430', background: 'transparent',
                color: '#EF4444', fontSize: 13, cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
              Reset ke Default
            </button>
          )}
        </div>

        {/* Result */}
        {webResult && (
          <div style={{ padding: '0 20px 16px' }}>
            <ResultBox result={webResult} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — Native Mobile Config
      ════════════════════════════════════════════════════ */}
      {isNative && (
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)', marginBottom: 24,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            background: 'rgba(99,102,241,0.04)',
          }}>
            <Smartphone size={16} style={{ color: '#6366F1' }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>Konfigurasi Mobile (Native)</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                Disimpan ke penyimpanan lokal device
              </p>
            </div>
          </div>

          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              URL Backend Server (Mobile)
            </p>
            <input
              value={nativeUrl}
              onChange={e => { setNativeUrl(e.target.value); setNativeResult(null); }}
              placeholder={`Contoh: ${DEFAULT_SERVER_URL}`}
              style={inputStyle}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div style={{ padding: '12px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--surface-sunken)' }}>
            <button
              onClick={handleNativeTest}
              disabled={nativeTesting || !nativeUrl.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {nativeTesting ? <RefreshCw size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Wifi size={13} />}
              {nativeTesting ? 'Mengetes…' : 'Test Koneksi'}
            </button>
            <button
              onClick={handleNativeSave}
              disabled={nativeSaving || !nativeIsDirty || !nativeUrl.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: nativeIsDirty ? '#6366F1' : '#94A3B8', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Save size={13} />
              {nativeSaving ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              onClick={async () => { setNativeUrl(DEFAULT_SERVER_URL); setNativeResult(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {nativeResult && (
            <div style={{ padding: '0 20px 16px' }}>
              <ResultBox result={nativeResult} />
            </div>
          )}
        </div>
      )}

      {/* ── Info box ────────────────────────────────── */}
      <div style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>💡 Cara setup backend</p>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: '1.9' }}>
          <li>Deploy backend NestJS ke server atau gunakan ngrok untuk expose localhost.</li>
          <li>Masukkan URL backend ke field di atas. Contoh: <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 4 }}>https://abc123.ngrok-free.app</code></li>
          <li>Tekan <strong>Test Koneksi</strong> untuk memverifikasi koneksi.</li>
          <li>Tekan <strong>Simpan</strong> — proxy langsung menggunakan URL baru tanpa restart.</li>
        </ol>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

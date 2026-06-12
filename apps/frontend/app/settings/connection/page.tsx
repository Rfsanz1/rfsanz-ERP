'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Save, RotateCcw, CheckCircle2, XCircle, Server, Smartphone } from 'lucide-react';
import { DEFAULT_SERVER_URL, saveServerUrl, loadServerUrl, isNativePlatform } from '../../../lib/api-config';
import { api } from '../../../lib/api';

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

export default function ConnectionPage() {
  const [url, setUrl]           = useState('');
  const [saved, setSaved]       = useState<string | null>(null);
  const [testing, setTesting]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [result, setResult]     = useState<TestResult>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativePlatform());
    loadServerUrl().then(v => {
      const val = v || DEFAULT_SERVER_URL;
      setUrl(val);
      setSaved(val);
    });
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    const target = url.replace(/\/$/, '');
    const start  = Date.now();
    try {
      const res = await api.get(
        isNative ? `${target}/api/health` : '/api/health',
        { timeout: 5000 }
      );
      const latency = Date.now() - start;
      if (res.status === 200) {
        setResult({ ok: true, latency, message: `Berhasil! Server merespons dalam ${latency}ms` });
      } else {
        setResult({ ok: false, message: `Server merespons dengan status ${res.status}` });
      }
    } catch (e: any) {
      setResult({ ok: false, message: e?.message ?? 'Tidak dapat terhubung ke server' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveServerUrl(url);
      setSaved(url);
      setResult({ ok: true, message: 'URL berhasil disimpan! Restart app untuk menerapkan perubahan.' });
    } catch (e: any) {
      setResult({ ok: false, message: 'Gagal menyimpan URL.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setUrl(DEFAULT_SERVER_URL);
    setResult(null);
    await saveServerUrl(DEFAULT_SERVER_URL);
    setSaved(DEFAULT_SERVER_URL);
  };

  const isDirty = url !== saved;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Koneksi Server
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Atur alamat server ERP yang akan digunakan oleh aplikasi mobile.
        </p>
      </div>

      {/* Platform badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: isNative ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isNative ? '#6366F120' : '#10B98120'}`, marginBottom: 24 }}>
        {isNative ? <Smartphone size={16} style={{ color: '#6366F1' }} /> : <Server size={16} style={{ color: '#10B981' }} />}
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isNative ? '#6366F1' : '#10B981' }}>
            {isNative ? 'Mode Native (Android/iOS)' : 'Mode Browser Web'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            {isNative
              ? 'Pengaturan URL akan disimpan ke penyimpanan lokal device.'
              : 'Di browser web, API diakses melalui proxy Next.js (/api). URL di sini hanya untuk referensi.'}
          </p>
        </div>
      </div>

      {/* Config card */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            URL Backend Server
          </p>

          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setResult(null); }}
            placeholder={`Contoh: ${DEFAULT_SERVER_URL}`}
            style={inputStyle}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />

          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Masukkan IP server CasaOS + port NestJS. Contoh:{' '}
            <code style={{ background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 4 }}>http://192.168.1.100:8000</code>
          </p>
        </div>

        {/* Buttons */}
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-sunken)' }}>
          <button
            onClick={handleTest}
            disabled={testing || !url.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: testing ? 'wait' : 'pointer', opacity: !url.trim() ? 0.5 : 1 }}
          >
            {testing ? <RotateCcw size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Wifi size={13} />}
            {testing ? 'Mengetes…' : 'Test Koneksi'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !isDirty || !url.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: isDirty && url.trim() ? '#6366F1' : '#94A3B8', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving || !isDirty ? 'not-allowed' : 'pointer' }}
          >
            <Save size={13} />
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>

          <button
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
          >
            <RotateCcw size={12} />
            Reset Default
          </button>
        </div>
      </div>

      {/* Test result */}
      {result && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: '14px 16px', borderRadius: 12, background: result.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${result.ok ? '#10B98130' : '#EF444430'}` }}>
          {result.ok
            ? <CheckCircle2 size={17} style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }} />
            : <XCircle     size={17} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />}
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: result.ok ? '#10B981' : '#EF4444' }}>
              {result.ok ? 'Koneksi Berhasil' : 'Koneksi Gagal'}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{result.message}</p>
          </div>
        </div>
      )}

      {/* Info box */}
      <div style={{ marginTop: 24, padding: '16px 18px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>💡 Cara setup di jaringan lokal (CasaOS)</p>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: '1.8' }}>
          <li>Pastikan HP dan server berada di jaringan WiFi yang sama.</li>
          <li>Cek IP server CasaOS dari terminal: <code>ip addr | grep inet</code></li>
          <li>Masukkan IP tersebut dengan port <strong>8000</strong> ke field di atas.</li>
          <li>Tekan <strong>Test Koneksi</strong> untuk verifikasi.</li>
          <li>Jika berhasil, tekan <strong>Simpan</strong> lalu restart app.</li>
        </ol>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

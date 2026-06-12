'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import {
  CheckCircle, AlertCircle, RefreshCw, Key, Eye, EyeOff,
  Save, Loader2, Link2, ExternalLink,
} from 'lucide-react';

interface KledoConfig {
  tokenSet: boolean;
  tokenMasked: string;
  baseUrl: string;
  source: 'env' | 'database' | 'none';
}

interface KledoStatus {
  connected: boolean;
  message: string;
}

export default function ApiIntegrationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [config, setConfig] = useState<KledoConfig | null>(null);
  const [status, setStatus] = useState<KledoStatus | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [kledoToken, setKledoToken] = useState('');
  const [kledoBaseUrl, setKledoBaseUrl] = useState('https://api.kledo.com/api/v1');
  const [showToken, setShowToken] = useState(false);
  const [edited, setEdited] = useState(false);

  const apiFetch = useCallback(
    (path: string, opts?: RequestInit) =>
      fetch(path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
      }),
    [token],
  );

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await apiFetch('/api/kledo/config');
      if (res.ok) {
        const data: KledoConfig = await res.json();
        setConfig(data);
        setKledoBaseUrl(data.baseUrl || 'https://api.kledo.com/api/v1');
      }
    } catch { /* ignore */ } finally {
      setLoadingConfig(false);
    }
  }, [apiFetch]);

  const checkStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/kledo/status');
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
    loadConfig();
    checkStatus();
  }, [token]);

  const handleSave = async () => {
    if (!kledoToken.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await apiFetch('/api/kledo/config', {
        method: 'PUT',
        body: JSON.stringify({ token: kledoToken.trim(), baseUrl: kledoBaseUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg({ ok: true, text: 'Token berhasil disimpan ke database!' });
        setKledoToken('');
        setEdited(false);
        await loadConfig();
        await checkStatus();
      } else {
        setSaveMsg({ ok: false, text: data?.message ?? 'Gagal menyimpan token' });
      }
    } catch (e: any) {
      setSaveMsg({ ok: false, text: e.message ?? 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !token) return null;

  const sourceLabel =
    config?.source === 'env' ? '📁 Dari environment variable (.env)' :
    config?.source === 'database' ? '🗄️ Dari database (diatur lewat UI ini)' :
    '❌ Belum diatur';

  return (
    <OdooLayout title="API & Integrasi" subtitle="Kelola token dan koneksi ke layanan third-party">
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* ── Header card ── */}
        <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-3xl">📊</div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: '#1E1B4B' }}>Kledo Accounting</h2>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                Sinkronisasi kontak, produk, dan invoice ke akun Kledo kamu
              </p>
            </div>
            <div className="ml-auto flex-shrink-0">
              {loadingStatus ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>
                  <Loader2 className="h-3 w-3 animate-spin" /> Mengecek...
                </span>
              ) : status?.connected ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,.1)', color: '#16A34A' }}>
                  <CheckCircle className="h-3 w-3" /> Terhubung
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,.1)', color: '#DC2626' }}>
                  <AlertCircle className="h-3 w-3" /> Tidak Terhubung
                </span>
              )}
            </div>
          </div>

          {status && !status.connected && (
            <div className="mt-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,.06)', color: '#DC2626' }}>
              {status.message}
            </div>
          )}
          {status?.connected && (
            <div className="mt-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'rgba(34,197,94,.06)', color: '#16A34A' }}>
              ✅ {status.message}
            </div>
          )}
        </div>

        {/* ── Token saat ini ── */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold" style={{ color: '#1E1B4B' }}>Token Aktif</h3>

          {loadingConfig ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#9CA3AF' }}>
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat konfigurasi...
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <Key className="h-4 w-4 flex-shrink-0" style={{ color: config?.tokenSet ? '#6366F1' : '#D1D5DB' }} />
                <span className="flex-1 font-mono text-sm" style={{ color: config?.tokenSet ? '#1E1B4B' : '#D1D5DB' }}>
                  {config?.tokenSet ? config.tokenMasked : 'Belum ada token'}
                </span>
                {config?.tokenSet && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,.1)', color: '#6366F1' }}>
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Sumber: {sourceLabel}</p>
            </div>
          )}
        </div>

        {/* ── Form input token baru ── */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ color: '#1E1B4B' }}>
              {config?.tokenSet ? 'Ganti Token Kledo' : 'Atur Token Kledo'}
            </h3>
            <a
              href="https://app.kledo.com/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: '#6366F1' }}
            >
              Dapatkan token <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Token API Kledo</label>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ border: `1.5px solid ${edited ? '#6366F1' : '#E5E7EB'}`, background: '#FAFAFA' }}>
              <Key className="h-4 w-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
              <input
                type={showToken ? 'text' : 'password'}
                value={kledoToken}
                onChange={e => { setKledoToken(e.target.value); setEdited(true); setSaveMsg(null); }}
                placeholder="Paste token API Kledo di sini..."
                className="flex-1 bg-transparent text-sm outline-none font-mono"
                style={{ color: '#1E1B4B' }}
              />
              <button onClick={() => setShowToken(v => !v)} style={{ color: '#9CA3AF' }}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Login kledo.com → nama akun (kanan atas) → Pengaturan → API → buat/salin token
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Base URL API (opsional)</label>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ border: '1.5px solid #E5E7EB', background: '#FAFAFA' }}>
              <Link2 className="h-4 w-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
              <input
                type="text"
                value={kledoBaseUrl}
                onChange={e => { setKledoBaseUrl(e.target.value); setEdited(true); }}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#1E1B4B' }}
              />
            </div>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Jangan diubah kecuali ada instruksi khusus dari Kledo</p>
          </div>

          {saveMsg && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: saveMsg.ok ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
                color: saveMsg.ok ? '#16A34A' : '#DC2626',
              }}
            >
              {saveMsg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {saveMsg.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!kledoToken.trim() || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{
                background: kledoToken.trim() && !saving ? '#6366F1' : '#E5E7EB',
                color: kledoToken.trim() && !saving ? '#fff' : '#9CA3AF',
                cursor: kledoToken.trim() && !saving ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Token'}
            </button>

            <button
              onClick={() => { checkStatus(); }}
              disabled={loadingStatus}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{ background: 'rgba(99,102,241,.08)', color: '#6366F1', cursor: loadingStatus ? 'not-allowed' : 'pointer' }}
            >
              {loadingStatus
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
              Test Koneksi
            </button>
          </div>
        </div>

        {/* ── Cara deploy ke CasaOS ── */}
        <div className="rounded-2xl p-6 space-y-3" style={{ background: 'rgba(99,102,241,.04)', border: '1.5px solid rgba(99,102,241,.15)' }}>
          <h3 className="font-bold text-sm" style={{ color: '#4338CA' }}>💡 Tidak perlu edit .env di CasaOS</h3>
          <p className="text-xs leading-relaxed" style={{ color: '#6366F1' }}>
            Token yang kamu simpan di sini akan tersimpan ke database — otomatis terbaca di CasaOS maupun Replit tanpa
            perlu menyentuh file <code className="font-mono bg-white rounded px-1">.env</code>.
            Jika token diisi di <code className="font-mono bg-white rounded px-1">.env</code> sekaligus di sini, yang di
            <code className="font-mono bg-white rounded px-1"> .env</code> akan diprioritaskan.
          </p>
        </div>

      </div>
    </OdooLayout>
  );
}

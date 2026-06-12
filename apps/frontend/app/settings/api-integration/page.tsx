'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import {
  CheckCircle, AlertCircle, X, Eye, EyeOff,
  Save, Loader2, ExternalLink,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════════════ */
interface Field {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  hint?: string;
}

interface Integration {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  color: string;
  bg: string;
  section: 'api' | 'marketplace' | 'messaging';
  fields: Field[];
  docsUrl?: string;
  docsLabel?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'kledo',
    name: 'Kledo',
    desc: 'Sinkronisasi jurnal, invoice, dan kontak ke akuntansi Kledo',
    emoji: '📊',
    color: '#2563EB',
    bg: 'rgba(37,99,235,.08)',
    section: 'api',
    docsUrl: 'https://app.kledo.com/settings/api',
    docsLabel: 'Dapatkan token',
    fields: [
      { key: 'token', label: 'Token API', secret: true, placeholder: 'Paste token API Kledo…', hint: 'Login kledo.com → nama akun → Pengaturan → API → buat token' },
      { key: 'baseUrl', label: 'Base URL (opsional)', placeholder: 'https://api.kledo.com/api/v1', hint: 'Biarkan default kecuali ada instruksi khusus' },
    ],
  },
  {
    id: 'fonnte',
    name: 'Fonnte WhatsApp',
    desc: 'Notifikasi order, bukti transfer & reminder via WhatsApp',
    emoji: '💬',
    color: '#16A34A',
    bg: 'rgba(22,163,74,.08)',
    section: 'messaging',
    docsUrl: 'https://fonnte.com',
    docsLabel: 'Daftar Fonnte',
    fields: [
      { key: 'token', label: 'Token Fonnte', secret: true, placeholder: 'Paste token Fonnte…', hint: 'Login fonnte.com → Perangkat → klik nomor WA → salin Token' },
      { key: 'groupInvoice', label: 'Group ID Notif Order Baru', placeholder: '120363xxxxxx@g.us', hint: 'ID grup WhatsApp yang terima notifikasi order baru' },
      { key: 'groupBuktiTf', label: 'Group ID Notif Bukti Transfer', placeholder: '120363xxxxxx@g.us', hint: 'ID grup yang terima foto bukti transfer dari customer' },
    ],
  },
  {
    id: 'shopee',
    name: 'Shopee',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari toko Shopee',
    emoji: '🛍️',
    color: '#F97316',
    bg: 'rgba(249,115,22,.08)',
    section: 'marketplace',
    docsUrl: 'https://open.shopee.com',
    docsLabel: 'Shopee Open Platform',
    fields: [
      { key: 'partnerId', label: 'Partner ID', placeholder: '1234567' },
      { key: 'partnerKey', label: 'Partner Key', secret: true, placeholder: 'Paste partner key…' },
      { key: 'shopId', label: 'Shop ID', placeholder: 'ID toko Shopee kamu' },
    ],
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari toko Tokopedia',
    emoji: '🟢',
    color: '#059669',
    bg: 'rgba(5,150,105,.08)',
    section: 'marketplace',
    docsUrl: 'https://developer.tokopedia.com',
    docsLabel: 'Tokopedia Developer',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Client ID dari Tokopedia' },
      { key: 'clientSecret', label: 'Client Secret', secret: true, placeholder: 'Paste client secret…' },
      { key: 'shopId', label: 'Shop ID', placeholder: 'ID toko Tokopedia kamu' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari TikTok Shop',
    emoji: '🎵',
    color: '#1E1B4B',
    bg: 'rgba(30,27,75,.06)',
    section: 'marketplace',
    docsUrl: 'https://partner.tiktokshop.com',
    docsLabel: 'TikTok Shop Partner',
    fields: [
      { key: 'appKey', label: 'App Key', placeholder: 'App key TikTok Shop' },
      { key: 'appSecret', label: 'App Secret', secret: true, placeholder: 'Paste app secret…' },
      { key: 'shopCipher', label: 'Shop Cipher', placeholder: 'Shop cipher dari TikTok Shop' },
    ],
  },
  {
    id: 'lazada',
    name: 'Lazada',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari toko Lazada',
    emoji: '🔵',
    color: '#0A21C0',
    bg: 'rgba(10,33,192,.07)',
    section: 'marketplace',
    docsUrl: 'https://open.lazada.com',
    docsLabel: 'Lazada Open Platform',
    fields: [
      { key: 'appKey', label: 'App Key', placeholder: 'App key Lazada' },
      { key: 'appSecret', label: 'App Secret', secret: true, placeholder: 'Paste app secret…' },
      { key: 'accessToken', label: 'Access Token', secret: true, placeholder: 'Paste access token…' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   TIPE STATE
══════════════════════════════════════════════════════════════════════════ */
type KledoConfig = { tokenSet: boolean; tokenMasked: string; source: string } | null;
type KledoStatus = { connected: boolean; message: string } | null;

/* ══════════════════════════════════════════════════════════════════════════
   KARTU INTEGRASI
══════════════════════════════════════════════════════════════════════════ */
function IntCard({
  intg, onClick, connected, tokenMasked,
}: {
  intg: Integration;
  onClick: () => void;
  connected?: boolean | null;
  tokenMasked?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-5 w-full transition-all hover:scale-[1.02]"
      style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}
    >
      {/* ikon + badge status */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: intg.bg }}
        >
          {intg.emoji}
        </div>
        {connected === true && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,.12)', color: '#16A34A' }}>
            <CheckCircle className="h-2.5 w-2.5" /> Aktif
          </span>
        )}
        {connected === false && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,.1)', color: '#DC2626' }}>
            <AlertCircle className="h-2.5 w-2.5" /> Error
          </span>
        )}
      </div>

      <p className="font-bold text-sm mb-1" style={{ color: '#1E1B4B' }}>{intg.name}</p>
      <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{intg.desc}</p>

      {tokenMasked && (
        <p className="mt-2 text-[10px] font-mono truncate" style={{ color: intg.color }}>
          {tokenMasked}
        </p>
      )}

      <div className="mt-3 text-xs font-semibold" style={{ color: intg.color }}>
        Konfigurasi →
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL KONFIGURASI
══════════════════════════════════════════════════════════════════════════ */
function ConfigModal({
  intg, onClose, authToken, kledoConfig, kledoStatus,
  onKledoSaved,
}: {
  intg: Integration;
  onClose: () => void;
  authToken: string | null;
  kledoConfig: KledoConfig;
  kledoStatus: KledoStatus;
  onKledoSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<KledoStatus>(kledoStatus);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const apiFetch = useCallback(
    (path: string, opts?: RequestInit) =>
      fetch(path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}`, ...(opts?.headers ?? {}) },
      }),
    [authToken],
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      if (intg.id === 'kledo') {
        const res = await apiFetch('/api/kledo/config', {
          method: 'PUT',
          body: JSON.stringify({ token: values['token'] ?? '', baseUrl: values['baseUrl'] || undefined }),
        });
        const data = await res.json();
        if (res.ok) {
          setSaveMsg({ ok: true, text: 'Token berhasil disimpan!' });
          setValues({});
          onKledoSaved();
          handleTest();
        } else {
          setSaveMsg({ ok: false, text: data?.message ?? 'Gagal menyimpan' });
        }
      } else {
        await new Promise(r => setTimeout(r, 700));
        setSaveMsg({ ok: false, text: 'Integrasi ini belum tersedia — segera hadir!' });
      }
    } catch (e: any) {
      setSaveMsg({ ok: false, text: e.message ?? 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (intg.id !== 'kledo') return;
    setTesting(true);
    try {
      const res = await fetch('/api/kledo/status');
      setStatus(await res.json());
    } catch { /* ignore */ } finally {
      setTesting(false);
    }
  };

  const hasInput = Object.values(values).some(v => v.trim());

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Dialog */}
      <div
        className="w-full max-w-lg rounded-3xl p-6 space-y-5 overflow-y-auto"
        style={{ background: '#fff', maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: intg.bg }}>
              {intg.emoji}
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: '#1E1B4B' }}>{intg.name}</h2>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{intg.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: '#9CA3AF' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status (Kledo) */}
        {intg.id === 'kledo' && status && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
            style={{
              background: status.connected ? 'rgba(34,197,94,.07)' : 'rgba(239,68,68,.07)',
              color: status.connected ? '#16A34A' : '#DC2626',
            }}
          >
            {status.connected ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {status.message}
          </div>
        )}

        {/* Token aktif (Kledo) */}
        {intg.id === 'kledo' && kledoConfig?.tokenSet && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Token aktif:</span>
            <span className="flex-1 font-mono text-xs" style={{ color: '#1E1B4B' }}>{kledoConfig.tokenMasked}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${intg.color}15`, color: intg.color }}>
              {kledoConfig.source === 'env' ? 'dari .env' : 'database'}
            </span>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          {intg.fields.map(field => (
            <div key={field.key} className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>{field.label}</label>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-3"
                style={{ border: `1.5px solid ${values[field.key] ? intg.color + '80' : '#E5E7EB'}`, background: '#FAFAFA' }}
              >
                <input
                  type={field.secret && !show[field.key] ? 'password' : 'text'}
                  value={values[field.key] ?? ''}
                  onChange={e => { setValues(v => ({ ...v, [field.key]: e.target.value })); setSaveMsg(null); }}
                  placeholder={field.placeholder}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: '#1E1B4B', fontFamily: field.secret ? 'monospace' : undefined }}
                />
                {field.secret && (
                  <button onClick={() => setShow(s => ({ ...s, [field.key]: !s[field.key] }))} style={{ color: '#9CA3AF' }}>
                    {show[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
              {field.hint && <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{field.hint}</p>}
            </div>
          ))}
        </div>

        {/* Save message */}
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

        {/* Tombol aksi */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !hasInput}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center"
            style={{
              background: hasInput && !saving ? intg.color : '#E5E7EB',
              color: hasInput && !saving ? '#fff' : '#9CA3AF',
              cursor: hasInput && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>

          {intg.id === 'kledo' && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: `${intg.color}12`, color: intg.color, cursor: testing ? 'not-allowed' : 'pointer' }}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Test
            </button>
          )}

          {intg.docsUrl && (
            <a
              href={intg.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold px-4 py-2.5 rounded-xl"
              style={{ background: '#F3F4F6', color: '#6B7280' }}
            >
              {intg.docsLabel} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Info DB */}
        <p className="text-[11px] text-center rounded-xl px-4 py-2" style={{ background: 'rgba(99,102,241,.05)', color: '#6366F1' }}>
          💡 Disimpan di database — tidak perlu edit <code className="font-mono bg-white rounded px-1">.env</code>. Aktif langsung setelah disimpan.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE UTAMA
══════════════════════════════════════════════════════════════════════════ */
export default function ApiIntegrationPage() {
  const { token: authToken } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Integration | null>(null);
  const [kledoConfig, setKledoConfig] = useState<KledoConfig>(null);
  const [kledoStatus, setKledoStatus] = useState<KledoStatus>(null);

  const apiFetch = useCallback(
    (path: string, opts?: RequestInit) =>
      fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}`, ...(opts?.headers ?? {}) } }),
    [authToken],
  );

  const refreshKledo = useCallback(() => {
    apiFetch('/api/kledo/config').then(r => r.ok ? r.json() : null).then(d => d && setKledoConfig(d)).catch(() => {});
    fetch('/api/kledo/status').then(r => r.ok ? r.json() : null).then(d => d && setKledoStatus(d)).catch(() => {});
  }, [apiFetch]);

  useEffect(() => {
    if (!authToken) { router.push('/dashboard'); return; }
    setMounted(true);
    refreshKledo();
  }, [authToken]);

  if (!mounted || !authToken) return null;

  const apiIntgs = INTEGRATIONS.filter(i => i.section === 'api');
  const msgIntgs = INTEGRATIONS.filter(i => i.section === 'messaging');
  const mktIntgs = INTEGRATIONS.filter(i => i.section === 'marketplace');

  return (
    <OdooLayout title="API & Integrasi" subtitle="Hubungkan ERP dengan platform lain">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ── Akuntansi ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#9CA3AF' }}>
            Akuntansi
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {apiIntgs.map(intg => (
              <IntCard
                key={intg.id}
                intg={intg}
                onClick={() => setSelected(intg)}
                connected={intg.id === 'kledo' ? kledoStatus?.connected : undefined}
                tokenMasked={intg.id === 'kledo' && kledoConfig?.tokenSet ? kledoConfig.tokenMasked : undefined}
              />
            ))}
          </div>
        </section>

        {/* ── Pesan & Notifikasi ────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#9CA3AF' }}>
            Pesan & Notifikasi
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {msgIntgs.map(intg => (
              <IntCard key={intg.id} intg={intg} onClick={() => setSelected(intg)} />
            ))}
          </div>
        </section>

        {/* ── Marketplace ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#9CA3AF' }}>
            Marketplace Connect
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {mktIntgs.map(intg => (
              <IntCard key={intg.id} intg={intg} onClick={() => setSelected(intg)} />
            ))}
          </div>
        </section>

      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {selected && (
        <ConfigModal
          intg={selected}
          onClose={() => setSelected(null)}
          authToken={authToken}
          kledoConfig={kledoConfig}
          kledoStatus={kledoStatus}
          onKledoSaved={refreshKledo}
        />
      )}
    </OdooLayout>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import {
  CheckCircle, AlertCircle, X, Eye, EyeOff,
  Save, Loader2, ExternalLink, RotateCcw,
} from 'lucide-react';
import {
  DEFAULT_TEMPLATE_ORDER, DEFAULT_TEMPLATE_PAYMENT, DEFAULT_TEMPLATE_KONSUMEN,
} from '../../../lib/fonnte';

/* ══════════════════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════════════ */
interface Field {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  hint?: string;
  type?: 'text' | 'textarea';
  rows?: number;
  defaultValue?: string;
}

interface Integration {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  color: string;
  bg: string;
  section: 'akuntansi' | 'marketplace' | 'messaging';
  fields: Field[];
  docsUrl?: string;
  docsLabel?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'kledo', name: 'Kledo', desc: 'Akuntansi & invoice',
    emoji: '📊', color: '#2563EB', bg: 'rgba(37,99,235,.08)',
    section: 'akuntansi',
    docsUrl: 'https://app.kledo.com/settings/api', docsLabel: 'Dapatkan token',
    fields: [
      { key: 'token', label: 'Token API', secret: true, placeholder: 'Paste token API Kledo…', hint: 'Login kledo.com → nama akun → Pengaturan → API → buat token' },
      { key: 'baseUrl', label: 'Base URL (opsional)', placeholder: 'https://api.kledo.com/api/v1' },
    ],
  },
  {
    id: 'fonnte', name: 'Fonnte', desc: 'WhatsApp notifikasi',
    emoji: '💬', color: '#16A34A', bg: 'rgba(22,163,74,.08)',
    section: 'messaging',
    docsUrl: 'https://fonnte.com', docsLabel: 'Daftar Fonnte',
    fields: [
      { key: 'token', label: 'Token Fonnte', secret: true, placeholder: 'Paste token Fonnte…', hint: 'Login fonnte.com → Perangkat → klik nomor WA → salin Token' },
      { key: 'groupInvoice', label: 'Group ID Grup Order (Order Baru)', placeholder: '120363xxxxxx@g.us', hint: 'Format: 120363...@g.us — cari di Fonnte → Perangkat → Grup' },
      { key: 'groupBuktiTf', label: 'Group ID Grup Payment (Bukti TF)', placeholder: '120363xxxxxx@g.us', hint: 'Bisa grup berbeda dari Grup Order (misal: grup kasir/keuangan)' },
      { key: 'templateOrder', label: '📢 Template Pesan — Grup Order', type: 'textarea', rows: 7,
        placeholder: 'Template pesan ke grup saat order baru masuk…',
        defaultValue: DEFAULT_TEMPLATE_ORDER,
        hint: 'Variabel: {order_no} {customer_name} {phone} {sales} {items} {total} {payment_method} {status} {datetime}' },
      { key: 'templatePayment', label: '💸 Template Pesan — Grup Payment', type: 'textarea', rows: 6,
        placeholder: 'Template pesan ke grup saat bukti transfer masuk…',
        defaultValue: DEFAULT_TEMPLATE_PAYMENT,
        hint: 'Variabel: {order_no} {customer_name} {phone} {total} {bank} {sales} {datetime}' },
      { key: 'templateKonsumen', label: '👤 Template Pesan — ke Konsumen', type: 'textarea', rows: 7,
        placeholder: 'Template pesan ke WA konsumen saat order berhasil dibuat…',
        defaultValue: DEFAULT_TEMPLATE_KONSUMEN,
        hint: 'Variabel: {customer_name} {item_name} {qty} {total} {status} {datetime}' },
    ],
  },
  {
    id: 'shopee', name: 'Shopee', desc: 'Sinkron produk & pesanan',
    emoji: '🛍️', color: '#F97316', bg: 'rgba(249,115,22,.08)',
    section: 'marketplace',
    docsUrl: 'https://open.shopee.com', docsLabel: 'Shopee Open Platform',
    fields: [
      { key: 'partnerId', label: 'Partner ID', placeholder: '1234567' },
      { key: 'partnerKey', label: 'Partner Key', secret: true, placeholder: 'Paste partner key…' },
      { key: 'shopId', label: 'Shop ID', placeholder: 'ID toko Shopee' },
    ],
  },
  {
    id: 'tokopedia', name: 'Tokopedia', desc: 'Sinkron produk & pesanan',
    emoji: '🟢', color: '#059669', bg: 'rgba(5,150,105,.08)',
    section: 'marketplace',
    docsUrl: 'https://developer.tokopedia.com', docsLabel: 'Tokopedia Developer',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Client ID Tokopedia' },
      { key: 'clientSecret', label: 'Client Secret', secret: true, placeholder: 'Paste client secret…' },
      { key: 'shopId', label: 'Shop ID', placeholder: 'ID toko Tokopedia' },
    ],
  },
  {
    id: 'tiktok', name: 'TikTok Shop', desc: 'Sinkron produk & pesanan',
    emoji: '🎵', color: '#1E1B4B', bg: 'rgba(30,27,75,.06)',
    section: 'marketplace',
    docsUrl: 'https://partner.tiktokshop.com', docsLabel: 'TikTok Partner',
    fields: [
      { key: 'appKey', label: 'App Key', placeholder: 'App key TikTok Shop' },
      { key: 'appSecret', label: 'App Secret', secret: true, placeholder: 'Paste app secret…' },
      { key: 'shopCipher', label: 'Shop Cipher', placeholder: 'Shop cipher' },
    ],
  },
  {
    id: 'lazada', name: 'Lazada', desc: 'Sinkron produk & pesanan',
    emoji: '🔵', color: '#0A21C0', bg: 'rgba(10,33,192,.07)',
    section: 'marketplace',
    docsUrl: 'https://open.lazada.com', docsLabel: 'Lazada Open Platform',
    fields: [
      { key: 'appKey', label: 'App Key', placeholder: 'App key Lazada' },
      { key: 'appSecret', label: 'App Secret', secret: true, placeholder: 'Paste app secret…' },
      { key: 'accessToken', label: 'Access Token', secret: true, placeholder: 'Paste access token…' },
    ],
  },
];

type KledoConfig = { tokenSet: boolean; tokenMasked: string; source: string } | null;
type KledoStatus = { connected: boolean; message: string } | null;

const LS_INTG_PREFIX = 'erp_intg_';

function saveIntgConfig(id: string, vals: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const existing = loadIntgConfig(id);
  window.localStorage.setItem(LS_INTG_PREFIX + id, JSON.stringify({ ...existing, ...vals }));
}

function loadIntgConfig(id: string): Record<string, string> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(LS_INTG_PREFIX + id);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function isIntgSaved(id: string): boolean {
  const cfg = loadIntgConfig(id);
  return Object.values(cfg).some(v => v?.trim());
}

/* ══════════════════════════════════════════════════════════════════════════
   KARTU INTEGRASI — kompak
══════════════════════════════════════════════════════════════════════════ */
function IntCard({
  intg, onClick, connected, tokenSaved,
}: {
  intg: Integration;
  onClick: () => void;
  connected?: boolean | null;
  tokenSaved?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl p-4 w-full transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}
    >
      {/* Baris atas: ikon + badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: intg.bg }}>
          {intg.emoji}
        </div>
        {connected === true && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,.12)', color: '#16A34A' }}>
            <CheckCircle className="h-2 w-2" /> Aktif
          </span>
        )}
        {connected === false && tokenSaved && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(239,68,68,.1)', color: '#DC2626' }}>
            <AlertCircle className="h-2 w-2" /> Error
          </span>
        )}
        {connected !== true && tokenSaved && connected !== false && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(37,99,235,.1)', color: '#2563EB' }}>
            <CheckCircle className="h-2 w-2" /> Tersimpan
          </span>
        )}
        {!tokenSaved && connected !== true && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: '#F3F4F6', color: '#D1D5DB' }}>
            Belum diatur
          </span>
        )}
      </div>

      <p className="font-bold text-sm leading-tight" style={{ color: '#1E1B4B' }}>{intg.name}</p>
      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: '#9CA3AF' }}>{intg.desc}</p>

      <p className="mt-3 text-[11px] font-semibold group-hover:underline" style={{ color: intg.color }}>
        Konfigurasi →
      </p>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MODAL KONFIGURASI
══════════════════════════════════════════════════════════════════════════ */
function ConfigModal({
  intg, onClose, authToken, kledoConfig, kledoStatus, onKledoSaved, onOtherSaved,
}: {
  intg: Integration;
  onClose: () => void;
  authToken: string | null;
  kledoConfig: KledoConfig;
  kledoStatus: KledoStatus;
  onKledoSaved: () => void;
  onOtherSaved: (id: string) => void;
}) {
  const existingSaved = intg.id !== 'kledo' ? loadIntgConfig(intg.id) : {};
  // Pre-populate template fields: key baru → key lama → defaultValue
  const initValues = intg.id === 'fonnte'
    ? {
        ...existingSaved,
        templateOrder: existingSaved.templateOrder ?? existingSaved.template_order ?? DEFAULT_TEMPLATE_ORDER,
        templatePayment: existingSaved.templatePayment ?? existingSaved.template_payment ?? DEFAULT_TEMPLATE_PAYMENT,
        templateKonsumen: existingSaved.templateKonsumen ?? existingSaved.template_invoice ?? DEFAULT_TEMPLATE_KONSUMEN,
      }
    : existingSaved;
  const [values, setValues] = useState<Record<string, string>>(initValues);
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [liveStatus, setLiveStatus] = useState<KledoStatus>(kledoStatus);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const apiFetch = useCallback(
    (path: string, opts?: RequestInit) =>
      fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}`, ...(opts?.headers ?? {}) } }),
    [authToken],
  );

  const safeJson = async (res: globalThis.Response) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { message: text || 'Respons tidak valid dari server' }; }
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      if (intg.id === 'kledo') {
        const token = (values['token'] ?? '').trim();
        if (!token) {
          setSaveMsg({ ok: false, text: 'Token tidak boleh kosong' });
          return;
        }
        const baseUrl = values['baseUrl']?.trim();
        saveIntgConfig('kledo', { token, ...(baseUrl ? { baseUrl } : {}) });

        let backendOk = false;
        try {
          const res = await apiFetch('/api/kledo/config', {
            method: 'PUT',
            body: JSON.stringify({ token, baseUrl: baseUrl || undefined }),
          });
          const data = await safeJson(res);
          if (res.ok) {
            backendOk = true;
            onKledoSaved();
            handleTest();
          } else {
            setSaveMsg({ ok: true, text: `Token Kledo disimpan (backend: ${data?.message ?? 'tidak terhubung'})` });
          }
        } catch {}

        if (backendOk) {
          setSaveMsg({ ok: true, text: 'Token Kledo berhasil disimpan!' });
          setValues({});
        } else if (!saveMsg) {
          setSaveMsg({ ok: true, text: 'Token Kledo disimpan lokal. Hubungkan backend untuk sync penuh.' });
        }
      } else {
        const toSave: Record<string, string> = {};
        intg.fields.forEach(f => { if ((values[f.key] ?? '').trim()) toSave[f.key] = values[f.key].trim(); });
        if (!Object.keys(toSave).length) {
          setSaveMsg({ ok: false, text: 'Isi minimal satu field sebelum menyimpan.' });
          return;
        }
        await new Promise(r => setTimeout(r, 400));
        saveIntgConfig(intg.id, toSave);
        setSaveMsg({ ok: true, text: `Konfigurasi ${intg.name} berhasil disimpan!` });
        onOtherSaved(intg.id);
      }
    } catch (e: any) {
      setSaveMsg({ ok: false, text: 'Tidak dapat menyimpan konfigurasi.' });
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (intg.id !== 'kledo') return;
    setTesting(true);
    try {
      const res = await fetch('/api/kledo/status');
      setLiveStatus(await res.json());
    } catch { } finally { setTesting(false); }
  };

  const hasInput = Object.values(values).some(v => v.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full rounded-3xl p-6 space-y-5 overflow-y-auto ${intg.id === 'fonnte' ? 'max-w-2xl' : 'max-w-md'}`}
        style={{ background: '#fff', maxHeight: '90vh', boxShadow: '0 32px 80px rgba(0,0,0,.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl" style={{ background: intg.bg }}>
              {intg.emoji}
            </div>
            <div>
              <h2 className="font-bold" style={{ color: '#1E1B4B' }}>{intg.name}</h2>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{intg.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" style={{ color: '#9CA3AF' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status koneksi Kledo */}
        {intg.id === 'kledo' && liveStatus && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
            style={{
              background: liveStatus.connected ? 'rgba(34,197,94,.07)' : 'rgba(239,68,68,.07)',
              color: liveStatus.connected ? '#16A34A' : '#DC2626',
            }}>
            {liveStatus.connected
              ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
              : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {liveStatus.message}
          </div>
        )}

        {/* Token aktif Kledo */}
        {intg.id === 'kledo' && kledoConfig?.tokenSet && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-2.5"
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Token aktif:</span>
            <span className="flex-1 font-mono text-xs truncate" style={{ color: '#1E1B4B' }}>{kledoConfig.tokenMasked}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${intg.color}15`, color: intg.color }}>
              {kledoConfig.source === 'env' ? 'dari .env' : 'database'}
            </span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {intg.fields.map(field => (
            <div key={field.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>{field.label}</label>
                {field.type === 'textarea' && field.defaultValue && (
                  <button
                    onClick={() => { setValues(v => ({ ...v, [field.key]: field.defaultValue! })); setSaveMsg(null); }}
                    className="flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100 transition"
                    style={{ color: intg.color }}
                    title="Reset ke template default"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Reset
                  </button>
                )}
              </div>

              {field.type === 'textarea' ? (
                <textarea
                  value={values[field.key] ?? field.defaultValue ?? ''}
                  onChange={e => { setValues(v => ({ ...v, [field.key]: e.target.value })); setSaveMsg(null); }}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 4}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none font-mono"
                  style={{
                    border: `1.5px solid ${values[field.key] ? intg.color + '60' : '#E5E7EB'}`,
                    background: '#FAFAFA', color: '#1E1B4B', outline: 'none', lineHeight: 1.6,
                  }}
                  onFocus={e => (e.target.style.borderColor = intg.color)}
                  onBlur={e => (e.target.style.borderColor = values[field.key] ? intg.color + '60' : '#E5E7EB')}
                />
              ) : (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ border: `1.5px solid ${values[field.key] ? intg.color + '80' : '#E5E7EB'}`, background: '#FAFAFA' }}>
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
              )}

              {field.hint && (
                <p className="text-[10px] leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {field.type === 'textarea' ? <><span className="font-semibold">Variabel: </span>{field.hint.replace('Variabel: ', '')}</> : field.hint}
                </p>
              )}
            </div>
          ))}
        </div>

        {saveMsg && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              background: saveMsg.ok ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
              color: saveMsg.ok ? '#16A34A' : '#DC2626',
            }}>
            {saveMsg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {saveMsg.text}
          </div>
        )}

        {/* Tombol */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving || !hasInput}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center"
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
            <button onClick={handleTest} disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: `${intg.color}12`, color: intg.color }}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Test
            </button>
          )}

          {intg.docsUrl && (
            <a href={intg.docsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-xl"
              style={{ background: '#F3F4F6', color: '#6B7280' }}>
              {intg.docsLabel} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <p className="text-[11px] text-center rounded-xl px-4 py-2"
          style={{ background: 'rgba(99,102,241,.05)', color: '#6366F1' }}>
          💡 Disimpan di database — tidak perlu edit <code className="font-mono bg-white rounded px-1">.env</code> di server.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════════════════════════════════════ */
function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: '#EDE9FE' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function ApiIntegrationPage() {
  const { token: authToken, authReady } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Integration | null>(null);
  const [kledoConfig, setKledoConfig] = useState<KledoConfig>(null);
  const [kledoStatus, setKledoStatus] = useState<KledoStatus>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

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
    if (!authReady) return;
    if (!authToken) return;
    setMounted(true);
    refreshKledo();
    const initial = new Set<string>();
    INTEGRATIONS.forEach(i => { if (i.id !== 'kledo' && isIntgSaved(i.id)) initial.add(i.id); });
    setSavedIds(initial);
  }, [authReady, authToken]);

  if (!authReady || !mounted || !authToken) return null;

  const bySection = (s: Integration['section']) => INTEGRATIONS.filter(i => i.section === s);

  const handleOtherSaved = (id: string) => setSavedIds(prev => new Set([...prev, id]));

  return (
    <OdooLayout title="API & Integrasi" subtitle="Hubungkan ERP dengan platform lain">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Akuntansi */}
        <section>
          <SectionHead label="Akuntansi" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bySection('akuntansi').map(intg => (
              <IntCard key={intg.id} intg={intg} onClick={() => setSelected(intg)}
                connected={intg.id === 'kledo' ? kledoStatus?.connected : undefined}
                tokenSaved={intg.id === 'kledo' ? (kledoConfig?.tokenSet ?? false) : undefined} />
            ))}
          </div>
        </section>

        {/* Pesan & Notifikasi */}
        <section>
          <SectionHead label="Pesan & Notifikasi" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bySection('messaging').map(intg => (
              <IntCard key={intg.id} intg={intg} onClick={() => setSelected(intg)}
                tokenSaved={savedIds.has(intg.id)} />
            ))}
          </div>
        </section>

        {/* Marketplace */}
        <section>
          <SectionHead label="Marketplace Connect" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bySection('marketplace').map(intg => (
              <IntCard key={intg.id} intg={intg} onClick={() => setSelected(intg)}
                tokenSaved={savedIds.has(intg.id)} />
            ))}
          </div>
        </section>

      </div>

      {selected && (
        <ConfigModal
          intg={selected}
          onClose={() => setSelected(null)}
          authToken={authToken}
          kledoConfig={kledoConfig}
          kledoStatus={kledoStatus}
          onKledoSaved={refreshKledo}
          onOtherSaved={handleOtherSaved}
        />
      )}
    </OdooLayout>
  );
}

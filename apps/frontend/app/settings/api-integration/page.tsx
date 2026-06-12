'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import {
  CheckCircle, AlertCircle, X, Eye, EyeOff,
  Save, Loader2, ExternalLink, ChevronRight,
} from 'lucide-react';

/* ── Daftar integrasi ─────────────────────────────────────────────────────── */
interface Integration {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  color: string;
  bg: string;
  fields: Field[];
  docsUrl?: string;
  docsLabel?: string;
}

interface Field {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  hint?: string;
  readOnly?: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'kledo',
    name: 'Kledo',
    desc: 'Sinkronisasi jurnal, invoice, dan kontak ke akuntansi Kledo',
    emoji: '📊',
    color: '#2563EB',
    bg: 'rgba(37,99,235,.07)',
    docsUrl: 'https://app.kledo.com/settings/api',
    docsLabel: 'Dapatkan token Kledo',
    fields: [
      {
        key: 'token', label: 'Token API', secret: true,
        placeholder: 'Paste token API Kledo…',
        hint: 'Login kledo.com → nama akun → Pengaturan → API → buat token',
      },
      {
        key: 'baseUrl', label: 'Base URL (opsional)', secret: false,
        placeholder: 'https://api.kledo.com/api/v1',
        hint: 'Biarkan default kecuali ada instruksi khusus dari Kledo',
      },
    ],
  },
  {
    id: 'fonnte',
    name: 'Fonnte WhatsApp',
    desc: 'Gateway WhatsApp untuk notifikasi order, bukti transfer, dan reminder',
    emoji: '💬',
    color: '#16A34A',
    bg: 'rgba(22,163,74,.07)',
    docsUrl: 'https://fonnte.com',
    docsLabel: 'Daftar Fonnte',
    fields: [
      {
        key: 'token', label: 'Token Fonnte', secret: true,
        placeholder: 'Paste token Fonnte…',
        hint: 'Login fonnte.com → Perangkat → klik nomor WA → salin Token',
      },
      {
        key: 'groupInvoice', label: 'Group ID — Notif Order Baru', secret: false,
        placeholder: '120363405869453556@g.us',
        hint: 'ID grup yang terima notifikasi setiap order baru masuk',
      },
      {
        key: 'groupBuktiTf', label: 'Group ID — Notif Bukti Transfer', secret: false,
        placeholder: '120363405869453556@g.us',
        hint: 'ID grup yang terima foto bukti transfer dari customer',
      },
    ],
  },
  {
    id: 'shopee',
    name: 'Shopee',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari toko Shopee',
    emoji: '🛒',
    color: '#F97316',
    bg: 'rgba(249,115,22,.07)',
    docsUrl: 'https://open.shopee.com',
    docsLabel: 'Shopee Open Platform',
    fields: [
      {
        key: 'partnerId', label: 'Partner ID', secret: false,
        placeholder: '1234567',
        hint: 'Partner ID dari Shopee Open Platform',
      },
      {
        key: 'partnerKey', label: 'Partner Key', secret: true,
        placeholder: 'Paste partner key…',
      },
      {
        key: 'shopId', label: 'Shop ID', secret: false,
        placeholder: 'ID toko Shopee kamu',
      },
    ],
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari toko Tokopedia',
    emoji: '🟢',
    color: '#22C55E',
    bg: 'rgba(34,197,94,.07)',
    docsUrl: 'https://developer.tokopedia.com',
    docsLabel: 'Tokopedia Developer',
    fields: [
      {
        key: 'clientId', label: 'Client ID', secret: false,
        placeholder: 'Client ID dari Tokopedia',
      },
      {
        key: 'clientSecret', label: 'Client Secret', secret: true,
        placeholder: 'Paste client secret…',
      },
      {
        key: 'shopId', label: 'Shop ID', secret: false,
        placeholder: 'ID toko Tokopedia kamu',
      },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari TikTok Shop',
    emoji: '🎵',
    color: '#000000',
    bg: 'rgba(0,0,0,.05)',
    docsUrl: 'https://partner.tiktokshop.com',
    docsLabel: 'TikTok Shop Partner',
    fields: [
      {
        key: 'appKey', label: 'App Key', secret: false,
        placeholder: 'App key TikTok Shop',
      },
      {
        key: 'appSecret', label: 'App Secret', secret: true,
        placeholder: 'Paste app secret…',
      },
      {
        key: 'shopCipher', label: 'Shop Cipher', secret: false,
        placeholder: 'Shop cipher dari TikTok Shop',
      },
    ],
  },
  {
    id: 'lazada',
    name: 'Lazada',
    desc: 'Sinkronisasi produk, stok, dan pesanan dari toko Lazada',
    emoji: '🔵',
    color: '#3B5BDB',
    bg: 'rgba(59,91,219,.07)',
    docsUrl: 'https://open.lazada.com',
    docsLabel: 'Lazada Open Platform',
    fields: [
      {
        key: 'appKey', label: 'App Key', secret: false,
        placeholder: 'App key Lazada',
      },
      {
        key: 'appSecret', label: 'App Secret', secret: true,
        placeholder: 'Paste app secret…',
      },
      {
        key: 'accessToken', label: 'Access Token', secret: true,
        placeholder: 'Paste access token…',
      },
    ],
  },
];

/* ── Tipe state per integrasi ────────────────────────────────────────────── */
type StatusMap = Record<string, { connected: boolean; message: string } | null>;
type FieldValues = Record<string, string>;
type ShowMap = Record<string, boolean>;

/* ── Komponen utama ──────────────────────────────────────────────────────── */
export default function ApiIntegrationPage() {
  const { token: authToken } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [selected, setSelected] = useState<Integration | null>(null);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [values, setValues] = useState<FieldValues>({});
  const [show, setShow] = useState<ShowMap>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [kledoConfig, setKledoConfig] = useState<{ tokenSet: boolean; tokenMasked: string; source: string } | null>(null);

  const apiFetch = useCallback(
    (path: string, opts?: RequestInit) =>
      fetch(path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}`, ...(opts?.headers ?? {}) },
      }),
    [authToken],
  );

  /* check kledo status on mount */
  useEffect(() => {
    if (!authToken) { router.push('/dashboard'); return; }
    setMounted(true);

    fetch('/api/kledo/status')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStatusMap(prev => ({ ...prev, kledo: d })))
      .catch(() => {});

    apiFetch('/api/kledo/config')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setKledoConfig(d))
      .catch(() => {});
  }, [authToken]);

  const openIntegration = (intg: Integration) => {
    setSelected(intg);
    setSaveMsg(null);
    setValues({});
  };

  const close = () => { setSelected(null); setSaveMsg(null); };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg(null);

    try {
      if (selected.id === 'kledo') {
        const res = await apiFetch('/api/kledo/config', {
          method: 'PUT',
          body: JSON.stringify({ token: values['token'] ?? '', baseUrl: values['baseUrl'] || undefined }),
        });
        const data = await res.json();
        if (res.ok) {
          setSaveMsg({ ok: true, text: 'Token Kledo berhasil disimpan ke database!' });
          setValues({});
          apiFetch('/api/kledo/config').then(r => r.ok ? r.json() : null).then(d => d && setKledoConfig(d)).catch(() => {});
          handleTest();
        } else {
          setSaveMsg({ ok: false, text: data?.message ?? 'Gagal menyimpan' });
        }
      } else {
        /* placeholder untuk integrasi lain — bisa dikembangkan */
        await new Promise(r => setTimeout(r, 800));
        setSaveMsg({ ok: false, text: 'Integrasi ini belum tersedia. Segera hadir!' });
      }
    } catch (e: any) {
      setSaveMsg({ ok: false, text: e.message ?? 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!selected) return;
    setTesting(true);
    try {
      if (selected.id === 'kledo') {
        const res = await fetch('/api/kledo/status');
        const d = await res.json();
        setStatusMap(prev => ({ ...prev, kledo: d }));
      }
    } catch { /* ignore */ } finally {
      setTesting(false);
    }
  };

  if (!mounted || !authToken) return null;

  const kledoStatus = statusMap['kledo'];

  return (
    <OdooLayout title="API & Integrasi" subtitle="Hubungkan ERP dengan platform lain">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Grid kartu ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {INTEGRATIONS.map((intg) => {
            const st = statusMap[intg.id];
            const isKledo = intg.id === 'kledo';
            const isActive = selected?.id === intg.id;

            return (
              <button
                key={intg.id}
                onClick={() => isActive ? close() : openIntegration(intg)}
                className="text-left rounded-2xl p-5 transition-all"
                style={{
                  background: isActive ? intg.bg : '#fff',
                  border: `2px solid ${isActive ? intg.color : '#EDE9FE'}`,
                  boxShadow: isActive ? `0 0 0 3px ${intg.color}22` : 'none',
                }}
              >
                {/* Icon & status */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: intg.bg }}
                  >
                    {intg.emoji}
                  </div>
                  <div>
                    {isKledo && kledoStatus ? (
                      kledoStatus.connected
                        ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,.12)', color: '#16A34A' }}><CheckCircle className="h-2.5 w-2.5" />Aktif</span>
                        : <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,.1)', color: '#DC2626' }}><AlertCircle className="h-2.5 w-2.5" />Error</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Belum diatur</span>
                    )}
                  </div>
                </div>

                {/* Name & desc */}
                <p className="font-bold text-sm mb-1" style={{ color: '#1E1B4B' }}>{intg.name}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{intg.desc}</p>

                {/* Kledo token hint */}
                {isKledo && kledoConfig?.tokenSet && (
                  <p className="mt-2 text-[10px] font-mono truncate" style={{ color: intg.color }}>
                    {kledoConfig.tokenMasked}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: intg.color }}>
                  {isActive ? 'Tutup konfigurasi' : 'Konfigurasi'}
                  <ChevronRight className="h-3 w-3" style={{ transform: isActive ? 'rotate(90deg)' : undefined, transition: 'transform .2s' }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Panel konfigurasi (muncul di bawah grid saat kartu dipilih) ── */}
        {selected && (
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{ background: '#fff', border: `2px solid ${selected.color}33` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{selected.emoji}</div>
                <div>
                  <h3 className="font-bold" style={{ color: '#1E1B4B' }}>Konfigurasi {selected.name}</h3>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{selected.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.docsUrl && (
                  <a
                    href={selected.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: `${selected.color}12`, color: selected.color }}
                  >
                    {selected.docsLabel ?? 'Dokumentasi'} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={close}
                  className="p-1.5 rounded-xl hover:bg-gray-100"
                  style={{ color: '#9CA3AF' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Status khusus Kledo */}
            {selected.id === 'kledo' && kledoStatus && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                style={{
                  background: kledoStatus.connected ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.06)',
                  color: kledoStatus.connected ? '#16A34A' : '#DC2626',
                }}
              >
                {kledoStatus.connected
                  ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                {kledoStatus.message}
              </div>
            )}

            {/* Token aktif (Kledo) */}
            {selected.id === 'kledo' && kledoConfig?.tokenSet && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Token aktif:</span>
                <span className="flex-1 font-mono text-xs" style={{ color: '#1E1B4B' }}>{kledoConfig.tokenMasked}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,.1)', color: '#6366F1' }}>
                  {kledoConfig.source === 'env' ? 'dari .env' : 'dari database'}
                </span>
              </div>
            )}

            {/* Fields */}
            <div className="grid gap-4">
              {selected.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>{field.label}</label>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ border: `1.5px solid ${values[field.key] ? selected.color + '80' : '#E5E7EB'}`, background: '#FAFAFA' }}
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
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !Object.values(values).some(v => v.trim())}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  background: (!saving && Object.values(values).some(v => v.trim())) ? selected.color : '#E5E7EB',
                  color: (!saving && Object.values(values).some(v => v.trim())) ? '#fff' : '#9CA3AF',
                  cursor: (!saving && Object.values(values).some(v => v.trim())) ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>

              {selected.id === 'kledo' && (
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: `${selected.color}12`, color: selected.color, cursor: testing ? 'not-allowed' : 'pointer' }}
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Test Koneksi
                </button>
              )}
            </div>

            {/* Info tidak perlu .env */}
            <p className="text-[11px] rounded-xl px-4 py-2.5" style={{ background: 'rgba(99,102,241,.05)', color: '#6366F1' }}>
              💡 Token disimpan di database — tidak perlu edit <code className="font-mono bg-white rounded px-1">.env</code> di server CasaOS.
              Aktif langsung setelah disimpan.
            </p>
          </div>
        )}

      </div>
    </OdooLayout>
  );
}

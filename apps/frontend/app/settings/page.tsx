'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import {
  Save, RefreshCw, Building2, Globe, Mail, Hash,
  Percent, Smartphone, HardDrive, Link2, Check,
} from 'lucide-react';

const TABS = [
  { id: 'company',  label: 'Perusahaan',      icon: Building2 },
  { id: 'document', label: 'Nomor Dokumen',   icon: Hash },
  { id: 'tax',      label: 'Pajak',           icon: Percent },
  { id: 'currency', label: 'Mata Uang',       icon: Globe },
  { id: 'email',    label: 'Email Gateway',   icon: Mail },
  { id: 'wa',       label: 'WA Gateway',      icon: Smartphone },
  { id: 'backup',   label: 'Backup',          icon: HardDrive },
  { id: 'api',      label: 'API & Integrasi', icon: Link2 },
];

const COMPANY_FIELDS = [
  { key: 'company_name',      label: 'Nama Perusahaan',   type: 'text' },
  { key: 'company_address',   label: 'Alamat',            type: 'text' },
  { key: 'company_phone',     label: 'Telepon',           type: 'text' },
  { key: 'company_email',     label: 'Email Perusahaan',  type: 'email' },
  { key: 'company_npwp',      label: 'NPWP',              type: 'text' },
  { key: 'company_website',   label: 'Website',           type: 'text' },
  { key: 'company_logo',      label: 'URL Logo',          type: 'text' },
  { key: 'company_currency',  label: 'Mata Uang Default', type: 'text' },
  { key: 'fiscal_year_start', label: 'Awal Tahun Fiskal', type: 'text' },
];
const DOC_NUMBER_FIELDS = [
  { key: 'so_prefix',   label: 'Prefix Sales Order',    placeholder: 'SO' },
  { key: 'po_prefix',   label: 'Prefix Purchase Order', placeholder: 'PO' },
  { key: 'inv_prefix',  label: 'Prefix Invoice',        placeholder: 'INV' },
  { key: 'quo_prefix',  label: 'Prefix Quotation',      placeholder: 'QUO' },
  { key: 'rfq_prefix',  label: 'Prefix RFQ',            placeholder: 'RFQ' },
  { key: 'mo_prefix',   label: 'Prefix Manufaktur',     placeholder: 'MO' },
  { key: 'hr_prefix',   label: 'Prefix Penggajian',     placeholder: 'PAY' },
  { key: 'doc_padding', label: 'Jumlah Digit Nomor',    placeholder: '4' },
];
const TAX_FIELDS = [
  { key: 'ppn_rate',      label: 'Tarif PPN (%)',     placeholder: '11' },
  { key: 'pph21_method',  label: 'Metode PPh21',      placeholder: 'Gross Up / Netto' },
  { key: 'efaktur_user',  label: 'Username e-Faktur', placeholder: '' },
  { key: 'efaktur_pass',  label: 'Password e-Faktur', placeholder: '' },
  { key: 'npwp_company',  label: 'NPWP Perusahaan',   placeholder: '' },
];
const WA_FIELDS = [
  { key: 'fonnte_token',         label: 'Fonnte Token (WA)',       placeholder: '' },
  { key: 'wa_sender',            label: 'Nomor Pengirim WA',       placeholder: '628xxx' },
  { key: 'wa_template_invoice',  label: 'Template Invoice WA',     placeholder: 'Halo {name}...' },
  { key: 'wa_template_payment',  label: 'Template Pembayaran WA',  placeholder: 'Pembayaran {amount}...' },
];
const EMAIL_FIELDS = [
  { key: 'smtp_host',  label: 'SMTP Host',       placeholder: 'smtp.gmail.com' },
  { key: 'smtp_port',  label: 'SMTP Port',       placeholder: '587' },
  { key: 'smtp_user',  label: 'SMTP Username',   placeholder: 'email@domain.com' },
  { key: 'smtp_pass',  label: 'SMTP Password',   placeholder: '' },
  { key: 'smtp_from',  label: 'Email Pengirim',  placeholder: 'noreply@domain.com' },
  { key: 'email_name', label: 'Nama Pengirim',   placeholder: 'Gentong Mas ERP' },
];
const API_FIELDS = [
  { key: 'kledo_token',      label: 'Kledo Token',         placeholder: '' },
  { key: 'kledo_base_url',   label: 'Kledo Base URL',      placeholder: 'https://api.kledo.com' },
  { key: 'shopee_app_id',    label: 'Shopee App ID',       placeholder: '' },
  { key: 'shopee_secret',    label: 'Shopee Secret',       placeholder: '' },
  { key: 'tokopedia_client', label: 'Tokopedia Client ID', placeholder: '' },
  { key: 'tokopedia_secret', label: 'Tokopedia Secret',    placeholder: '' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
  transition: 'border-color .15s',
};

export default function SettingsPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState<'success' | 'error'>('success');
  const [tab, setTab]           = useState('company');

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/settings'); setSettings(r.data ?? {}); } catch {} finally { setLoading(false); }
  };
  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setMsg('Pengaturan berhasil disimpan!'); setMsgType('success');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Gagal menyimpan pengaturan.'); setMsgType('error'); }
    finally { setSaving(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);
  if (!token) return null;

  const renderFields = (fields: { key: string; label: string; placeholder?: string; type?: string }[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {fields.map(f => (
        <div key={f.key}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
          <input type={f.type ?? 'text'} style={inputStyle}
            value={settings[f.key] || ''}
            onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
            placeholder={f.placeholder ?? `Masukkan ${f.label.toLowerCase()}…`}
            onFocus={e => { e.target.style.borderColor = '#6366F1'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/settings">
      <div style={{ maxWidth: 800 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Pengaturan Sistem</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Konfigurasi perusahaan, integrasi, dan sistem ERP</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={save} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: msgType === 'success' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
            border: `1px solid ${msgType === 'success' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
            color: msgType === 'success' ? '#065F46' : '#991B1B' }}>
            <Check size={14} /> {msg}
          </div>
        )}

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                  background: active ? '#6366F1' : 'var(--surface-sunken)', color: active ? '#fff' : 'var(--text-secondary)',
                  border: active ? '1px solid #6366F1' : '1px solid var(--border)' }}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: 46, borderRadius: 8, background: 'var(--surface-sunken)', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : (
            <>
              {tab === 'company' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Informasi Perusahaan</span>
                  </div>
                  {renderFields(COMPANY_FIELDS)}
                </div>
              )}
              {tab === 'document' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Format Nomor Dokumen</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>Nomor dokumen otomatis menggunakan format: PREFIX-YYYY-NNNNN</p>
                  {renderFields(DOC_NUMBER_FIELDS)}
                </div>
              )}
              {tab === 'tax' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Percent size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Konfigurasi Pajak</span>
                  </div>
                  {renderFields(TAX_FIELDS)}
                </div>
              )}
              {tab === 'currency' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Pengaturan Mata Uang</span>
                  </div>
                  {renderFields([
                    { key: 'currency_base',        label: 'Mata Uang Dasar',  placeholder: 'IDR' },
                    { key: 'currency_usd_rate',     label: 'Kurs USD → IDR',   placeholder: '15000' },
                    { key: 'currency_sgd_rate',     label: 'Kurs SGD → IDR',   placeholder: '11000' },
                    { key: 'currency_eur_rate',     label: 'Kurs EUR → IDR',   placeholder: '16500' },
                    { key: 'currency_update_auto',  label: 'Auto Update Kurs', placeholder: 'yes/no' },
                  ])}
                </div>
              )}
              {tab === 'email' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Mail size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Konfigurasi Email Gateway</span>
                  </div>
                  {renderFields(EMAIL_FIELDS)}
                  <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.20)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', margin: '0 0 4px' }}>Catatan Konfigurasi SMTP</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Untuk Gmail: gunakan App Password, bukan password biasa. Aktifkan 2FA di akun Google Anda, lalu buat App Password di myaccount.google.com.</p>
                  </div>
                </div>
              )}
              {tab === 'wa' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Konfigurasi WhatsApp Gateway</span>
                  </div>
                  {renderFields(WA_FIELDS)}
                </div>
              )}
              {tab === 'backup' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <HardDrive size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Backup &amp; Restore</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="flex items-center justify-between" style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 3px' }}>Backup Database</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Download file backup database lengkap</p>
                      </div>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <HardDrive size={13} /> Download Backup
                      </button>
                    </div>
                    <div className="flex items-center justify-between" style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 3px' }}>Jadwal Backup Otomatis</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Backup otomatis setiap hari pukul 00:00</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: 'rgba(16,185,129,0.10)', color: '#065F46' }}>Aktif</span>
                    </div>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', margin: '0 0 4px' }}>Restore Database</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px' }}>Peringatan: Restore akan menggantikan semua data. Pastikan ada backup terbaru sebelum melanjutkan.</p>
                      <button style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.10)', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Upload File Restore
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'api' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 size={15} style={{ color: '#6366F1' }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>API &amp; Integrasi Third-party</span>
                  </div>
                  {renderFields(API_FIELDS)}
                  <div style={{ marginTop: 18 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>API Key Sistem</p>
                    <div className="flex items-center justify-between" style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>API Key</p>
                        <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', margin: 0 }}>gm_••••••••••••••••••••••••••••••••</p>
                      </div>
                      <button style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'rgba(99,102,241,0.10)', color: '#6366F1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

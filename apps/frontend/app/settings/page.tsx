'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import {
  Settings, Save, RefreshCw, Building2, Phone, Mail, Globe,
  FileText, Hash, Shield, Users, HardDrive, Link2, Activity,
  Percent, Smartphone, Database, Check,
} from 'lucide-react';

const TABS = [
  { id: 'company',  label: 'Perusahaan',    icon: Building2 },
  { id: 'document', label: 'Nomor Dokumen', icon: Hash },
  { id: 'tax',      label: 'Pajak',         icon: Percent },
  { id: 'currency', label: 'Mata Uang',     icon: Globe },
  { id: 'email',    label: 'Email Gateway', icon: Mail },
  { id: 'wa',       label: 'WA Gateway',    icon: Smartphone },
  { id: 'backup',   label: 'Backup',        icon: HardDrive },
  { id: 'api',      label: 'API & Integrasi', icon: Link2 },
];

const COMPANY_FIELDS = [
  { key: 'company_name',     label: 'Nama Perusahaan',   type: 'text' },
  { key: 'company_address',  label: 'Alamat',            type: 'text' },
  { key: 'company_phone',    label: 'Telepon',           type: 'text' },
  { key: 'company_email',    label: 'Email Perusahaan',  type: 'email' },
  { key: 'company_npwp',    label: 'NPWP',              type: 'text' },
  { key: 'company_website',  label: 'Website',           type: 'text' },
  { key: 'company_logo',     label: 'URL Logo',          type: 'text' },
  { key: 'company_currency', label: 'Mata Uang Default', type: 'text' },
  { key: 'fiscal_year_start', label: 'Awal Tahun Fiskal', type: 'text' },
];

const DOC_NUMBER_FIELDS = [
  { key: 'so_prefix',    label: 'Prefix Sales Order',    placeholder: 'SO' },
  { key: 'po_prefix',    label: 'Prefix Purchase Order', placeholder: 'PO' },
  { key: 'inv_prefix',   label: 'Prefix Invoice',        placeholder: 'INV' },
  { key: 'quo_prefix',   label: 'Prefix Quotation',      placeholder: 'QUO' },
  { key: 'rfq_prefix',   label: 'Prefix RFQ',            placeholder: 'RFQ' },
  { key: 'mo_prefix',    label: 'Prefix Manufacturing',  placeholder: 'MO' },
  { key: 'hr_prefix',    label: 'Prefix Payroll',        placeholder: 'PAY' },
  { key: 'doc_padding',  label: 'Jumlah Digit Nomor',    placeholder: '4' },
];

const TAX_FIELDS = [
  { key: 'ppn_rate',       label: 'Tarif PPN (%)',         placeholder: '11' },
  { key: 'pph21_method',  label: 'Metode PPh21',          placeholder: 'Gross Up / Netto' },
  { key: 'efaktur_user',  label: 'Username e-Faktur',     placeholder: '' },
  { key: 'efaktur_pass',  label: 'Password e-Faktur',     placeholder: '' },
  { key: 'npwp_company',  label: 'NPWP Perusahaan',       placeholder: '' },
];

const WA_FIELDS = [
  { key: 'fonnte_token',  label: 'Fonnte Token (WA)',       placeholder: '' },
  { key: 'wa_sender',     label: 'Nomor Pengirim WA',      placeholder: '628xxx' },
  { key: 'wa_template_invoice', label: 'Template Invoice WA', placeholder: 'Halo {name}...' },
  { key: 'wa_template_payment', label: 'Template Payment WA',  placeholder: 'Pembayaran {amount}...' },
];

const EMAIL_FIELDS = [
  { key: 'smtp_host',   label: 'SMTP Host',      placeholder: 'smtp.gmail.com' },
  { key: 'smtp_port',   label: 'SMTP Port',      placeholder: '587' },
  { key: 'smtp_user',   label: 'SMTP Username',  placeholder: 'email@domain.com' },
  { key: 'smtp_pass',   label: 'SMTP Password',  placeholder: '' },
  { key: 'smtp_from',   label: 'Email Pengirim', placeholder: 'noreply@domain.com' },
  { key: 'email_name',  label: 'Nama Pengirim',  placeholder: 'Gentong Mas ERP' },
];

const API_FIELDS = [
  { key: 'kledo_token',      label: 'Kledo Token',           placeholder: '' },
  { key: 'kledo_base_url',   label: 'Kledo Base URL',        placeholder: 'https://api.kledo.com' },
  { key: 'shopee_app_id',    label: 'Shopee App ID',         placeholder: '' },
  { key: 'shopee_secret',    label: 'Shopee Secret',         placeholder: '' },
  { key: 'tokopedia_client', label: 'Tokopedia Client ID',   placeholder: '' },
  { key: 'tokopedia_secret', label: 'Tokopedia Secret',      placeholder: '' },
];

const C = '#546E7A';

export default function SettingsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [tab, setTab] = useState('company');

  useEffect(() => { if (!token) router.push('/login'); }, [token]);

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
    <div className="grid grid-cols-1 gap-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
          <input
            type={f.type ?? 'text'}
            className="w-full rounded-lg px-4 py-2.5 text-sm transition"
            style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none', backgroundColor: '#FAFAFA' }}
            value={settings[f.key] || ''}
            onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
            placeholder={f.placeholder ?? `Masukkan ${f.label.toLowerCase()}...`}
            onFocus={(e) => { e.target.style.borderColor = C; e.target.style.backgroundColor = '#FFFFFF'; }}
            onBlur={(e) => { e.target.style.borderColor = '#EDE8F5'; e.target.style.backgroundColor = '#FAFAFA'; }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/settings">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pengaturan Sistem</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Konfigurasi perusahaan, integrasi, dan sistem ERP</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2.5 rounded-lg transition" style={{ border: '1px solid #EDE8F5', color: '#9CA3AF' }}>
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition" style={{ backgroundColor: C }}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            style={{
              backgroundColor: msgType === 'success' ? 'rgba(76,175,80,.1)' : 'rgba(234,84,85,.1)',
              border: `1px solid ${msgType === 'success' ? 'rgba(76,175,80,.3)' : 'rgba(234,84,85,.3)'}`,
              color: msgType === 'success' ? '#388E3C' : '#C62828',
            }}>
            <Check className="h-4 w-4" /> {msg}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition"
              style={{
                backgroundColor: tab === t.id ? C : '#FFFFFF',
                color: tab === t.id ? '#FFFFFF' : '#6B7280',
                border: `1.5px solid ${tab === t.id ? C : '#EDE8F5'}`,
              }}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: '#F5F3FF' }} />)}
            </div>
          ) : (
            <>
              {tab === 'company' && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Building2 className="h-4 w-4" style={{ color: C }} /> Informasi Perusahaan
                  </h3>
                  {renderFields(COMPANY_FIELDS)}
                </div>
              )}
              {tab === 'document' && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Hash className="h-4 w-4" style={{ color: C }} /> Format Nomor Dokumen
                  </h3>
                  <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Nomor dokumen otomatis akan menggunakan format: PREFIX-YYYY-NNNNN</p>
                  {renderFields(DOC_NUMBER_FIELDS)}
                </div>
              )}
              {tab === 'tax' && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Percent className="h-4 w-4" style={{ color: C }} /> Konfigurasi Pajak
                  </h3>
                  {renderFields(TAX_FIELDS)}
                </div>
              )}
              {tab === 'currency' && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Globe className="h-4 w-4" style={{ color: C }} /> Pengaturan Mata Uang
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: 'currency_base', label: 'Mata Uang Dasar', placeholder: 'IDR' },
                      { key: 'currency_usd_rate', label: 'Kurs USD → IDR', placeholder: '15000' },
                      { key: 'currency_sgd_rate', label: 'Kurs SGD → IDR', placeholder: '11000' },
                      { key: 'currency_eur_rate', label: 'Kurs EUR → IDR', placeholder: '16500' },
                      { key: 'currency_update_auto', label: 'Auto Update Kurs', placeholder: 'yes/no' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                        <input
                          className="w-full rounded-lg px-4 py-2.5 text-sm"
                          style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none', backgroundColor: '#FAFAFA' }}
                          value={settings[f.key] || ''}
                          onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          onFocus={(e) => { e.target.style.borderColor = C; }}
                          onBlur={(e) => { e.target.style.borderColor = '#EDE8F5'; }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === 'email' && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Mail className="h-4 w-4" style={{ color: C }} /> Konfigurasi Email Gateway
                  </h3>
                  {renderFields(EMAIL_FIELDS)}
                  <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(84,110,122,.08)', border: '1px solid rgba(84,110,122,.2)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: C }}>Catatan Konfigurasi SMTP</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Untuk Gmail: gunakan App Password, bukan password biasa. Aktifkan 2FA terlebih dahulu di akun Google Anda, lalu buat App Password di myaccount.google.com.</p>
                  </div>
                </div>
              )}
              {tab === 'wa' && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Smartphone className="h-4 w-4" style={{ color: C }} /> Konfigurasi WhatsApp Gateway
                  </h3>
                  {renderFields(WA_FIELDS)}
                </div>
              )}
              {tab === 'backup' && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <HardDrive className="h-4 w-4" style={{ color: C }} /> Backup & Restore
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'rgba(84,110,122,.06)', border: '1.5px solid #EDE8F5' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Backup Database</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Download file backup database lengkap</p>
                      </div>
                      <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                        <HardDrive className="h-4 w-4 inline mr-1.5" />Download Backup
                      </button>
                    </div>
                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'rgba(84,110,122,.06)', border: '1.5px solid #EDE8F5' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Jadwal Backup Otomatis</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Backup otomatis setiap hari pukul 00:00</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#388E3C' }}>Aktif</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(234,84,85,.06)', border: '1.5px solid rgba(234,84,85,.2)' }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: '#C62828' }}>Restore Database</p>
                      <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Peringatan: Restore akan menggantikan semua data yang ada. Pastikan Anda memiliki backup terbaru sebelum melanjutkan.</p>
                      <button className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#C62828', border: '1px solid rgba(234,84,85,.3)' }}>
                        Upload File Restore
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'api' && (
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                    <Link2 className="h-4 w-4" style={{ color: C }} /> API & Integrasi Third-party
                  </h3>
                  {renderFields(API_FIELDS)}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-3" style={{ color: '#1E1B4B' }}>API Key Sistem</h4>
                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#F5F3FF', border: '1.5px solid #EDE8F5' }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>API Key</p>
                        <p className="text-sm font-mono mt-1" style={{ color: '#1E1B4B' }}>gm_••••••••••••••••••••••••••••••••</p>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(84,110,122,.1)', color: C }}>
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

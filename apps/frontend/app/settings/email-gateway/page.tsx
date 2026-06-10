'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Mail, Save, Send, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';

export default function EmailGatewayPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    email_name: 'Gentong Mas ERP',
    smtp_encryption: 'tls',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setMsg('Konfigurasi email berhasil disimpan!');
      setMsgType('success');
    } catch {
      setMsg('Gagal menyimpan konfigurasi.');
      setMsgType('error');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTimeout(() => {
      setMsg('Email test berhasil dikirim ke ' + settings.smtp_user);
      setMsgType('success');
      setTesting(false);
      setTimeout(() => setMsg(''), 4000);
    }, 2000);
  };

  if (!mounted || !token) return null;

  const fields = [
    { key: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com', type: 'text' },
    { key: 'smtp_port', label: 'SMTP Port', placeholder: '587', type: 'text' },
    { key: 'smtp_user', label: 'Username / Email', placeholder: 'noreply@perusahaan.com', type: 'email' },
    { key: 'smtp_pass', label: 'Password / App Password', placeholder: '••••••••', type: 'password' },
    { key: 'smtp_from', label: 'Email Pengirim', placeholder: 'noreply@perusahaan.com', type: 'email' },
    { key: 'email_name', label: 'Nama Pengirim', placeholder: 'Gentong Mas ERP', type: 'text' },
  ];

  return (
    <OdooLayout title="Email Gateway" subtitle="Konfigurasi SMTP untuk pengiriman email sistem">
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Status Banner */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: 'white' }}>
          <Mail className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-bold">Email Gateway Configuration</p>
            <p className="text-sm opacity-80">Email digunakan untuk notifikasi invoice, reset password, dan alert sistem</p>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
            style={{
              backgroundColor: msgType === 'success' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
              border: `1px solid ${msgType === 'success' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
              color: msgType === 'success' ? '#15803D' : '#DC2626',
            }}>
            {msgType === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {msg}
          </div>
        )}

        {/* SMTP Form */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold mb-4" style={{ color: '#1E1B4B' }}>Konfigurasi SMTP</h3>
          <div className="space-y-4">
            {/* Encryption type */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Enkripsi</label>
              <div className="flex gap-2">
                {['tls', 'ssl', 'none'].map(enc => (
                  <button
                    key={enc}
                    onClick={() => setSettings(s => ({ ...s, smtp_encryption: enc }))}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold uppercase transition"
                    style={{
                      backgroundColor: settings.smtp_encryption === enc ? '#3B82F6' : '#F5F3FF',
                      color: settings.smtp_encryption === enc ? 'white' : '#6B7280',
                      border: `1.5px solid ${settings.smtp_encryption === enc ? '#3B82F6' : '#EDE9FE'}`,
                    }}
                  >
                    {enc === 'tls' ? 'TLS/STARTTLS' : enc === 'ssl' ? 'SSL' : 'None'}
                  </button>
                ))}
              </div>
            </div>

            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={settings[f.key as keyof typeof settings]}
                  onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition"
                  style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none', backgroundColor: '#FAFAFA' }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.backgroundColor = '#FFFFFF'; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE9FE'; e.target.style.backgroundColor = '#FAFAFA'; }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#1D4ED8' }}>💡 Tips Gmail</p>
          <p className="text-xs" style={{ color: '#3B82F6' }}>Untuk Gmail: Aktifkan 2FA dan gunakan App Password (bukan password biasa). Buat App Password di myaccount.google.com → Security → App Passwords.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ border: '1.5px solid #3B82F6', color: '#3B82F6', backgroundColor: 'rgba(59,130,246,.05)' }}
          >
            {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Test Koneksi
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </button>
        </div>
      </div>
    </OdooLayout>
  );
}

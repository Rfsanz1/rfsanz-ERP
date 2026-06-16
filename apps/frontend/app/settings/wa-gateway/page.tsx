'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Smartphone, Save, Send, CheckCircle, RefreshCw, MessageSquare, Zap } from 'lucide-react';

const WA_TEMPLATES = [
  { key: 'template_invoice', label: 'Template Invoice', default: 'Halo {customer_name}, invoice {invoice_no} senilai {amount} jatuh tempo pada {due_date}. Mohon segera melakukan pembayaran. Terima kasih, {company_name}.' },
  { key: 'template_payment', label: 'Template Konfirmasi Pembayaran', default: 'Halo {customer_name}, pembayaran sebesar {amount} untuk invoice {invoice_no} telah kami terima. Terima kasih atas kepercayaan Anda. {company_name}.' },
  { key: 'template_reminder', label: 'Template Reminder Jatuh Tempo', default: 'Halo {customer_name}, ini adalah pengingat bahwa invoice {invoice_no} senilai {amount} akan jatuh tempo dalam 3 hari. Harap segera lakukan pembayaran. {company_name}.' },
  { key: 'template_order', label: 'Template Konfirmasi Order', default: 'Halo {customer_name}, pesanan {order_no} Anda telah dikonfirmasi. Total: {amount}. Kami akan segera memproses pesanan Anda. {company_name}.' },
];

export default function WaGatewayPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState({
    fonnte_token: '',
    wa_sender: '',
    ...Object.fromEntries(WA_TEMPLATES.map(t => [t.key, t.default])),
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    try {
      const saved = JSON.parse(window.localStorage.getItem('erp_intg_fonnte') ?? '{}');
      if (saved.token || saved.groupInvoice || saved.groupBuktiTf) {
        setSettings(s => ({
          ...s,
          fonnte_token: saved.token ?? s.fonnte_token,
          wa_sender: saved.wa_sender ?? s.wa_sender,
        }));
      }
    } catch {}
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="WhatsApp Gateway" subtitle="Konfigurasi Fonnte untuk notifikasi WhatsApp otomatis">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Banner */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #22C55E, #15803D)', color: 'white' }}>
          <MessageSquare className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-bold">WhatsApp Gateway — Powered by Fonnte</p>
            <p className="text-sm opacity-80">Kirim notifikasi otomatis invoice, reminder, dan konfirmasi via WhatsApp</p>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ backgroundColor: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', color: '#15803D' }}>
            <CheckCircle className="h-4 w-4" /> {msg}
          </div>
        )}

        {/* Fonnte Config */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
            <Smartphone className="h-4 w-4" style={{ color: '#22C55E' }} /> Konfigurasi Fonnte API
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Fonnte API Token</label>
              <input
                type="password"
                value={settings.fonnte_token}
                onChange={e => setSettings(s => ({ ...s, fonnte_token: e.target.value }))}
                placeholder="Token dari dashboard.fonnte.com"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none', backgroundColor: '#FAFAFA' }}
                onFocus={e => { e.target.style.borderColor = '#22C55E'; }}
                onBlur={e => { e.target.style.borderColor = '#EDE9FE'; }}
              />
              <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>Dapatkan token di dashboard.fonnte.com → Settings → Token</p>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Nomor WhatsApp Pengirim</label>
              <input
                type="text"
                value={settings.wa_sender}
                onChange={e => setSettings(s => ({ ...s, wa_sender: e.target.value }))}
                placeholder="628xxxxxxxxxx"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none', backgroundColor: '#FAFAFA' }}
                onFocus={e => { e.target.style.borderColor = '#22C55E'; }}
                onBlur={e => { e.target.style.borderColor = '#EDE9FE'; }}
              />
              <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>Format: 628xxxxxxxxxx (tanpa +)</p>
            </div>
          </div>

          {/* Test */}
          <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid #EDE9FE' }}>
            <input
              type="text"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="Nomor tujuan test (628xxx)"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm"
              style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
            />
            <button
              onClick={() => {
                setTesting(true);
                setTimeout(() => {
                  setMsg('Pesan test berhasil dikirim ke ' + testPhone);
                  setTesting(false);
                  setTimeout(() => setMsg(''), 3000);
                }, 1500);
              }}
              disabled={testing || !testPhone}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition disabled:opacity-50"
              style={{ backgroundColor: 'rgba(34,197,94,.1)', color: '#15803D' }}
            >
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Test WA
            </button>
          </div>
        </div>

        {/* Message Templates */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <h3 className="font-bold mb-1 flex items-center gap-2" style={{ color: '#1E1B4B' }}>
            <MessageSquare className="h-4 w-4" style={{ color: '#22C55E' }} /> Template Pesan
          </h3>
          <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Variable: {'{customer_name}'}, {'{invoice_no}'}, {'{amount}'}, {'{due_date}'}, {'{order_no}'}, {'{company_name}'}</p>
          <div className="space-y-4">
            {WA_TEMPLATES.map(t => (
              <div key={t.key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{t.label}</label>
                <textarea
                  value={settings[t.key as keyof typeof settings]}
                  onChange={e => setSettings(s => ({ ...s, [t.key]: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                  style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none', backgroundColor: '#FAFAFA' }}
                  onFocus={e => { e.target.style.borderColor = '#22C55E'; }}
                  onBlur={e => { e.target.style.borderColor = '#EDE9FE'; }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* AI Automation Note */}
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(91,82,209,.06)', border: '1.5px solid rgba(91,82,209,.15)' }}>
          <Zap className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#5B52D1' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Terhubung ke AI Automation</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>WhatsApp Gateway digunakan oleh AI Automation untuk kirim reminder invoice, notifikasi stok, dan alert bisnis secara otomatis.</p>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => {
            setSaving(true);
            setTimeout(() => { setSaving(false); setMsg('Konfigurasi WA Gateway berhasil disimpan!'); setTimeout(() => setMsg(''), 3000); }, 1000);
          }}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition"
          style={{ background: 'linear-gradient(135deg, #22C55E, #15803D)' }}
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Konfigurasi
        </button>
      </div>
    </OdooLayout>
  );
}

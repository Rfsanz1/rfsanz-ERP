'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Save, Key, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, outline: 'none',
  border: '1px solid var(--border)', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function AccountingSettingsPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const COLOR     = ACCOUNTING_CONFIG.appColor;

  const [kledoToken, setKledoToken]   = useState('');
  const [showToken, setShowToken]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [testing, setTesting]         = useState(false);
  const [status, setStatus]           = useState<'idle'|'ok'|'error'>('idle');
  const [msg, setMsg]                 = useState('');

  useEffect(() => {
    axios.get('/api/local-settings?key=kledo_token')
      .then(r => { if (r.data?.data?.value) setKledoToken(r.data.data.value); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!kledoToken.trim()) { setMsg('Token tidak boleh kosong.'); setStatus('error'); return; }
    setSaving(true); setStatus('idle'); setMsg('');
    try {
      await axios.post('/api/local-settings', { key: 'kledo_token', value: kledoToken.trim() });
      setStatus('ok');
      setMsg('Token berhasil disimpan — Kledo sync akan bekerja mulai sekarang.');
    } catch (e: any) {
      setStatus('error');
      setMsg(e?.response?.data?.error ?? 'Gagal menyimpan token.');
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setStatus('idle'); setMsg('');
    try {
      const r = await axios.get('/api/kledo-test');
      const steps: { step: string; ok: boolean; detail: string }[] = r.data?.steps ?? [];
      const allOk = r.data?.ok === true;
      const details = steps.map(s => `${s.ok ? '✓' : '✗'} ${s.step}: ${s.detail}`).join('\n');
      setStatus(allOk ? 'ok' : 'error');
      setMsg(details || (allOk ? 'Semua langkah berhasil.' : 'Ada langkah yang gagal.'));
    } catch (e: any) {
      setStatus('error');
      setMsg(e?.response?.data?.error ?? e.message ?? 'Gagal menghubungi server.');
    } finally { setTesting(false); }
  };

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/accounting/settings">
      <div style={{ maxWidth: 640 }} className="space-y-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Pengaturan Akuntansi</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Konfigurasi modul akuntansi & integrasi Kledo</p>
        </div>

        {/* ── Kledo Token ── */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }} className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} style={{ color: COLOR }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Kledo API Token</h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Token ini diperlukan agar order penjualan dapat otomatis masuk ke Kledo.
            Dapatkan token dari <strong>Kledo → Pengaturan → API</strong>.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Personal Access Token
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showToken ? 'text' : 'password'}
                value={loading ? '••••••••' : kledoToken}
                disabled={loading}
                onChange={e => setKledoToken(e.target.value)}
                placeholder="kledo_pat_xxxxxxxxxxxxxxxxxx"
                style={{ ...inputStyle, paddingRight: 40 }}
                onFocus={e => { e.target.style.borderColor = COLOR; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
              />
              <button
                type="button"
                onClick={() => setShowToken(p => !p)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {status !== 'idle' && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 10,
              background: status === 'ok' ? 'var(--success-light,#f0fdf4)' : 'var(--danger-light,#fef2f2)',
              border: `1px solid ${status === 'ok' ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
              color: status === 'ok' ? 'var(--success,#16a34a)' : 'var(--danger,#dc2626)',
              fontSize: 12,
            }}>
              {status === 'ok' ? <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
              <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg}</pre>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: 'none', background: COLOR, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}
            >
              <Save size={13} /> {saving ? 'Menyimpan…' : 'Simpan Token'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: `1px solid ${COLOR}`, background: 'transparent', color: COLOR, fontSize: 13, fontWeight: 600, cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? .7 : 1 }}
            >
              {testing ? 'Mengecek…' : 'Test Koneksi'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

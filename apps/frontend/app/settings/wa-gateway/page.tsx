'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import {
  Smartphone, Save, Send, CheckCircle, RefreshCw,
  MessageSquare, Eye, EyeOff, AlertCircle, Users, CreditCard, User,
  ChevronDown, ChevronUp, RotateCcw,
} from 'lucide-react';
import {
  DEFAULT_TEMPLATE_ORDER, DEFAULT_TEMPLATE_PAYMENT, DEFAULT_TEMPLATE_KONSUMEN,
  applyTemplate,
} from '../../../lib/fonnte';

const STORAGE_KEY = 'erp_intg_fonnte';

const VARS_ORDER = ['{order_no}', '{customer_name}', '{phone}', '{sales}', '{items}', '{total}', '{payment_method}', '{status}', '{datetime}'];
const VARS_PAYMENT = ['{order_no}', '{customer_name}', '{phone}', '{total}', '{bank}', '{sales}', '{datetime}'];
const VARS_KONSUMEN = ['{customer_name}', '{item_name}', '{qty}', '{total}', '{status}', '{datetime}'];

const DEMO_VARS_ORDER: Record<string, string> = {
  order_no: 'SO-2025001',
  customer_name: 'Budi Santoso',
  phone: '08123456789',
  sales: 'Andi',
  items: '  • Galon Aqua ×2 = Rp 20.000\n  • Air Mineral ×10 = Rp 50.000',
  total: 'Rp 70.000',
  payment_method: 'Transfer',
  status: '🕐 Pending',
  datetime: new Date().toLocaleString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
};
const DEMO_VARS_PAYMENT: Record<string, string> = {
  order_no: 'SO-2025001',
  customer_name: 'Budi Santoso',
  phone: '08123456789',
  total: 'Rp 70.000',
  bank: 'BCA – 1234567890',
  sales: 'Andi',
  datetime: new Date().toLocaleString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
};
const DEMO_VARS_KONSUMEN: Record<string, string> = {
  customer_name: 'Budi Santoso',
  item_name: 'Galon Aqua',
  qty: '2',
  total: 'Rp 70.000',
  status: 'Pending',
  datetime: new Date().toLocaleString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
};

const GREEN = '#16A34A';
const BORDER = '#EDE9FE';

function VarBadges({ vars }: { vars: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {vars.map(v => (
        <code
          key={v}
          className="px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer select-all"
          style={{ backgroundColor: 'rgba(22,163,74,.1)', color: GREEN, border: '1px solid rgba(22,163,74,.2)' }}
        >
          {v}
        </code>
      ))}
    </div>
  );
}

function PreviewBox({ template, demoVars }: { template: string; demoVars: Record<string, string> }) {
  const rendered = applyTemplate(template, demoVars);
  return (
    <div className="rounded-xl p-3 mt-2" style={{ backgroundColor: '#F0FDF4', border: '1px solid rgba(22,163,74,.25)' }}>
      <p className="text-[10px] font-semibold mb-1.5" style={{ color: GREEN }}>👁 Preview (data dummy)</p>
      <pre className="text-xs whitespace-pre-wrap font-sans" style={{ color: '#1E1B4B' }}>{rendered}</pre>
    </div>
  );
}

interface SectionState {
  groupId: string;
  template: string;
  showPreview: boolean;
  testPhone: string;
  testStatus: 'idle' | 'sending' | 'ok' | 'error';
  testMsg: string;
}

export default function WaGatewayPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [fonnteToken, setFonnteToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [order, setOrder] = useState<SectionState>({
    groupId: '', template: DEFAULT_TEMPLATE_ORDER,
    showPreview: false, testPhone: '', testStatus: 'idle', testMsg: '',
  });
  const [payment, setPayment] = useState<SectionState>({
    groupId: '', template: DEFAULT_TEMPLATE_PAYMENT,
    showPreview: false, testPhone: '', testStatus: 'idle', testMsg: '',
  });
  const [konsumen, setKonsumen] = useState<SectionState>({
    groupId: '', template: DEFAULT_TEMPLATE_KONSUMEN,
    showPreview: false, testPhone: '', testStatus: 'idle', testMsg: '',
  });

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }

    const load = async () => {
      try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

        // Selalu coba ambil dari server DB/env — lebih andal dari localStorage
        let serverCfg: Record<string, string> = {};
        try {
          const r = await fetch('/api/direct/app-config');
          if (r.ok) serverCfg = await r.json();
        } catch {}

        // Prioritas: localStorage → server DB/env
        const resolvedToken = local.token || serverCfg.fonnte_token || '';
        const resolvedGroupInvoice = local.groupInvoice || serverCfg.fonnte_group_invoice || '';
        const resolvedGroupPayment = local.groupBuktiTf || serverCfg.fonnte_group_payment || '';

        setFonnteToken(resolvedToken);
        setOrder(s => ({
          ...s,
          groupId: resolvedGroupInvoice,
          template: local.templateOrder ?? DEFAULT_TEMPLATE_ORDER,
        }));
        setPayment(s => ({
          ...s,
          groupId: resolvedGroupPayment,
          template: local.templatePayment ?? DEFAULT_TEMPLATE_PAYMENT,
        }));
        setKonsumen(s => ({
          ...s,
          template: local.templateKonsumen ?? DEFAULT_TEMPLATE_KONSUMEN,
        }));
      } catch {}
      setMounted(true);
    };

    load();
  }, [token]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const cfg = {
        token: fonnteToken.trim(),
        groupInvoice: order.groupId.trim(),
        groupBuktiTf: payment.groupId.trim(),
        templateOrder: order.template,
        templatePayment: payment.template,
        templateKonsumen: konsumen.template,
      };

      // 1. Simpan ke localStorage (cepat, untuk browser ini)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));

      // 2. Simpan ke database server (persisten lintas browser & perangkat)
      const dbEntries: Array<[string, string]> = [
        ['fonnte_token',         cfg.token],
        ['fonnte_group_invoice', cfg.groupInvoice],
        ['fonnte_group_payment', cfg.groupBuktiTf],
        ['fonnte_template_order',    cfg.templateOrder],
        ['fonnte_template_payment',  cfg.templatePayment],
        ['fonnte_template_konsumen', cfg.templateKonsumen],
      ];
      await Promise.all(
        dbEntries.map(([key, value]) =>
          fetch('/api/local-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          }),
        ),
      );

      setSavedMsg('✅ Konfigurasi WA Gateway berhasil disimpan!');
      setTimeout(() => setSavedMsg(''), 4000);
    } catch { setSavedMsg('❌ Gagal menyimpan.'); }
    setSaving(false);
  }, [fonnteToken, order, payment, konsumen]);

  async function doTest(
    targetOverride: string | undefined,
    template: string,
    demoVars: Record<string, string>,
    setState: (fn: (s: SectionState) => SectionState) => void,
    groupId?: string,
  ) {
    const target = targetOverride?.trim() || groupId?.trim();
    if (!target) { setState(s => ({ ...s, testStatus: 'error', testMsg: 'Isi nomor tujuan atau Group ID.' })); return; }
    if (!fonnteToken.trim()) { setState(s => ({ ...s, testStatus: 'error', testMsg: 'Token Fonnte belum diisi.' })); return; }

    setState(s => ({ ...s, testStatus: 'sending', testMsg: '' }));
    try {
      const message = applyTemplate(template, demoVars);
      const res = await fetch('/api/direct/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fonnteToken.trim(), target, message }),
      });
      const data = await res.json();
      if (data.status === true || data.detail) {
        setState(s => ({ ...s, testStatus: 'ok', testMsg: 'Pesan berhasil dikirim!' }));
      } else {
        setState(s => ({ ...s, testStatus: 'error', testMsg: data.reason ?? data.message ?? 'Fonnte menolak pesan.' }));
      }
    } catch (e: any) {
      setState(s => ({ ...s, testStatus: 'error', testMsg: e.message ?? 'Gagal menghubungi server.' }));
    }
    setTimeout(() => setState(s => ({ ...s, testStatus: 'idle', testMsg: '' })), 5000);
  }

  if (!mounted || !token) return null;

  const inputSt: React.CSSProperties = {
    border: `1.5px solid ${BORDER}`, color: '#1E1B4B',
    outline: 'none', backgroundColor: '#FAFAFA',
  };

  function StatusBadge({ s }: { s: SectionState }) {
    if (s.testStatus === 'sending') return <span className="text-xs text-blue-500 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Mengirim...</span>;
    if (s.testStatus === 'ok') return <span className="text-xs flex items-center gap-1" style={{ color: GREEN }}><CheckCircle className="h-3 w-3" /> {s.testMsg}</span>;
    if (s.testStatus === 'error') return <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {s.testMsg}</span>;
    return null;
  }

  return (
    <OdooLayout title="WhatsApp Gateway" subtitle="Konfigurasi Fonnte untuk notifikasi WhatsApp otomatis">
      <div className="space-y-5 max-w-3xl mx-auto pb-10">

        {/* Header */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #22C55E, #15803D)', color: 'white' }}>
          <MessageSquare className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-bold">WhatsApp Gateway — Powered by Fonnte</p>
            <p className="text-sm opacity-80">3 jenis notifikasi: Grup Order · Grup Payment · Konsumen</p>
          </div>
        </div>

        {savedMsg && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            style={{ backgroundColor: savedMsg.startsWith('✅') ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', border: `1px solid ${savedMsg.startsWith('✅') ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`, color: savedMsg.startsWith('✅') ? '#15803D' : '#DC2626' }}>
            {savedMsg}
          </div>
        )}

        {/* ─── 1. Konfigurasi Token ─── */}
        <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${BORDER}` }}>
          <h3 className="font-bold flex items-center gap-2" style={{ color: '#1E1B4B' }}>
            <Smartphone className="h-4 w-4" style={{ color: GREEN }} /> Konfigurasi Fonnte API
          </h3>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Fonnte API Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={fonnteToken}
                onChange={e => setFonnteToken(e.target.value)}
                placeholder="Token dari dashboard.fonnte.com"
                className="w-full rounded-xl px-4 py-2.5 text-sm pr-10"
                style={inputSt}
                onFocus={e => (e.target.style.borderColor = GREEN)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                onClick={() => setShowToken(v => !v)}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
              Dapatkan di dashboard.fonnte.com → Perangkat → klik nomor WA → salin Token
            </p>
          </div>

          <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.2)' }}>
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: GREEN }} />
            <p className="text-xs" style={{ color: '#374151' }}>
              Token ini digunakan untuk semua jenis notifikasi di bawah. Pastikan nomor WA sudah terhubung di Fonnte.
            </p>
          </div>
        </div>

        {/* ─── 2. Grup Order ─── */}
        <NotifSection
          icon={<Users className="h-4 w-4" style={{ color: '#7C3AED' }} />}
          title="Grup Order"
          subtitle="Dikirim ke grup WA saat ada order baru masuk"
          accentColor="#7C3AED"
          groupIdLabel="Group ID Grup Order"
          groupIdPlaceholder="120363xxxxxxxxxx@g.us"
          groupIdHint="Cari ID grup di Fonnte: Perangkat → Grup → salin ID (format: 120363...@g.us)"
          state={order}
          setState={setOrder}
          vars={VARS_ORDER}
          demoVars={DEMO_VARS_ORDER}
          defaultTemplate={DEFAULT_TEMPLATE_ORDER}
          onTest={() => doTest(undefined, order.template, DEMO_VARS_ORDER, setOrder, order.groupId)}
          testLabel="Kirim ke Grup Order"
          showTestPhone={false}
          inputSt={inputSt}
        />

        {/* ─── 3. Grup Payment ─── */}
        <NotifSection
          icon={<CreditCard className="h-4 w-4" style={{ color: '#0891B2' }} />}
          title="Grup Payment"
          subtitle="Dikirim ke grup WA saat bukti transfer diterima"
          accentColor="#0891B2"
          groupIdLabel="Group ID Grup Payment"
          groupIdPlaceholder="120363xxxxxxxxxx@g.us"
          groupIdHint="Grup berbeda dari Grup Order. Bisa grup admin keuangan / kasir."
          state={payment}
          setState={setPayment}
          vars={VARS_PAYMENT}
          demoVars={DEMO_VARS_PAYMENT}
          defaultTemplate={DEFAULT_TEMPLATE_PAYMENT}
          onTest={() => doTest(undefined, payment.template, DEMO_VARS_PAYMENT, setPayment, payment.groupId)}
          testLabel="Kirim ke Grup Payment"
          showTestPhone={false}
          inputSt={inputSt}
        />

        {/* ─── 4. Notif Konsumen ─── */}
        <NotifSection
          icon={<User className="h-4 w-4" style={{ color: '#D97706' }} />}
          title="Notifikasi Konsumen"
          subtitle="Dikirim ke WhatsApp konsumen saat order berhasil dibuat"
          accentColor="#D97706"
          groupIdLabel=""
          groupIdPlaceholder=""
          groupIdHint=""
          state={konsumen}
          setState={setKonsumen}
          vars={VARS_KONSUMEN}
          demoVars={DEMO_VARS_KONSUMEN}
          defaultTemplate={DEFAULT_TEMPLATE_KONSUMEN}
          onTest={() => doTest(konsumen.testPhone, konsumen.template, DEMO_VARS_KONSUMEN, setKonsumen)}
          testLabel="Kirim ke Nomor Test"
          showTestPhone
          inputSt={inputSt}
        />

        {/* ─── Save ─── */}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition w-full justify-center"
          style={{ background: 'linear-gradient(135deg, #22C55E, #15803D)', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Semua Konfigurasi
        </button>

      </div>
    </OdooLayout>
  );
}

interface NotifSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor: string;
  groupIdLabel: string;
  groupIdPlaceholder: string;
  groupIdHint: string;
  state: SectionState;
  setState: React.Dispatch<React.SetStateAction<SectionState>>;
  vars: string[];
  demoVars: Record<string, string>;
  defaultTemplate: string;
  onTest: () => void;
  testLabel: string;
  showTestPhone: boolean;
  inputSt: React.CSSProperties;
}

function NotifSection({
  icon, title, subtitle, accentColor,
  groupIdLabel, groupIdPlaceholder, groupIdHint,
  state, setState, vars, demoVars, defaultTemplate,
  onTest, testLabel, showTestPhone, inputSt,
}: NotifSectionProps) {
  const bg = `${accentColor}11`;
  const border = `${accentColor}33`;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid #EDE9FE`, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: bg, borderBottom: `1px solid ${border}` }}>
        {icon}
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{title}</p>
          <p className="text-[11px]" style={{ color: '#6B7280' }}>{subtitle}</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          onClick={() => setState(s => ({ ...s, showPreview: !s.showPreview }))}
        >
          {state.showPreview ? <><ChevronUp className="h-3.5 w-3.5" /> Tutup Preview</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Group ID (jika ada) */}
        {groupIdLabel && (
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{groupIdLabel}</label>
            <input
              type="text"
              value={state.groupId}
              onChange={e => setState(s => ({ ...s, groupId: e.target.value }))}
              placeholder={groupIdPlaceholder}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-mono"
              style={inputSt}
              onFocus={e => (e.target.style.borderColor = accentColor)}
              onBlur={e => (e.target.style.borderColor = '#EDE9FE')}
            />
            {groupIdHint && <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>{groupIdHint}</p>}
          </div>
        )}

        {/* Template */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Template Pesan</label>
            <button
              className="text-[10px] flex items-center gap-1 opacity-60 hover:opacity-100 transition"
              style={{ color: accentColor }}
              onClick={() => setState(s => ({ ...s, template: defaultTemplate }))}
              title="Reset ke template default"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
          <p className="text-[10px] mb-2" style={{ color: '#9CA3AF' }}>Variabel yang tersedia:</p>
          <VarBadges vars={vars} />
          <textarea
            value={state.template}
            onChange={e => setState(s => ({ ...s, template: e.target.value }))}
            rows={7}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none font-mono mt-3"
            style={{ ...inputSt, lineHeight: 1.6 }}
            onFocus={e => (e.target.style.borderColor = accentColor)}
            onBlur={e => (e.target.style.borderColor = '#EDE9FE')}
          />
        </div>

        {/* Preview */}
        {state.showPreview && (
          <PreviewBox template={state.template} demoVars={demoVars} />
        )}

        {/* Test kirim */}
        <div className="pt-3 space-y-2" style={{ borderTop: '1px solid #EDE9FE' }}>
          <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Kirim Pesan Test (data dummy)</p>
          <div className="flex items-center gap-2">
            {showTestPhone && (
              <input
                type="text"
                value={state.testPhone}
                onChange={e => setState(s => ({ ...s, testPhone: e.target.value }))}
                placeholder="628xxxxxxxxxx"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm"
                style={inputSt}
                onFocus={e => (e.target.style.borderColor = accentColor)}
                onBlur={e => (e.target.style.borderColor = '#EDE9FE')}
              />
            )}
            {!showTestPhone && state.groupId && (
              <div className="flex-1 rounded-xl px-4 py-2.5 text-sm font-mono truncate" style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #EDE9FE', color: '#6B7280' }}>
                → {state.groupId}
              </div>
            )}
            {!showTestPhone && !state.groupId && (
              <div className="flex-1 text-xs italic" style={{ color: '#9CA3AF' }}>Isi Group ID dulu di atas</div>
            )}
            <button
              onClick={onTest}
              disabled={state.testStatus === 'sending' || (!showTestPhone && !state.groupId)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition disabled:opacity-40"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              {state.testStatus === 'sending'
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
              {testLabel}
            </button>
          </div>
          {(state.testStatus !== 'idle' || state.testMsg) && (
            <div className="flex items-center gap-1.5 text-xs">
              {state.testStatus === 'sending' && <><RefreshCw className="h-3 w-3 animate-spin text-blue-500" /><span className="text-blue-500">Mengirim...</span></>}
              {state.testStatus === 'ok' && <><CheckCircle className="h-3 w-3" style={{ color: '#16A34A' }} /><span style={{ color: '#16A34A' }}>{state.testMsg}</span></>}
              {state.testStatus === 'error' && <><AlertCircle className="h-3 w-3 text-red-500" /><span className="text-red-500">{state.testMsg}</span></>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

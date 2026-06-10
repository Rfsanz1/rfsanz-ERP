'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Bell, Zap, Plus, Trash2, CheckCircle, AlertTriangle, Info, Settings } from 'lucide-react';

const AI_NOTIFICATION_RULES = [
  { id: 1, name: 'Stok Kritis Alert', trigger: 'Stok produk di bawah minimum', channel: 'Email + WhatsApp', recipients: 'Manager Gudang, Owner', status: true },
  { id: 2, name: 'Invoice Jatuh Tempo', trigger: 'Invoice belum dibayar H-3', channel: 'WhatsApp', recipients: 'Tim Finance, Pelanggan', status: true },
  { id: 3, name: 'Revenue Harian Drop', trigger: 'Revenue harian turun >20%', channel: 'Email + In-App', recipients: 'Manager Sales, Owner', status: true },
  { id: 4, name: 'Approval PO Pending', trigger: 'PO belum diapprove >24 jam', channel: 'In-App + Email', recipients: 'Manager Pembelian', status: true },
  { id: 5, name: 'Error Sync Marketplace', trigger: '3 error sync berturut-turut', channel: 'In-App', recipients: 'Tim IT', status: false },
  { id: 6, name: 'Karyawan Kontrak Habis', trigger: '30 hari sebelum kontrak berakhir', channel: 'Email', recipients: 'HR Manager', status: true },
];

const RECENT_NOTIFICATIONS = [
  { msg: 'Stok Semen Portland kritis — 5 sak tersisa', time: '10 mnt lalu', type: 'danger', sent: 'WA + Email terkirim ke 2 penerima' },
  { msg: 'Invoice INV-2026-0841 jatuh tempo besok', time: '1 jam lalu', type: 'warning', sent: 'WA terkirim ke PT Sinar Jaya' },
  { msg: 'Revenue hari ini sudah 115% dari rata-rata', time: '3 jam lalu', type: 'info', sent: 'Email terkirim ke Owner' },
  { msg: 'PO-2026-0048 sudah diapprove oleh Manager', time: '4 jam lalu', type: 'success', sent: 'In-App notifikasi dikirim' },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  danger: { color: '#EF4444', bg: 'rgba(239,68,68,.08)', icon: AlertTriangle },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,.08)', icon: AlertTriangle },
  info: { color: '#3B82F6', bg: 'rgba(59,130,246,.08)', icon: Info },
  success: { color: '#22C55E', bg: 'rgba(34,197,94,.08)', icon: CheckCircle },
};

export default function AiNotificationsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [rules, setRules] = useState(AI_NOTIFICATION_RULES);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI Notification" subtitle="Notifikasi cerdas berbasis AI trigger dan kondisi bisnis">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Rule Aktif', value: rules.filter(r => r.status).length, color: '#22C55E' },
            { label: 'Terkirim Hari Ini', value: '24', color: '#3B82F6' },
            { label: 'Delivery Rate', value: '99.2%', color: '#5B52D1' },
            { label: 'Channel Aktif', value: '3', color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Rules */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <Zap className="h-4 w-4" style={{ color: '#5B52D1' }} /> Notification Rules
              </h3>
              <button className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
                <Plus className="h-3.5 w-3.5" /> Tambah Rule
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE9FE' }}>
              {rules.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: '#1E1B4B' }}>{r.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{r.trigger}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>{r.channel}</span>
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{r.recipients}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setRules(prev => prev.map(rule => rule.id === r.id ? { ...rule, status: !rule.status } : rule))}
                      className="w-10 h-5 rounded-full relative transition-colors"
                      style={{ backgroundColor: r.status ? '#5B52D1' : '#EDE9FE' }}
                    >
                      <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all shadow-sm" style={{ left: r.status ? '22px' : '2px' }} />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-lg transition">
                      <Settings className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <Bell className="h-4 w-4" style={{ color: '#5B52D1' }} /> Notifikasi Terkini
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {RECENT_NOTIFICATIONS.map((n, i) => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                    <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{n.msg}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{n.sent} · {n.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Zap, Plus, Play, Pause, Trash2, CheckCircle, AlertCircle, Clock, Settings, ChevronRight } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  module: string;
  status: 'active' | 'paused' | 'draft';
  runCount: number;
  lastRun: string;
}

const AUTOMATIONS: AutomationRule[] = [
  {
    id: 'AUTO-001', name: 'Reorder Otomatis - Stok Minimum',
    trigger: 'Stok produk mencapai minimum',
    condition: 'Qty on hand ≤ reorder point',
    action: 'Buat Purchase Request otomatis ke supplier',
    module: 'Inventory', status: 'active', runCount: 24, lastRun: '1 jam lalu',
  },
  {
    id: 'AUTO-002', name: 'Reminder Invoice Jatuh Tempo',
    trigger: 'Invoice jatuh tempo dalam 3 hari',
    condition: 'Invoice status = unpaid AND due_date ≤ today + 3',
    action: 'Kirim WhatsApp reminder ke pelanggan',
    module: 'Finance', status: 'active', runCount: 87, lastRun: '2 jam lalu',
  },
  {
    id: 'AUTO-003', name: 'Alert Penjualan Turun',
    trigger: 'Revenue harian turun >20% vs rata-rata',
    condition: 'Daily revenue < 7-day avg × 0.8',
    action: 'Kirim notifikasi ke Manager Sales & Owner',
    module: 'Sales', status: 'active', runCount: 5, lastRun: '3 hari lalu',
  },
  {
    id: 'AUTO-004', name: 'Follow-up CRM Otomatis',
    trigger: 'Customer tidak order >30 hari',
    condition: 'Last order date < today - 30 AND customer active',
    action: 'Buat activity follow-up di CRM untuk sales',
    module: 'CRM', status: 'active', runCount: 42, lastRun: '6 jam lalu',
  },
  {
    id: 'AUTO-005', name: 'Sync Marketplace Gagal',
    trigger: '3 kali error sync berturut-turut',
    condition: 'Sync error count ≥ 3 dalam 1 jam',
    action: 'Kirim alert ke tim IT + retry sync',
    module: 'Marketplace', status: 'active', runCount: 12, lastRun: '1 hari lalu',
  },
  {
    id: 'AUTO-006', name: 'Approval PO Eskalasi',
    trigger: 'PO tidak diapprove dalam 24 jam',
    condition: 'PO status = pending AND created_at < today - 1',
    action: 'Eskalasi notifikasi ke level approval berikutnya',
    module: 'Purchasing', status: 'paused', runCount: 8, lastRun: '5 hari lalu',
  },
  {
    id: 'AUTO-007', name: 'Auto-close Tiket Helpdesk',
    trigger: 'Tiket resolved tidak direspons >3 hari',
    condition: 'Ticket status = resolved AND last_update < today - 3',
    action: 'Auto-close tiket dan kirim survey kepuasan',
    module: 'Helpdesk', status: 'draft', runCount: 0, lastRun: '-',
  },
];

const MODULE_COLORS: Record<string, string> = {
  Inventory: '#14B8A6', Finance: '#3B82F6', Sales: '#22C55E',
  CRM: '#8B5CF6', Marketplace: '#F59E0B', Purchasing: '#F97316', Helpdesk: '#EC4899',
};

export default function AiAutomationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
  }, [token]);

  const toggleStatus = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? {
      ...a,
      status: a.status === 'active' ? 'paused' : 'active',
    } : a));
  };

  if (!mounted || !token) return null;

  const activeCount = automations.filter(a => a.status === 'active').length;
  const totalRuns = automations.reduce((s, a) => s + a.runCount, 0);

  return (
    <OdooLayout title="AI Automation" subtitle="Otomasi workflow berbasis kondisi dan trigger">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Automasi Aktif', value: activeCount, color: '#22C55E' },
            { label: 'Total Rule', value: automations.length, color: '#3B82F6' },
            { label: 'Total Eksekusi', value: totalRuns, color: '#5B52D1' },
            { label: 'Berhasil Rate', value: '98.2%', color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Automation Rules</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}
          >
            <Plus className="h-4 w-4" /> Buat Rule Baru
          </button>
        </div>

        {/* Automation List */}
        <div className="space-y-3">
          {automations.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl p-5"
              style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${a.status === 'active' ? '#EDE9FE' : '#F0F0F0'}`, opacity: a.status === 'draft' ? 0.7 : 1 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: (MODULE_COLORS[a.module] ?? '#5B52D1') + '15' }}>
                    <Zap className="h-4.5 w-4.5" style={{ color: MODULE_COLORS[a.module] ?? '#5B52D1' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{a.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: (MODULE_COLORS[a.module] ?? '#5B52D1') + '15', color: MODULE_COLORS[a.module] ?? '#5B52D1' }}>
                        {a.module}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{a.id} · {a.runCount} eksekusi · Terakhir: {a.lastRun}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1" style={{
                    backgroundColor: a.status === 'active' ? 'rgba(34,197,94,.1)' : a.status === 'paused' ? 'rgba(245,158,11,.1)' : 'rgba(107,114,128,.1)',
                    color: a.status === 'active' ? '#22C55E' : a.status === 'paused' ? '#F59E0B' : '#6B7280',
                  }}>
                    {a.status === 'active' ? <CheckCircle className="h-3 w-3" /> : a.status === 'paused' ? <Pause className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {a.status === 'active' ? 'Aktif' : a.status === 'paused' ? 'Dijeda' : 'Draft'}
                  </span>
                  <button onClick={() => toggleStatus(a.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition" title={a.status === 'active' ? 'Pause' : 'Aktifkan'}>
                    {a.status === 'active' ? <Pause className="h-4 w-4" style={{ color: '#F59E0B' }} /> : <Play className="h-4 w-4" style={{ color: '#22C55E' }} />}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                    <Settings className="h-4 w-4" style={{ color: '#9CA3AF' }} />
                  </button>
                </div>
              </div>

              {/* Rule Logic */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', color: '#1D4ED8' }}>
                  <AlertCircle className="h-3 w-3" /> <strong>TRIGGER:</strong> {a.trigger}
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono" style={{ backgroundColor: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', color: '#92400E' }}>
                  IF {a.condition}
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ backgroundColor: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', color: '#15803D' }}>
                  <Zap className="h-3 w-3" /> <strong>THEN:</strong> {a.action}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Rule Hint */}
        <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#F5F3FF', border: '1.5px dashed #EDE9FE' }}>
          <Zap className="h-8 w-8 mx-auto mb-3" style={{ color: '#5B52D1' }} />
          <p className="font-semibold text-sm mb-1" style={{ color: '#1E1B4B' }}>Buat Automation Rule Baru</p>
          <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Otomasi proses bisnis dengan mudah menggunakan antarmuka visual</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}
          >
            + Tambah Rule
          </button>
        </div>
      </div>
    </OdooLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { ScrollText, Search, Filter, Download, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

const AI_LOGS = [
  { id: 'AL-001', module: 'AI Chat', action: 'Query: "Berapa total penjualan bulan ini?"', user: 'Budi Santoso', status: 'success', duration: '0.8s', time: '14:32:15', date: '26 Mei 2026' },
  { id: 'AL-002', module: 'AI Automation', action: 'Rule AUTO-001 triggered: Reorder Semen Portland', user: 'System', status: 'success', duration: '1.2s', time: '14:15:00', date: '26 Mei 2026' },
  { id: 'AL-003', module: 'AI Forecast', action: 'Model retrained: Revenue forecast Jun 2026 updated', user: 'System', status: 'success', duration: '8.4s', time: '13:00:00', date: '26 Mei 2026' },
  { id: 'AL-004', module: 'AI Notification', action: 'WA Alert sent: Stock kritis Semen Portland', user: 'System', status: 'success', duration: '0.3s', time: '12:45:22', date: '26 Mei 2026' },
  { id: 'AL-005', module: 'AI Report', action: 'Report generated: Executive Summary Mei 2026', user: 'Siti Rahayu', status: 'success', duration: '42.1s', time: '11:30:08', date: '26 Mei 2026' },
  { id: 'AL-006', module: 'AI Marketplace', action: 'Price optimization suggestion: Tokopedia +3%', user: 'System', status: 'success', duration: '2.1s', time: '11:00:00', date: '26 Mei 2026' },
  { id: 'AL-007', module: 'AI Chat', action: 'Query: "Karyawan absen hari ini?"', user: 'HR Admin', status: 'success', duration: '0.9s', time: '09:15:33', date: '26 Mei 2026' },
  { id: 'AL-008', module: 'AI Inventory', action: 'Stockout prediction failed: API timeout', user: 'System', status: 'error', duration: '30.0s', time: '08:00:00', date: '26 Mei 2026' },
  { id: 'AL-009', module: 'AI Automation', action: 'Rule AUTO-004 triggered: CRM follow-up created', user: 'System', status: 'success', duration: '0.5s', time: '07:30:00', date: '26 Mei 2026' },
  { id: 'AL-010', module: 'AI Forecast', action: 'Daily demand forecast update completed', user: 'System', status: 'success', duration: '12.3s', time: '06:00:00', date: '26 Mei 2026' },
];

const MODULE_COLORS: Record<string, string> = {
  'AI Chat': '#5B52D1', 'AI Automation': '#22C55E', 'AI Forecast': '#3B82F6',
  'AI Notification': '#F59E0B', 'AI Report': '#8B5CF6', 'AI Marketplace': '#F97316',
  'AI Inventory': '#14B8A6', 'AI HR': '#6366F1',
};

export default function AiLogsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  const modules = ['all', ...Array.from(new Set(AI_LOGS.map(l => l.module)))];
  const filtered = AI_LOGS.filter(l => {
    const matchSearch = !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.module.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === 'all' || l.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const successCount = AI_LOGS.filter(l => l.status === 'success').length;
  const errorCount = AI_LOGS.filter(l => l.status === 'error').length;

  return (
    <OdooLayout title="AI Logs" subtitle="Riwayat semua aktivitas dan eksekusi AI">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Hari Ini', value: AI_LOGS.length, color: '#5B52D1' },
            { label: 'Berhasil', value: successCount, color: '#22C55E' },
            { label: 'Gagal', value: errorCount, color: '#EF4444' },
            { label: 'Avg. Duration', value: '8.4s', color: '#3B82F6' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari log..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {modules.map(m => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition"
                style={{
                  backgroundColor: moduleFilter === m ? '#5B52D1' : '#FFFFFF',
                  color: moduleFilter === m ? '#FFFFFF' : '#6B7280',
                  border: `1.5px solid ${moduleFilter === m ? '#5B52D1' : '#EDE9FE'}`,
                }}
              >
                {m === 'all' ? 'Semua' : m}
              </button>
            ))}
          </div>
          <button className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ border: '1.5px solid #EDE9FE', color: '#6B7280' }}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>

        {/* Logs Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5F3FF' }}>
                  {['ID', 'Modul', 'Aksi', 'User', 'Durasi', 'Status', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const color = MODULE_COLORS[l.module] ?? '#5B52D1';
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: '#9CA3AF' }}>{l.id}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: color + '15', color }}>
                          {l.module}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-64 truncate" style={{ color: '#1E1B4B' }}>{l.action}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{l.user}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: '#9CA3AF' }}>{l.duration}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: l.status === 'success' ? '#22C55E' : '#EF4444' }}>
                          {l.status === 'success' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {l.status === 'success' ? 'Berhasil' : 'Gagal'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs" style={{ color: '#1E1B4B' }}>{l.time}</p>
                        <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{l.date}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <ScrollText className="h-8 w-8 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Tidak ada log ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </OdooLayout>
  );
}

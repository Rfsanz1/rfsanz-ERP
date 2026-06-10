'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Activity, Search, Download, Filter, User, Clock, Shield } from 'lucide-react';

const AUDIT_LOGS = [
  { id: 'AUD-001', user: 'Budi Santoso', action: 'CREATE', module: 'Sales', record: 'SO-2026-1842', detail: 'Sales Order baru dibuat untuk PT Sinar Jaya', ip: '192.168.1.45', time: '14:32:15', date: '26 Mei 2026' },
  { id: 'AUD-002', user: 'Finance Team', action: 'UPDATE', module: 'Finance', record: 'INV-2026-0841', detail: 'Status invoice diubah menjadi Paid', ip: '192.168.1.32', time: '14:18:42', date: '26 Mei 2026' },
  { id: 'AUD-003', user: 'HR Admin', action: 'CREATE', module: 'HR', record: 'EMP-0248', detail: 'Karyawan baru Andi Wijaya ditambahkan', ip: '192.168.1.18', time: '13:55:00', date: '26 Mei 2026' },
  { id: 'AUD-004', user: 'Manager Pembelian', action: 'APPROVE', module: 'Purchasing', record: 'PO-2026-0048', detail: 'Purchase Order disetujui senilai Rp 45.000.000', ip: '192.168.1.22', time: '13:30:15', date: '26 Mei 2026' },
  { id: 'AUD-005', user: 'Siti Rahayu', action: 'DELETE', module: 'Inventory', record: 'TRANS-001', detail: 'Transfer stok draft dihapus', ip: '192.168.1.67', time: '12:45:00', date: '26 Mei 2026' },
  { id: 'AUD-006', user: 'Super Admin', action: 'UPDATE', module: 'Settings', record: 'SMTP Config', detail: 'Konfigurasi email gateway diperbarui', ip: '192.168.1.1', time: '11:00:00', date: '26 Mei 2026' },
  { id: 'AUD-007', user: 'Rudi Setiawan', action: 'LOGIN', module: 'System', record: 'Session', detail: 'Login berhasil dari browser Chrome', ip: '192.168.1.91', time: '09:00:00', date: '26 Mei 2026' },
  { id: 'AUD-008', user: 'Unknown', action: 'FAIL_LOGIN', module: 'System', record: 'Session', detail: '3 kali percobaan login gagal dari IP asing', ip: '45.123.45.67', time: '03:15:22', date: '26 Mei 2026' },
];

const ACTION_CONFIG: Record<string, { color: string; bg: string }> = {
  CREATE: { color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
  UPDATE: { color: '#3B82F6', bg: 'rgba(59,130,246,.1)' },
  DELETE: { color: '#EF4444', bg: 'rgba(239,68,68,.1)' },
  APPROVE: { color: '#8B5CF6', bg: 'rgba(139,92,246,.1)' },
  LOGIN: { color: '#14B8A6', bg: 'rgba(20,184,166,.1)' },
  FAIL_LOGIN: { color: '#F97316', bg: 'rgba(249,115,22,.1)' },
};

export default function AuditLogPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  const filtered = AUDIT_LOGS.filter(l => {
    const matchSearch = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.record.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <OdooLayout title="Audit Log" subtitle="Rekam jejak seluruh aktivitas dan perubahan sistem">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Aktivitas Hari Ini', value: AUDIT_LOGS.length, color: '#5B52D1' },
            { label: 'User Aktif', value: '12', color: '#22C55E' },
            { label: 'Perubahan Data', value: AUDIT_LOGS.filter(l => ['CREATE','UPDATE','DELETE'].includes(l.action)).length, color: '#3B82F6' },
            { label: 'Alert Keamanan', value: '1', color: '#EF4444' },
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
              placeholder="Cari user, record, atau detail..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{ border: '1.5px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'LOGIN', 'FAIL_LOGIN'].map(a => (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition"
                style={{
                  backgroundColor: actionFilter === a ? '#5B52D1' : '#FFFFFF',
                  color: actionFilter === a ? '#FFFFFF' : '#6B7280',
                  border: `1.5px solid ${actionFilter === a ? '#5B52D1' : '#EDE9FE'}`,
                }}
              >
                {a === 'all' ? 'Semua' : a}
              </button>
            ))}
          </div>
          <button className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold" style={{ border: '1.5px solid #EDE9FE', color: '#6B7280' }}>
            <Download className="h-3.5 w-3.5" /> Export Log
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5F3FF' }}>
                  {['ID', 'User', 'Aksi', 'Modul', 'Record', 'Detail', 'IP Address', 'Waktu'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const cfg = ACTION_CONFIG[l.action] ?? { color: '#6B7280', bg: 'rgba(107,114,128,.1)' };
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: '#9CA3AF' }}>{l.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
                            {l.user.charAt(0)}
                          </div>
                          <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{l.user}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {l.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{l.module}</td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: '#5B52D1' }}>{l.record}</td>
                      <td className="px-4 py-3 text-xs max-w-48 truncate" style={{ color: '#1E1B4B' }}>{l.detail}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: '#9CA3AF' }}>{l.ip}</td>
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
              <Activity className="h-8 w-8 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Tidak ada log ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </OdooLayout>
  );
}

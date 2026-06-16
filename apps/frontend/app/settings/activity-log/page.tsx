'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../../lib/nav-configs';
import { Activity, Search, Download, Filter } from 'lucide-react';

const C = '#546E7A';

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  CREATE:  { color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  UPDATE:  { color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  DELETE:  { color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
  LOGIN:   { color: '#9C27B0', bg: 'rgba(156,39,176,.1)' },
  LOGOUT:  { color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  APPROVE: { color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  EXPORT:  { color: '#00ACC1', bg: 'rgba(0,172,193,.1)' },
};

const SAMPLE_LOGS = [
  { id: 1, user: 'Admin Sistem', action: 'LOGIN', module: 'Auth', description: 'Login berhasil dari 192.168.1.100', timestamp: '2025-06-25 08:30:15', ip: '192.168.1.100' },
  { id: 2, user: 'Budi Santoso', action: 'CREATE', module: 'Penjualan', description: 'Membuat Sales Order SO-2025-0142 untuk PT. Maju Jaya', timestamp: '2025-06-25 09:15:22', ip: '192.168.1.105' },
  { id: 3, user: 'Siti Rahayu', action: 'APPROVE', module: 'Invoice', description: 'Menyetujui Invoice INV-2025-0089', timestamp: '2025-06-25 09:30:05', ip: '192.168.1.108' },
  { id: 4, user: 'Ahmad Fauzi', action: 'UPDATE', module: 'Inventory', description: 'Update stok produk "Bahan Baku PP" dari 200 → 350 kg', timestamp: '2025-06-25 10:00:45', ip: '192.168.1.110' },
  { id: 5, user: 'Admin Sistem', action: 'CREATE', module: 'Users', description: 'Menambahkan user baru: dewi@gentongmas.com', timestamp: '2025-06-25 10:30:00', ip: '192.168.1.100' },
  { id: 6, user: 'Budi Santoso', action: 'DELETE', module: 'CRM', description: 'Menghapus Lead yang sudah lama tidak aktif', timestamp: '2025-06-25 11:00:30', ip: '192.168.1.105' },
  { id: 7, user: 'Siti Rahayu', action: 'EXPORT', module: 'Akuntansi', description: 'Export Laporan Laba Rugi Juni 2025 ke Excel', timestamp: '2025-06-25 11:30:15', ip: '192.168.1.108' },
  { id: 8, user: 'Hendra W.', action: 'LOGIN', module: 'Auth', description: 'Login berhasil dari 192.168.1.115', timestamp: '2025-06-25 12:00:00', ip: '192.168.1.115' },
  { id: 9, user: 'Ahmad Fauzi', action: 'CREATE', module: 'Pembelian', description: 'Membuat Purchase Order PO-2025-0067', timestamp: '2025-06-25 13:00:15', ip: '192.168.1.110' },
  { id: 10, user: 'Admin Sistem', action: 'UPDATE', module: 'Pengaturan', description: 'Mengubah konfigurasi SMTP Email Gateway', timestamp: '2025-06-25 14:00:00', ip: '192.168.1.100' },
];

export default function ActivityLogPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');



  const modules = [...new Set(SAMPLE_LOGS.map(l => l.module))];
  const actions = Object.keys(ACTION_COLORS);

  const filtered = SAMPLE_LOGS.filter(l =>
    (l.user.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase())) &&
    (actionFilter === '' || l.action === actionFilter) &&
    (moduleFilter === '' || l.module === moduleFilter)
  );

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/settings/activity-log">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Activity Log</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Riwayat aktivitas semua pengguna sistem untuk audit trail</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>
            <Download className="h-4 w-4" /> Export Log
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {Object.entries(ACTION_COLORS).slice(0, 4).map(([action, style]) => {
            const count = SAMPLE_LOGS.filter(l => l.action === action).length;
            return (
              <div key={action} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: style.color, backgroundColor: style.bg }}>{action}</span>
                <p className="text-2xl font-bold mt-2" style={{ color: style.color }}>{count}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4 flex-wrap" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari user atau deskripsi..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">Semua Aksi</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
              <option value="">Semua Modul</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Waktu', 'User', 'Aksi', 'Modul', 'Deskripsi', 'IP Address'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const ac = ACTION_COLORS[log.action] ?? ACTION_COLORS.UPDATE;
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>{log.timestamp}</td>
                      <td className="px-6 py-3 font-medium text-xs" style={{ color: '#1E1B4B' }}>{log.user}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: ac.color, backgroundColor: ac.bg }}>{log.action}</span>
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: '#6B7280' }}>{log.module}</td>
                      <td className="px-6 py-3 text-xs max-w-xs truncate" style={{ color: '#1E1B4B' }}>{log.description}</td>
                      <td className="px-6 py-3 text-xs font-mono" style={{ color: '#9CA3AF' }}>{log.ip}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

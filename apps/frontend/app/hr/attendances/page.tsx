'use client';
import { useEffect, useState } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { Calendar, Plus, Search, RefreshCw } from 'lucide-react';

const P = '#7367F0';

export default function AttendancesPage() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/hr/attendances', { params: { search, page, limit: 20 } });
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, page]);

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#1E1B4B' }}>
              <Calendar className="h-6 w-6" style={{ color: P }} /> Absensi Karyawan
            </h1>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Rekap kehadiran karyawan</p>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: P }}
          >
            <Plus className="h-4 w-4" /> Tambah Absensi
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#B0AAB9' }} />
              <input
                className="w-full rounded-xl pl-9 pr-4 py-2 text-sm outline-none"
                style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', backgroundColor: '#FAFAFA' }}
                placeholder="Cari karyawan..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button onClick={load} className="p-2 rounded-xl transition hover:bg-gray-50" style={{ border: '1px solid #EDE8F5', color: '#A5A3AE' }}>
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Karyawan', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm" style={{ color: '#B0AAB9' }}>Memuat...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm" style={{ color: '#B0AAB9' }}>Belum ada data absensi</td></tr>
                ) : data.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition" style={{ borderBottom: '1px solid #F5F3FF' }}>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{a.employee?.name || a.employeeId || '-'}</td>
                    <td className="px-4 py-3" style={{ color: '#6B7280' }}>{a.date ? new Date(a.date).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="px-4 py-3 text-center" style={{ color: '#6B7280' }}>{a.checkIn || '-'}</td>
                    <td className="px-4 py-3 text-center" style={{ color: '#6B7280' }}>{a.checkOut || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: 'rgba(115,103,240,.1)', color: P }}>
                        {a.status || 'hadir'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-sm" style={{ borderTop: '1px solid #EDE8F5', color: '#9CA3AF' }}>
            <span>Total: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded-lg transition hover:bg-gray-50 disabled:opacity-40"
                style={{ border: '1px solid #EDE8F5' }}>←</button>
              <span className="px-3 py-1 font-semibold" style={{ color: '#1E1B4B' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={data.length < 20}
                className="px-3 py-1 rounded-lg transition hover:bg-gray-50 disabled:opacity-40"
                style={{ border: '1px solid #EDE8F5' }}>→</button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}

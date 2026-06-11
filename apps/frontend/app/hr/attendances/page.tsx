'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Calendar, Plus, Search, RefreshCw } from 'lucide-react';

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function AttendancesPage() {
  const { token }   = useAuthStore();
  const router      = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);


  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/hr/attendances', { params: { search, page, limit: 20 } });
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [search, page, token]);
  if (!token) return null;

  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/attendances">
      <div style={{ maxWidth: 1100 }} className="space-y-5">

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <Calendar size={18} style={{ color: '#6366F1' }} /> Absensi Karyawan
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Rekap kehadiran karyawan</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Absensi
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari karyawan…"
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <button onClick={load} style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Karyawan','Tanggal','Jam Masuk','Jam Keluar','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Memuat…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada data absensi</td></tr>
                ) : data.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.employee?.name || a.employeeId || '–'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{a.date ? new Date(a.date).toLocaleDateString('id-ID') : '–'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>{a.checkIn || '–'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>{a.checkOut || '–'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>{a.status || 'hadir'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between" style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
              <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={data.length < 20}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: data.length < 20 ? 0.4 : 1 }}>→</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

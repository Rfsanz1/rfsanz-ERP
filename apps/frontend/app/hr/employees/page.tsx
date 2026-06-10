'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Users, Plus, Search, RefreshCw, DollarSign, UserCheck } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aktif:    { label: 'Aktif',    color: '#10B981' },
  cuti:     { label: 'Cuti',    color: '#F59E0B' },
  nonaktif: { label: 'Nonaktif', color: '#94A3B8' },
};

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function EmployeesPage() {
  const { token }   = useAuthStore();
  const router      = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/hr/employees', { params: { search, page, limit: 20 } }),
        api.get('/hr/stats'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setStats(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [search, page, token]);
  if (!token) return null;

  const fmtRp = (v: number) =>
    Number(v || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/employees">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Data Karyawan</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manajemen informasi dan data karyawan</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Karyawan
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Total Karyawan', value: stats.total,    icon: Users,     accent: '#6366F1' },
              { label: 'Aktif',          value: stats.aktif,    icon: UserCheck, accent: '#10B981' },
              { label: 'Cuti',           value: stats.cuti,     icon: Users,     accent: '#F59E0B' },
              { label: 'Total Gaji',     value: fmtRp(stats.totalGaji), icon: DollarSign, accent: '#EF4444', small: true },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={card}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={16} style={{ color: s.accent }} />
                  </div>
                  <p style={{ fontSize: (s as any).small ? 14 : 22, fontWeight: 800, color: s.accent, margin: 0, lineHeight: 1.1 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '5px 0 0' }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari nama karyawan…"
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                  {['Nama','NIK','Jabatan','Departemen','Gaji Pokok','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada karyawan terdaftar</td></tr>
                ) : data.map(e => {
                  const st = STATUS_MAP[e.status?.toLowerCase()] ?? { label: e.status, color: '#94A3B8' };
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={el => { el.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={el => { el.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{e.name}</td>
                      <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{e.nik || '–'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{e.jabatan || '–'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{e.departemen || '–'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmtRp(e.gapok)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: st.color, background: st.color + '1A' }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total} karyawan</span>
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

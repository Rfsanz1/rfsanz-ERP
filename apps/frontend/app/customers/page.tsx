'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import { Users, Plus, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const SUB_NAV = [
  { label: 'Semua Pelanggan', href: '/customers' },
  { label: 'Poin Loyalitas',  href: '/customers/loyalty' },
  { label: 'Log WhatsApp',    href: '/customers/whatsapp-log' },
];

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function CustomersPage() {
  const { token } = useAuthStore();
  const [data, setData]       = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/customers', { params: { search, page, limit: 20 } }),
        api.get('/customers/summary'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setSummary(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [search, page, token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Data Pelanggan</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manajemen data pelanggan &amp; riwayat transaksi</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Pelanggan
          </button>
        </div>

        {/* Sub nav tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {SUB_NAV.map(n => (
            <Link key={n.href} href={n.href}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                background: n.href === '/customers' ? 'var(--surface)' : 'transparent',
                color: n.href === '/customers' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: n.href === '/customers' ? 'var(--shadow-xs)' : 'none',
              }}
            >{n.label}</Link>
          ))}
        </div>

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Pelanggan', value: summary.total,    accent: '#6366F1' },
              { label: 'Pelanggan Aktif', value: summary.active,   accent: '#10B981' },
              { label: 'Tidak Aktif',     value: summary.inactive, accent: '#94A3B8' },
            ].map(s => (
              <div key={s.label} style={card}>
                <p style={{ fontSize: 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value ?? 0}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '5px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nama pelanggan…" />
            </div>
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nama', 'Email', 'Telepon', 'Kota', 'Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</td></tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                      <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Belum ada pelanggan terdaftar</p>
                    </td>
                  </tr>
                ) : data.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div className="flex items-center gap-2.5">
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6366F11A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#6366F1', flexShrink: 0 }}>
                          {c.name?.charAt(0) ?? '?'}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.email || '–'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.phone || '–'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.city || '–'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: c.active ? '#10B981' : '#94A3B8', background: c.active ? 'rgba(16,185,129,0.10)' : 'rgba(148,163,184,0.12)' }}>
                        {c.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total} pelanggan</span>
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

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { BookOpen, Plus, Search, RefreshCw } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const TIPE_COLOR: Record<string, string> = {
  aset:       '#3B82F6', kewajiban: '#EF4444', ekuitas: '#8B5CF6',
  pendapatan: '#10B981', beban:     '#F59E0B',
};

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function COAPage() {
  const { token }   = useAuthStore();
  const router      = useRouter();
  const [data, setData]       = useState<any[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);


  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/finance/coa', { params: { search } });
      const raw = r.data;
      setData(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [search, token]);


  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/coa">
      <div style={{ maxWidth: 1100 }} className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <BookOpen size={18} style={{ color: '#6366F1' }} /> Chart of Accounts (CoA)
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Daftar akun keuangan perusahaan</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Akun
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {/* Toolbar */}
          <div className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari akun…"
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
                  {['Kode','Nama Akun','Tipe','Kategori','Saldo'].map(h => <th key={h} style={{ ...thStyle, textAlign: h === 'Saldo' ? 'right' : 'left' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Memuat…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada akun</td></tr>
                ) : data.map((a, i) => {
                  const color = TIPE_COLOR[a.tipe] ?? '#94A3B8';
                  return (
                    <tr key={a.id} style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 20px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>{a.kode}</td>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.nama}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color, background: color + '1A' }}>{a.tipe}</span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{a.kategori || '–'}</td>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>{fmt(Number(a.saldo || 0))}</td>
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

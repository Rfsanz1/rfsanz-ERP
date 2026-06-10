'use client';
import { useEffect, useState } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { DollarSign, Plus, Search, RefreshCw } from 'lucide-react';

const fmt = (v: any) => Number(v ?? 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};

export default function JournalEntriesPage() {
  const [data, setData]       = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/finance/journal-entries', { params: { search, page, limit: 20 } }),
        api.get('/finance/stats'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setStats(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, page]);

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/journal-entries">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <DollarSign size={20} style={{ color: '#6366F1' }} /> Jurnal Akuntansi
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola jurnal entri dan transaksi keuangan</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat Jurnal
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Jurnal', value: stats.totalJurnals,             accent: '#6366F1', large: true },
              { label: 'Saldo Bank',   value: fmt(stats.totalBankBalance??0), accent: '#3B82F6' },
              { label: 'Kas Masuk',   value: fmt(stats.cashIn??0),            accent: '#10B981' },
              { label: 'Kas Keluar',  value: fmt(stats.cashOut??0),           accent: '#EF4444' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
                <p style={{ fontSize: s.large ? 22 : 14, fontWeight: 800, color: s.accent, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nomor jurnal…"
                style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <button onClick={load} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['No Jurnal','Tanggal','Keterangan','Tipe','Total','Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada jurnal</td></tr>
                ) : data.map(j => (
                  <tr key={j.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#6366F1' }}>{j.noJurnal}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(j.tanggal).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: 13 }}>{j.keterangan || '–'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{j.type}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{fmt(j.total ?? 0)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                        color: j.status === 'posted' ? '#10B981' : '#94A3B8',
                        background: j.status === 'posted' ? 'rgba(16,185,129,.10)' : 'rgba(148,163,184,.10)' }}>
                        {j.status === 'posted' ? 'Diposting' : 'Draf'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page===1?0.4:1 }}>←</button>
              <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={data.length<20}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: data.length<20?0.4:1 }}>→</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';
import { useEffect, useState, useCallback } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Database, Search, RefreshCw, Download } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Aset', LIABILITY: 'Liabilitas', EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan', EXPENSE: 'Beban',
};

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function GeneralLedgerPage() {
  const [accounts, setAccounts]               = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo]     = useState(() => new Date().toISOString().split('T')[0]);
  const [ledger, setLedger]     = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [accsLoading, setAccsLoading] = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.get('/finance/accounts', { params: { isActive: 'true' } })
      .then(r => setAccounts(r.data))
      .finally(() => setAccsLoading(false));
  }, []);

  const loadLedger = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const r = await api.get(`/finance/ledger/${selectedAccount}`, { params: { dateFrom, dateTo } });
      setLedger(r.data);
    } catch { setLedger(null); } finally { setLoading(false); }
  }, [selectedAccount, dateFrom, dateTo]);

  useEffect(() => { if (selectedAccount) loadLedger(); }, [selectedAccount, dateFrom, dateTo]);

  const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });
  const fmtBalance = (n: number) => n === 0 ? '0' : (n > 0 ? '' : '-') + Math.abs(n).toLocaleString('id-ID');

  const filteredAccounts = accounts.filter(a =>
    !search || a.code.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    if (!ledger) return;
    const rows = [
      ['Tanggal', 'Nomor Jurnal', 'Deskripsi', 'Debit', 'Kredit', 'Saldo'],
      ['Saldo Awal', '', '', '', '', fmtBalance(ledger.openingBalance)],
      ...ledger.lines.map((l: any) => [
        new Date(l.date).toLocaleDateString('id-ID'),
        l.nomor, l.deskripsi || '', fmt(l.debit), fmt(l.kredit), fmtBalance(l.balance),
      ]),
      ['Saldo Akhir', '', '', fmt(ledger.totalDebit), fmt(ledger.totalKredit), fmtBalance(ledger.closingBalance)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `buku-besar-${ledger.account.code}-${dateFrom}-${dateTo}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const acc = accounts.find(a => a.id === selectedAccount);

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/accounting/general-ledger">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <Database size={20} style={{ color: '#6366F1' }} /> Buku Besar
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Lihat riwayat mutasi dan saldo per akun</p>
          </div>
          {ledger && (
            <button onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div style={{ gridColumn: '1 / span 2' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Pilih Akun</label>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari akun…"
                  style={{ ...inputStyle, paddingLeft: 34 }}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
              </div>
              <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} size={5}
                style={{ ...inputStyle, height: 'auto' }}>
                <option value="">— Pilih akun —</option>
                {filteredAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name} ({TYPE_LABELS[a.type] || a.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Dari Tanggal</label>
              <input type="date" style={inputStyle} value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Sampai Tanggal</label>
              <input type="date" style={inputStyle} value={dateTo} onChange={e => setDateTo(e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
          </div>
        </div>

        {/* Ledger */}
        {!selectedAccount ? (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '64px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <Database size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pilih akun untuk melihat buku besar</p>
          </div>
        ) : loading ? (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</div>
        ) : ledger ? (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {/* Account header */}
            <div className="flex items-center justify-between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{ledger.account.code} — {ledger.account.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{TYPE_LABELS[ledger.account.type]} · Saldo Normal: {acc?.normalBalance}</p>
              </div>
              <button onClick={loadLedger}
                style={{ padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Opening balance */}
            <div className="flex items-center justify-between" style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(59,130,246,0.04)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Saldo Awal ({dateFrom ? new Date(dateFrom + 'T00:00:00').toLocaleDateString('id-ID') : 'Awal'})</span>
              <span style={{ fontWeight: 700, color: '#3B82F6' }}>{fmtBalance(ledger.openingBalance)}</span>
            </div>

            {/* Transactions */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                    <th style={thStyle}>Tanggal</th>
                    <th style={thStyle}>Nomor Jurnal</th>
                    <th style={thStyle}>Deskripsi</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Debit</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Kredit</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.lines.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada transaksi dalam periode ini</td></tr>
                  ) : ledger.lines.map((l: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(l.date).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{l.nomor}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13 }}>{l.deskripsi || '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#3B82F6', fontSize: 13, fontWeight: l.debit > 0 ? 600 : 400 }}>{l.debit > 0 ? fmt(l.debit) : '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#8B5CF6', fontSize: 13, fontWeight: l.kredit > 0 ? 600 : 400 }}>{l.kredit > 0 ? fmt(l.kredit) : '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{fmtBalance(l.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-sunken)' }}>
                    <td colSpan={3} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Total Mutasi</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#3B82F6', fontWeight: 700 }}>{fmt(ledger.totalDebit)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#8B5CF6', fontWeight: 700 }}>{fmt(ledger.totalKredit)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10B981', fontWeight: 800, fontSize: 15 }}>{fmtBalance(ledger.closingBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

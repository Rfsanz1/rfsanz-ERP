'use client';
import { useEffect, useState, useCallback } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Scale, RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Aset', LIABILITY: 'Liabilitas', EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan', EXPENSE: 'Beban',
};
const TYPE_COLORS: Record<string, string> = {
  ASSET: '#3B82F6', LIABILITY: '#EF4444', EQUITY: '#8B5CF6',
  REVENUE: '#10B981', EXPENSE: '#F59E0B',
};

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};
const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)',
};

export default function TrialBalancePage() {
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo]     = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/finance/trial-balance', { params: { dateFrom, dateTo } });
      setData(r.data);
    } catch { } finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => n === 0 ? '—' : n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Kode', 'Nama Akun', 'Tipe', 'Total Debit', 'Total Kredit', 'Saldo Debit', 'Saldo Kredit'],
      ...filteredAccounts.map((a: any) => [a.code, a.name, TYPE_LABELS[a.type] || a.type,
        a.totalDebit, a.totalKredit, a.debitBalance, a.creditBalance]),
      ['', 'TOTAL', '', data.totals.totalDebit, data.totals.totalKredit, data.totals.totalDebitBalance, data.totals.totalCreditBalance],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `neraca-saldo-${dateFrom}-${dateTo}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const filteredAccounts = data?.accounts?.filter((a: any) => !typeFilter || a.type === typeFilter) ?? [];
  const isBalanced = data && Math.abs(data.totals.totalDebit - data.totals.totalKredit) < 1;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/accounting/trial-balance">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <Scale size={20} style={{ color: '#6366F1' }} /> Neraca Saldo
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Verifikasi keseimbangan debit dan kredit semua akun</p>
          </div>
          {data && (
            <button onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>

        {/* Filter */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-end gap-4 flex-wrap">
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
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Filter Tipe</label>
              <select style={inputStyle} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Semua Tipe</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Balance indicator */}
        {data && (
          <div className="flex items-center gap-2" style={{ padding: '10px 16px', borderRadius: 12, fontSize: 13,
            background: isBalanced ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isBalanced ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: isBalanced ? '#065F46' : '#991B1B' }}>
            {isBalanced ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {isBalanced
              ? `Neraca saldo seimbang — Total Debit = Total Kredit = ${data.totals.totalDebit.toLocaleString('id-ID')}`
              : `Neraca tidak seimbang — Selisih: ${Math.abs(data.totals.totalDebit - data.totals.totalKredit).toLocaleString('id-ID')}`
            }
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</div>
          ) : !data ? (
            <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Pilih periode untuk melihat neraca saldo</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                    <th style={thStyle}>Kode</th>
                    <th style={thStyle}>Nama Akun</th>
                    <th style={thStyle}>Tipe</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Total Debit</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Total Kredit</th>
                    <th style={{ ...thStyle, textAlign: 'right', color: '#3B82F6' }}>Saldo Debit</th>
                    <th style={{ ...thStyle, textAlign: 'right', color: '#8B5CF6' }}>Saldo Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada data untuk periode ini</td></tr>
                  ) : filteredAccounts.map((a: any) => {
                    const tc = TYPE_COLORS[a.type] ?? '#94A3B8';
                    return (
                      <tr key={a.accountId} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{a.code}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13 }}>{a.name}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: tc, background: tc + '1A' }}>{TYPE_LABELS[a.type] || a.type}</span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>{fmt(a.totalDebit)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>{fmt(a.totalKredit)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#3B82F6', fontSize: 13, fontWeight: a.debitBalance > 0 ? 600 : 400, background: 'rgba(59,130,246,0.03)' }}>{fmt(a.debitBalance)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#8B5CF6', fontSize: 13, fontWeight: a.creditBalance > 0 ? 600 : 400, background: 'rgba(139,92,246,0.03)' }}>{fmt(a.creditBalance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-sunken)' }}>
                    <td colSpan={3} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>TOTAL ({filteredAccounts.length} akun)</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{data.totals.totalDebit.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{data.totals.totalKredit.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#3B82F6', background: 'rgba(59,130,246,0.05)' }}>{data.totals.totalDebitBalance.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#8B5CF6', background: 'rgba(139,92,246,0.05)' }}>{data.totals.totalCreditBalance.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

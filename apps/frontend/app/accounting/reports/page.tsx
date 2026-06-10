'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, RefreshCw, CheckCircle } from 'lucide-react';

type Tab = 'balance-sheet' | 'income-statement' | 'cash-flow';

const TABS: { id: Tab; label: string }[] = [
  { id: 'balance-sheet',     label: 'Neraca' },
  { id: 'income-statement',  label: 'Laba & Rugi' },
  { id: 'cash-flow',         label: 'Arus Kas' },
];

function ReportRow({ label, amount, bold, indent, color, separator }: any) {
  if (separator) return (
    <tr>
      <td colSpan={2} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }} />
    </tr>
  );
  return (
    <tr>
      <td style={{ padding: '7px 24px', fontSize: 13, fontWeight: bold ? 700 : 400, color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', paddingLeft: indent ? 24 + indent * 16 : 24, borderTop: bold ? '1px solid var(--border)' : 'none' }}>
        {label}
      </td>
      <td style={{ padding: '7px 24px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', fontWeight: bold ? 700 : 400, color: color || (bold ? 'var(--text-primary)' : 'var(--text-secondary)'), borderTop: bold ? '1px solid var(--border)' : 'none' }}>
        {amount !== undefined ? amount.toLocaleString('id-ID', { minimumFractionDigits: 0 }) : ''}
      </td>
    </tr>
  );
}

function FinancialReportsPageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab]         = useState<Tab>((searchParams.get('tab') as Tab) || 'balance-sheet');
  const [date, setDate]       = useState(() => new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(0); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo]   = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setData(null);
    try {
      let r;
      if (tab === 'balance-sheet') r = await api.get('/finance/reports/balance-sheet', { params: { date } });
      else if (tab === 'income-statement') r = await api.get('/finance/reports/income-statement', { params: { dateFrom, dateTo } });
      else r = await api.get('/finance/reports/cash-flow', { params: { dateFrom, dateTo } });
      setData(r.data);
    } catch { } finally { setLoading(false); }
  }, [tab, date, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const renderBalanceSheet = () => !data ? null : (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <ReportRow label="ASET" bold />
        {data.assets.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
        <ReportRow label="Total Aset" amount={data.assets.total} bold color="#3B82F6" />
        <ReportRow separator />
        <ReportRow label="LIABILITAS" bold />
        {data.liabilities.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
        <ReportRow label="Total Liabilitas" amount={data.liabilities.total} bold color="#EF4444" />
        <ReportRow separator />
        <ReportRow label="EKUITAS" bold />
        {data.equity.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
        <ReportRow label="Total Ekuitas" amount={data.equity.total} bold color="#8B5CF6" />
        <ReportRow separator />
        <ReportRow label="Total Liabilitas + Ekuitas" amount={data.totalLiabilitiesAndEquity} bold color="#10B981" />
        {data.isBalanced && (
          <tr>
            <td colSpan={2} style={{ padding: '8px 24px' }}>
              <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: '#10B981' }}>
                <CheckCircle size={13} /> Neraca Seimbang
              </span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderIncomeStatement = () => !data ? null : (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <ReportRow label="PENDAPATAN" bold />
        {data.revenues.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} color="#10B981" />)}
        <ReportRow label="Total Pendapatan" amount={data.revenues.total} bold color="#10B981" />
        <ReportRow separator />
        <ReportRow label="HARGA POKOK PENJUALAN (HPP)" bold />
        {data.hpp.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
        <ReportRow label="Total HPP" amount={data.hpp.total} bold color="#F59E0B" />
        <ReportRow separator />
        <ReportRow label="LABA KOTOR" amount={data.grossProfit} bold color={data.grossProfit >= 0 ? '#10B981' : '#EF4444'} />
        <ReportRow separator />
        <ReportRow label="BEBAN OPERASIONAL" bold />
        {data.operationalExpenses.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
        <ReportRow label="Total Beban Operasional" amount={data.operationalExpenses.total} bold color="#F59E0B" />
        {data.otherExpenses?.items?.length > 0 && <>
          <ReportRow separator />
          <ReportRow label="BEBAN LAIN-LAIN" bold />
          {data.otherExpenses.items.map((a: any) => <ReportRow key={a.id} label={`${a.code} ${a.name}`} amount={a.balance} indent={1} />)}
          <ReportRow label="Total Beban Lain-lain" amount={data.otherExpenses.total} bold color="#F59E0B" />
        </>}
        <ReportRow separator />
        <ReportRow label="LABA / RUGI BERSIH" amount={data.netIncome} bold color={data.netIncome >= 0 ? '#10B981' : '#EF4444'} />
      </tbody>
    </table>
  );

  const renderCashFlow = () => {
    if (!data) return null;
    const { operating, investing, financing, netCashFlow } = data;
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <ReportRow label="AKTIVITAS OPERASI" bold />
          <ReportRow label="Laba Bersih" amount={operating.netIncome} indent={1} />
          <ReportRow label="Perubahan Piutang Dagang" amount={operating.adjustments.perubahanPiutang} indent={1} />
          <ReportRow label="Perubahan Persediaan" amount={operating.adjustments.perubahanPersediaan} indent={1} />
          <ReportRow label="Perubahan Hutang Dagang" amount={operating.adjustments.perubahanHutangDagang} indent={1} />
          <ReportRow label="Kas Bersih dari Aktivitas Operasi" amount={operating.total} bold color={operating.total >= 0 ? '#10B981' : '#EF4444'} />
          <ReportRow separator />
          <ReportRow label="AKTIVITAS INVESTASI" bold />
          <ReportRow label="Perubahan Aset Tetap" amount={investing.perubahanAsetTetap} indent={1} />
          <ReportRow label="Kas Bersih dari Aktivitas Investasi" amount={investing.total} bold color={investing.total >= 0 ? '#10B981' : '#EF4444'} />
          <ReportRow separator />
          <ReportRow label="AKTIVITAS PENDANAAN" bold />
          <ReportRow label="Perubahan Hutang Bank" amount={financing.perubahanHutangBank} indent={1} />
          <ReportRow label="Kas Bersih dari Aktivitas Pendanaan" amount={financing.total} bold color={financing.total >= 0 ? '#10B981' : '#EF4444'} />
          <ReportRow separator />
          <ReportRow label="KENAIKAN (PENURUNAN) BERSIH KAS" amount={netCashFlow} bold color={netCashFlow >= 0 ? '#10B981' : '#EF4444'} />
        </tbody>
      </table>
    );
  };

  const periodLabel = tab === 'balance-sheet'
    ? `Per ${new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'long' })}`
    : `Periode ${new Date(dateFrom + 'T00:00:00').toLocaleDateString('id-ID')} — ${new Date(dateTo + 'T00:00:00').toLocaleDateString('id-ID')}`;

  const inputStyle: React.CSSProperties = {
    padding: '8px 11px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none',
    fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)',
  };

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/accounting/reports">
      <div style={{ maxWidth: 960 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <TrendingUp size={20} style={{ color: '#6366F1' }} /> Laporan Keuangan
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Neraca, Laba Rugi, dan Arus Kas</p>
          </div>
          <button onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                background: tab === t.id ? '#6366F1' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text-muted)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Date filters */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-end gap-4 flex-wrap">
            {tab === 'balance-sheet' ? (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Per Tanggal</label>
                <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
              </div>
            ) : <>
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
            </>}
            <div className="flex gap-2">
              {[
                { label: 'Jan–Des', from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31` },
                { label: 'Q1',      from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-03-31` },
                { label: 'Q2',      from: `${new Date().getFullYear()}-04-01`, to: `${new Date().getFullYear()}-06-30` },
                { label: 'Bulan Ini', from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
              ].map(p => (
                <button key={p.label} onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {tab === 'balance-sheet' ? 'NERACA' : tab === 'income-statement' ? 'LAPORAN LABA & RUGI' : 'LAPORAN ARUS KAS'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>PT Gentong Mas · {periodLabel}</p>
          </div>
          {loading ? (
            <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat laporan…</div>
          ) : !data ? (
            <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Pilih periode untuk menampilkan laporan</div>
          ) : (
            <div style={{ paddingTop: 8, paddingBottom: 8 }}>
              {tab === 'balance-sheet'    && renderBalanceSheet()}
              {tab === 'income-statement' && renderIncomeStatement()}
              {tab === 'cash-flow'        && renderCashFlow()}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Memuat laporan…</div>}>
      <FinancialReportsPageContent />
    </Suspense>
  );
}

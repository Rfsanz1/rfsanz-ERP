'use client';
import { useState } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Scale, Check, AlertTriangle, Upload, RefreshCw, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const fmtRp = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const BANK_STMTS = [
  { id: 1, date: '2025-06-25', description: 'Transfer dari PT. Maju Jaya',          ref: 'TRF-001', amount: 15000000, type: 'credit', matched: true,  erp_ref: 'INV-0089' },
  { id: 2, date: '2025-06-25', description: 'Pembayaran ke PT. Supplier Utama',      ref: 'TRF-002', amount: 45000000, type: 'debit',  matched: true,  erp_ref: 'PO-0067' },
  { id: 3, date: '2025-06-24', description: 'Transfer Masuk Tidak Dikenal',           ref: 'TRF-003', amount: 2500000,  type: 'credit', matched: false, erp_ref: null },
  { id: 4, date: '2025-06-24', description: 'Biaya Administrasi Bank',               ref: 'TRF-004', amount: 25000,    type: 'debit',  matched: false, erp_ref: null },
  { id: 5, date: '2025-06-23', description: 'Transfer dari CV. Berkah Abadi',        ref: 'TRF-005', amount: 8500000,  type: 'credit', matched: true,  erp_ref: 'INV-0085' },
];

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 14,
  border: '1px solid var(--border)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)',
};

const thStyle: React.CSSProperties = {
  padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};

export default function BankReconciliationPage() {
  const [statements, setStatements] = useState(BANK_STMTS);
  const [period, setPeriod]           = useState('2025-06');
  const [bankAccount, setBankAccount] = useState('BCA - 1234567890');

  const matched   = statements.filter(s => s.matched).length;
  const unmatched = statements.filter(s => !s.matched).length;
  const totalIn   = statements.filter(s => s.type === 'credit').reduce((sum, s) => sum + s.amount, 0);
  const totalOut  = statements.filter(s => s.type === 'debit').reduce((sum, s) => sum + s.amount, 0);

  const matchItem = (id: number) => setStatements(st => st.map(s => s.id === id ? { ...s, matched: true, erp_ref: 'MANUAL' } : s));

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/bank-reconciliation">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Rekonsiliasi Bank</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Cocokkan transaksi bank dengan pencatatan di sistem ERP</p>
          </div>
          <div className="flex gap-2">
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Upload size={14} /> Import Statement
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Auto Match
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={card}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Rekening Bank</label>
              <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)' }} value={bankAccount} onChange={e => setBankAccount(e.target.value)}>
                <option>BCA - 1234567890</option>
                <option>Mandiri - 0987654321</option>
                <option>BRI - 5678901234</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Periode</label>
              <input type="month" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)' }} value={period} onChange={e => setPeriod(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Saldo Akhir Bank</label>
              <input type="number" placeholder="0" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Total Transaksi', value: String(statements.length), accent: '#6366F1' },
            { label: 'Sudah Cocok',     value: String(matched),           accent: '#10B981' },
            { label: 'Belum Cocok',     value: String(unmatched),         accent: '#EF4444' },
            { label: 'Net Saldo',       value: fmtRp(totalIn - totalOut), accent: totalIn >= totalOut ? '#10B981' : '#EF4444', small: true },
          ].map(s => (
            <div key={s.label} style={card}>
              <p style={{ fontSize: s.small ? 15 : 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Alert */}
        {unmatched > 0 && (
          <div className="flex items-center gap-3" style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>
              <strong>{unmatched} transaksi</strong> belum dicocokkan dengan data ERP. Periksa dan cocokkan secara manual.
            </p>
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Statement Bank — {bankAccount}</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Tanggal','Deskripsi','Ref. Bank','Tipe','Jumlah','Status','Ref. ERP','Aksi'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statements.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString('id-ID')}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.description}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.ref}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-1.5">
                        {s.type === 'credit'
                          ? <ArrowDownRight size={12} style={{ color: '#10B981' }} />
                          : <ArrowUpRight   size={12} style={{ color: '#EF4444' }} />}
                        <span style={{ fontSize: 10, fontWeight: 700, color: s.type === 'credit' ? '#10B981' : '#EF4444' }}>
                          {s.type === 'credit' ? 'Masuk' : 'Keluar'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: s.type === 'credit' ? '#10B981' : '#EF4444' }}>
                      {s.type === 'debit' ? '-' : '+'}{fmtRp(s.amount)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {s.matched ? (
                        <div className="flex items-center gap-1">
                          <Check size={12} style={{ color: '#10B981' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>Cocok</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} style={{ color: '#F59E0B' }} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>Belum</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#6366F1', fontFamily: 'monospace' }}>{s.erp_ref ?? '–'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {!s.matched && (
                        <button onClick={() => matchItem(s.id)}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(99,102,241,0.10)', color: '#6366F1', cursor: 'pointer' }}>
                          Cocokkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

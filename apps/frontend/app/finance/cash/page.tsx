'use client';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { ArrowUpRight, ArrowDownRight, Plus, Wallet } from 'lucide-react';

const TX = [
  { type: 'in',  ref: 'KAS-0124', desc: 'Penerimaan dari PT Maju Jaya',     amount: 12400000, date: '24 Mei 2026' },
  { type: 'out', ref: 'KAS-0123', desc: 'Pembayaran listrik & air',          amount: 1200000,  date: '24 Mei 2026' },
  { type: 'in',  ref: 'KAS-0122', desc: 'Penerimaan dari CV Berkah',         amount: 6750000,  date: '23 Mei 2026' },
  { type: 'out', ref: 'KAS-0121', desc: 'Pembelian ATK',                     amount: 340000,   date: '23 Mei 2026' },
  { type: 'out', ref: 'KAS-0120', desc: 'Transportasi pengiriman',           amount: 850000,   date: '22 Mei 2026' },
  { type: 'in',  ref: 'KAS-0119', desc: 'Pembayaran invoice INV-0234',       amount: 8200000,  date: '22 Mei 2026' },
];

const fmtRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function FinanceCashPage() {
  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/cash">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Kas &amp; Transaksi</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola kas masuk dan kas keluar harian</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Transaksi Baru
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div style={{ ...card, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={18} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Saldo Kas Saat Ini</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Rp 84.760.000</p>
          </div>
          <div style={card}>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowDownRight size={14} style={{ color: '#10B981' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Kas Masuk Bulan Ini</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#10B981', margin: 0, letterSpacing: '-0.02em' }}>Rp 27.350.000</p>
          </div>
          <div style={card}>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpRight size={14} style={{ color: '#EF4444' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Kas Keluar Bulan Ini</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#EF4444', margin: 0, letterSpacing: '-0.02em' }}>Rp 10.590.000</p>
          </div>
        </div>

        {/* Transaction table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Riwayat Transaksi</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Tipe</th>
                  <th style={thStyle}>Referensi</th>
                  <th style={thStyle}>Deskripsi</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Jumlah</th>
                  <th style={thStyle}>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {TX.map((t, i) => (
                  <tr key={t.ref} style={{ borderBottom: i < TX.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.type === 'in' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)' }}>
                        {t.type === 'in'
                          ? <ArrowDownRight size={14} style={{ color: '#10B981' }} />
                          : <ArrowUpRight   size={14} style={{ color: '#EF4444' }} />}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{t.ref}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{t.desc}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: t.type === 'in' ? '#10B981' : '#EF4444' }}>
                      {t.type === 'in' ? '+' : '-'}{fmtRp(t.amount)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{t.date}</td>
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

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { Landmark, RefreshCw } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function BankAccountsPage() {
  const { token }   = useAuthStore();
  const router      = useRouter();
  const [accounts, setAccounts]         = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const [a, t] = await Promise.all([
        api.get('/finance/bank-accounts'),
        api.get('/finance/bank-transactions', { params: { limit: 20 } }),
      ]);
      setAccounts(a.data ?? []);
      setTransactions(t.data.data ?? []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/bank-accounts">
      <div style={{ maxWidth: 1100 }} className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <Landmark size={18} style={{ color: '#6366F1' }} /> Bank &amp; Kas
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Rekening bank dan transaksi kas</p>
          </div>
          <button onClick={load} style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <RefreshCw size={13} />
          </button>
        </div>

        {loading ? (
          <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat…</p>
        ) : (
          <>
            {/* Account cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accounts.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada rekening bank</div>
              ) : accounts.map((a, i) => (
                <div key={i} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{a.bankName || 'Bank'}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>{a.accountName || a.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px', fontFamily: 'monospace' }}>{a.accountNumber || '–'}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#6366F1', margin: 0 }}>{fmt(Number(a.balance || 0))}</p>
                </div>
              ))}
            </div>

            {/* Transactions table */}
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Transaksi Bank Terbaru</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Tanggal','Keterangan','Jumlah','Tipe'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada transaksi</td></tr>
                    ) : transactions.map((t, i) => (
                      <tr key={i} style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>{t.date ? new Date(t.date).toLocaleDateString('id-ID') : '–'}</td>
                        <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-primary)' }}>{t.description || '–'}</td>
                        <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: t.type === 'credit' ? '#10B981' : '#EF4444', textAlign: 'right' }}>{fmt(Number(t.amount || 0))}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                            color: t.type === 'credit' ? '#10B981' : '#EF4444',
                            background: t.type === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                            {t.type === 'credit' ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

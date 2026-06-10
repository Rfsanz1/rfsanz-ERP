'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const fmt = (n: number) => n === 0 ? '-' : `Rp ${Math.abs(n).toLocaleString('id-ID')}`;
const fmtBal = (n: number) => `Rp ${n < 0 ? '-' : ''}${Math.abs(n).toLocaleString('id-ID')}`;

export default function BukuBesarPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  useEffect(() => {
    if (!token) return;
    api.get('/finance/accounts').then((res) => setAccounts(res.data?.data ?? res.data ?? [])).catch(() => {});
  }, [token]);

  const fetchData = async () => {
    if (!accountId) return alert('Pilih akun terlebih dahulu');
    setLoading(true);
    setPage(1);
    try {
      const res = await api.get('/reporting/buku-besar', { params: { accountId, from, to } });
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  if (!token) return null;

  const lines = data?.lines ?? [];
  const totalPages = Math.ceil(lines.length / PER_PAGE);
  const paginated = lines.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/laporan/buku-besar">
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Buku Besar</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>General Ledger per Akun</p>
        </div>

        <div className="flex gap-3 items-end flex-wrap bg-white p-4 rounded-xl" style={{ border: '1.5px solid #EDE8F5' }}>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Pilih Akun</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }}>
              <option value="">-- Pilih Akun --</option>
              {accounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Dari</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Sampai</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#7367F0' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Tampilkan
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
        ) : data ? (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE8F5', background: '#F8F7FF' }}>
              <div>
                <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{data.account?.code} — {data.account?.name}</span>
                <span className="ml-3 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE8F5', color: '#7367F0' }}>{data.account?.type}</span>
              </div>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Saldo Awal: {fmtBal(data.openingBalance ?? 0)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                    {['Tanggal', 'No. Jurnal', 'Keterangan', 'Debit', 'Kredit', 'Saldo'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F2FB' }}>
                      <td className="px-4 py-2.5 text-sm" style={{ color: '#374151' }}>{new Date(row.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-2.5 text-sm font-mono" style={{ color: '#7367F0' }}>{row.nomor}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: '#374151' }}>{row.deskripsi}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: '#388E3C' }}>{fmt(row.debit)}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: '#EA5455' }}>{fmt(row.kredit)}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-bold" style={{ color: row.balance < 0 ? '#EA5455' : '#1E1B4B' }}>{fmtBal(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F8F7FF', borderTop: '2px solid #EDE8F5' }}>
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold">Total / Saldo Akhir</td>
                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#388E3C' }}>{fmt(data.totalDebit ?? 0)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#EA5455' }}>{fmt(data.totalKredit ?? 0)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#7367F0' }}>{fmtBal(data.closingBalance ?? 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #EDE8F5' }}>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Hal {page} dari {totalPages} ({lines.length} transaksi)</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg" style={{ border: '1px solid #EDE8F5' }}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg" style={{ border: '1px solid #EDE8F5' }}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Pilih akun dan klik "Tampilkan"</div>
        )}
      </div>
    </AppShell>
  );
}

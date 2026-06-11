'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';

const fmt = (n: number) => n === 0 ? '-' : `Rp ${n.toLocaleString('id-ID')}`;

export default function TrialBalancePage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);


  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reporting/trial-balance', { params: { from, to } });
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const exportReport = async () => {
    try {
      const res = await api.get('/reporting/export', { params: { report: 'trial-balance', format: 'excel', from, to }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `trial-balance_${from}_${to}.xlsx`; a.click();
    } catch { alert('Export gagal'); }
  };

  if (!token) return null;

  const isBalanced = data ? Math.abs((data.totals?.totalDebit ?? 0) - (data.totals?.totalKredit ?? 0)) < 1 : null;
  const rows = data?.accounts ?? [];

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/laporan/trial-balance">
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Neraca Saldo (Trial Balance)</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Semua akun aktif — {from} s/d {to}</p>
          </div>
          <button onClick={exportReport} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5', color: '#388E3C' }}>
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>

        <div className="flex gap-3 items-end flex-wrap">
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
          {isBalanced !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold" style={{
              background: isBalanced ? 'rgba(76,175,80,.1)' : 'rgba(234,84,85,.1)',
              color: isBalanced ? '#4CAF50' : '#EA5455',
              border: `1px solid ${isBalanced ? '#4CAF50' : '#EA5455'}40`,
            }}>
              {isBalanced ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {isBalanced ? 'Balanced ✓' : 'Unbalanced ✗'}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
        ) : data ? (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5', background: '#F8F7FF' }}>
                    {['Kode', 'Nama Akun', 'Tipe', 'Total Debit', 'Total Kredit'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F2FB' }}>
                      <td className="px-4 py-2.5 text-sm font-mono font-medium" style={{ color: '#7367F0' }}>{row.code}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: '#374151' }}>{row.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE8F5', color: '#7367F0' }}>{row.type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: '#388E3C' }}>{fmt(row.totalDebit)}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: '#EA5455' }}>{fmt(row.totalKredit)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: isBalanced ? 'rgba(76,175,80,.06)' : 'rgba(234,84,85,.06)', borderTop: '2px solid #EDE8F5' }}>
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold">TOTAL</td>
                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#388E3C' }}>Rp {(data.totals?.totalDebit ?? 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: '#EA5455' }}>Rp {(data.totals?.totalKredit ?? 0).toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Klik "Tampilkan" untuk memuat neraca saldo</div>
        )}
      </div>
    </AppShell>
  );
}

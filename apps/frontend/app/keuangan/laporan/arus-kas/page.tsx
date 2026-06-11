'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { Download, RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const fmt = (n: number) => `Rp ${n < 0 ? '-' : ''}${Math.abs(n).toLocaleString('id-ID')}`;

export default function ArusKasPage() {
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
      const res = await api.get('/reporting/arus-kas', { params: { from, to } });
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const res = await api.get('/reporting/export', { params: { report: 'cash-flow', format, from, to }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `arus-kas_${from}_${to}.${format === 'pdf' ? 'pdf' : 'xlsx'}`; a.click();
    } catch { alert('Export gagal'); }
  };

  if (!token) return null;

  const operasional = data?.operasional ?? 0;
  const investasi = data?.investasi ?? 0;
  const pendanaan = data?.pendanaan ?? 0;
  const saldoAwal = data?.openingBalance ?? 0;
  const saldoAkhir = data?.closingBalance ?? (saldoAwal + operasional + investasi + pendanaan);
  const netCashFlow = operasional + investasi + pendanaan;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/laporan/arus-kas">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Arus Kas</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Cash Flow Statement — {from} s/d {to}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportReport('excel')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5', color: '#388E3C' }}>
              <Download className="h-4 w-4" /> Excel
            </button>
            <button onClick={() => exportReport('pdf')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5', color: '#EA5455' }}>
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
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
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Operasional', value: operasional, icon: Activity, color: operasional >= 0 ? '#4CAF50' : '#EA5455' },
                { label: 'Investasi', value: investasi, icon: TrendingUp, color: investasi >= 0 ? '#2196F3' : '#FF9800' },
                { label: 'Pendanaan', value: pendanaan, icon: TrendingDown, color: pendanaan >= 0 ? '#7367F0' : '#EA5455' },
                { label: 'Net Cash Flow', value: netCashFlow, icon: Activity, color: netCashFlow >= 0 ? '#4CAF50' : '#EA5455' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #EDE8F5' }}>
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  <p className="text-base font-bold mt-1" style={{ color: s.color }}>{fmt(s.value)}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
              {[
                { title: 'AKTIVITAS OPERASIONAL', amount: operasional, detail: data.operasionalDetail ?? [] },
                { title: 'AKTIVITAS INVESTASI', amount: investasi, detail: data.investasiDetail ?? [] },
                { title: 'AKTIVITAS PENDANAAN', amount: pendanaan, detail: data.pendanaanDetail ?? [] },
              ].map((section) => (
                <div key={section.title}>
                  <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#F8F7FF', borderBottom: '1px solid #EDE8F5' }}>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>{section.title}</span>
                    <span className="text-sm font-bold" style={{ color: section.amount >= 0 ? '#4CAF50' : '#EA5455' }}>{fmt(section.amount)}</span>
                  </div>
                  {(section.detail).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: '1px solid #F5F2FB' }}>
                      <span className="text-sm" style={{ color: '#374151' }}>{item.description ?? item.keterangan ?? '-'}</span>
                      <span className="text-sm font-medium" style={{ color: Number(item.amount ?? 0) < 0 ? '#EA5455' : '#374151' }}>{fmt(Number(item.amount ?? 0))}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="px-5 py-4 flex flex-col gap-1" style={{ background: '#F8F7FF', borderTop: '2px solid #EDE8F5' }}>
                <div className="flex justify-between text-sm"><span style={{ color: '#6B7280' }}>Saldo Awal</span><span className="font-medium">{fmt(saldoAwal)}</span></div>
                <div className="flex justify-between text-sm"><span style={{ color: '#6B7280' }}>+ Net Cash Flow</span><span className="font-medium" style={{ color: netCashFlow >= 0 ? '#4CAF50' : '#EA5455' }}>{fmt(netCashFlow)}</span></div>
                <div className="flex justify-between text-base font-bold mt-1 pt-1" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <span style={{ color: '#1E1B4B' }}>Saldo Akhir</span>
                  <span style={{ color: saldoAkhir >= 0 ? '#4CAF50' : '#EA5455' }}>{fmt(saldoAkhir)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Klik "Tampilkan" untuk memuat laporan</div>
        )}
      </div>
    </AppShell>
  );
}

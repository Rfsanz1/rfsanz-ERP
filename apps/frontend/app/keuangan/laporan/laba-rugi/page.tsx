'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { TrendingUp, TrendingDown, DollarSign, Download, RefreshCw } from 'lucide-react';

const fmt = (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID')}`;

export default function LabaRugiPage() {
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
      const res = await api.get('/reporting/laba-rugi', { params: { from, to } });
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const res = await api.get('/reporting/export', { params: { report: 'income-statement', format, from, to }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `laba-rugi_${from}_${to}.${format === 'pdf' ? 'pdf' : 'xlsx'}`; a.click();
    } catch { alert('Export gagal'); }
  };



  const rev = data?.revenues?.total ?? 0;
  const hpp = data?.hpp?.total ?? 0;
  const gross = data?.grossProfit ?? 0;
  const opex = data?.operationalExpenses?.total ?? 0;
  const net = data?.netIncome ?? 0;

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/laporan/laba-rugi">
      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Laporan Laba Rugi</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Income Statement — Periode {from} s/d {to}</p>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pendapatan', value: rev, color: '#4CAF50', icon: TrendingUp },
            { label: 'HPP', value: hpp, color: '#FF9800', icon: TrendingDown },
            { label: 'Laba Kotor', value: gross, color: gross >= 0 ? '#2196F3' : '#EA5455', icon: DollarSign },
            { label: 'Laba Bersih', value: net, color: net >= 0 ? '#7367F0' : '#EA5455', icon: DollarSign },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #EDE8F5' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{loading ? '…' : fmt(s.value)}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
        ) : data ? (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
            {[
              { title: 'PENDAPATAN', items: data.revenues?.items ?? [], total: rev, color: '#4CAF50' },
              { title: 'HARGA POKOK PENJUALAN (HPP)', items: data.hpp?.items ?? [], total: hpp, color: '#FF9800' },
              { title: 'BEBAN OPERASIONAL', items: data.operationalExpenses?.items ?? [], total: opex, color: '#EA5455' },
            ].map((section) => (
              <div key={section.title}>
                <div className="px-5 py-2.5" style={{ background: '#F8F7FF', borderBottom: '1px solid #EDE8F5' }}>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>{section.title}</span>
                </div>
                {section.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: '1px solid #F5F2FB' }}>
                    <span className="text-sm" style={{ color: '#374151' }}>{item.code} — {item.name}</span>
                    <span className="text-sm font-medium" style={{ color: item.balance < 0 ? '#EA5455' : '#374151' }}>{fmt(item.balance)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '2px solid #EDE8F5', background: '#FAFAFA' }}>
                  <span className="text-sm font-bold">Total {section.title.split(' ')[0]}</span>
                  <span className="text-sm font-bold" style={{ color: section.color }}>{fmt(section.total)}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-4" style={{ background: net >= 0 ? 'rgba(76,175,80,.06)' : 'rgba(234,84,85,.06)' }}>
              <span className="text-base font-bold" style={{ color: '#1E1B4B' }}>LABA BERSIH</span>
              <span className="text-base font-bold" style={{ color: net >= 0 ? '#4CAF50' : '#EA5455' }}>{fmt(net)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Klik "Tampilkan" untuk memuat laporan</div>
        )}
      </div>
    </AppShell>
  );
}

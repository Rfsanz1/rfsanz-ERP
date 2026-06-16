'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../../lib/nav-configs';
import { api } from '../../../../lib/api';
import { CheckCircle, XCircle, Download, RefreshCw } from 'lucide-react';

const fmt = (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID')}`;

export default function NeracaPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);


  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reporting/neraca', { params: { date } });
      setData(res.data);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const res = await api.get('/reporting/export', { params: { report: 'balance-sheet', format, date }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `neraca_${date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`; a.click();
    } catch { alert('Export gagal'); }
  };



  const Section = ({ title, items, total, color }: any) => (
    <div>
      <div className="px-4 py-2" style={{ background: '#F8F7FF', borderBottom: '1px solid #EDE8F5' }}>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>{title}</span>
      </div>
      {(items ?? []).map((item: any) => (
        <div key={item.id} className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #F5F2FB' }}>
          <span className="text-sm" style={{ color: '#374151' }}>{item.code} — {item.name}</span>
          <span className="text-sm font-medium">{fmt(item.balance)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-2.5 font-bold text-sm" style={{ background: '#FAFAFA', borderTop: '2px solid #EDE8F5' }}>
        <span>TOTAL {title}</span>
        <span style={{ color }}>{fmt(total ?? 0)}</span>
      </div>
    </div>
  );

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/keuangan/laporan/neraca">
      <div className="p-6 space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Neraca (Balance Sheet)</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Posisi keuangan per tanggal {date}</p>
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

        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Per Tanggal</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#E5E7EB' }} />
          </div>
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#7367F0' }}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Tampilkan
          </button>
          {data && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold" style={{
              background: data.isBalanced ? 'rgba(76,175,80,.1)' : 'rgba(234,84,85,.1)',
              color: data.isBalanced ? '#4CAF50' : '#EA5455',
              border: `1px solid ${data.isBalanced ? '#4CAF50' : '#EA5455'}40`,
            }}>
              {data.isBalanced ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {data.isBalanced ? 'Balanced ✓' : 'Unbalanced ✗'}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Memuat data...</div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #EDE8F5', background: 'rgba(33,150,243,.05)' }}>
                <h2 className="font-bold text-sm" style={{ color: '#1565C0' }}>ASET</h2>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Total: {fmt(data.assets?.total ?? 0)}</p>
              </div>
              <Section title="Aset" items={data.assets?.items} total={data.assets?.total} color="#2196F3" />
            </div>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #EDE8F5', background: 'rgba(234,84,85,.05)' }}>
                <h2 className="font-bold text-sm" style={{ color: '#C62828' }}>KEWAJIBAN & EKUITAS</h2>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Total: {fmt((data.liabilities?.total ?? 0) + (data.equity?.total ?? 0))}</p>
              </div>
              <Section title="Kewajiban" items={data.liabilities?.items} total={data.liabilities?.total} color="#EA5455" />
              <Section title="Ekuitas" items={data.equity?.items} total={data.equity?.total} color="#7367F0" />
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-sm" style={{ color: '#9CA3AF' }}>Klik "Tampilkan" untuk memuat neraca</div>
        )}
      </div>
    </AppShell>
  );
}

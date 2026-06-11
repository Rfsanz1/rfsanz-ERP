'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { POS_CONFIG, POS_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { BarChart2, Users, Package, CreditCard, RefreshCw, Download, Zap, TrendingUp, XCircle, Monitor } from 'lucide-react';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const TABS = [
  { key: 'reports', label: 'Ringkasan' },
  { key: 'by-cashier', label: 'Per Kasir' },
  { key: 'by-product', label: 'Per Produk' },
  { key: 'by-payment', label: 'Per Pembayaran' },
];

const PERIODS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: '7 Hari' },
  { key: 'month', label: 'Bulan Ini' },
];

export default function POSManagementPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'reports';
  const [tab, setTab] = useState(initialTab);
  const [period, setPeriod] = useState('today');
  const [summary, setSummary] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);


  const fetchSummary = async () => {
    try {
      const res = await api.get('/pos/management/reports/summary', { params: { period } });
      setSummary(res.data);
    } catch {}
  };

  const fetchTableData = async () => {
    if (tab === 'reports') return;
    setLoading(true);
    try {
      const endpoint = tab === 'by-cashier' ? '/pos/management/reports/by-cashier'
        : tab === 'by-product' ? '/pos/management/reports/by-product'
        : '/pos/management/reports/by-payment';
      const res = await api.get(endpoint, { params: { period } });
      setTableData(res.data?.data ?? res.data ?? []);
    } catch { setTableData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (token) { fetchSummary(); fetchTableData(); }
  }, [token, tab, period]);

  const handleSyncStock = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/pos/management/products/sync-stock');
      alert(res.data.message);
    } catch { alert('Sync gagal'); }
    finally { setSyncing(false); }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/pos/management/reports/export-csv', { params: { period }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `pos_report_${period}.csv`; a.click();
    } catch { alert('Export gagal'); }
  };

  const handleVoidTx = async (id: string) => {
    const reason = prompt('Masukkan alasan void:');
    if (reason === null) return;
    try {
      await api.patch(`/pos/management/transactions/${id}/void`, { reason });
      fetchTableData();
    } catch { alert('Void gagal'); }
  };

  if (!token) return null;

  return (
    <AppShell {...POS_CONFIG} navItems={POS_NAV} activeHref="/pos/management">
      <div className="p-6 space-y-5 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>POS Management Panel</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Monitor & kelola operasional kasir</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSyncStock} disabled={syncing} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: '#2196F3' }}>
              <Zap className="h-4 w-4" /> {syncing ? 'Syncing...' : 'Sync Stok'}
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5', color: '#388E3C' }}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => { fetchSummary(); fetchTableData(); }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg" style={{ border: '1.5px solid #EDE8F5' }}>
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Periode:</span>
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{
              background: period === p.key ? '#E64A19' : '#FBE9E7',
              color: period === p.key ? '#fff' : '#E64A19',
            }}>{p.label}</button>
          ))}
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Pendapatan', value: fmt(summary.totalRevenue ?? 0), icon: TrendingUp, color: '#E64A19' },
              { label: 'Jumlah Transaksi', value: String(summary.totalTransactions ?? 0), icon: BarChart2, color: '#2196F3' },
              { label: 'Sesi Aktif', value: String(summary.activeSessions ?? 0), icon: Monitor, color: '#4CAF50' },
              { label: 'Produk Terjual', value: String(summary.topProducts?.reduce((s: number, p: any) => s + p.qty, 0) ?? 0), icon: Package, color: '#FF9800' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #EDE8F5' }}>
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                </div>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {summary?.topProducts?.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid #EDE8F5' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1E1B4B' }}>Top 5 Produk</h3>
            <div className="space-y-2">
              {summary.topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-center" style={{ color: i === 0 ? '#E64A19' : '#9CA3AF' }}>#{i + 1}</span>
                  <span className="flex-1 text-sm" style={{ color: '#374151' }}>{p.name}</span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{p.qty} unit</span>
                  <span className="text-sm font-semibold" style={{ color: '#E64A19' }}>{fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#FBE9E7' }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className="px-4 py-2 text-sm font-semibold rounded-lg transition-all" style={{
              background: tab === t.key ? '#E64A19' : 'transparent',
              color: tab === t.key ? '#fff' : '#E64A19',
            }}>{t.label}</button>
          ))}
        </div>

        {tab !== 'reports' && (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8F5', background: '#FFF3E0' }}>
                    {tab === 'by-cashier' && ['Kasir', 'Transaksi', 'Total', 'Rata-rata'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                    {tab === 'by-product' && ['Produk', 'Qty Terjual', 'Total Revenue', 'Avg. Harga'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                    {tab === 'by-payment' && ['Metode', 'Jumlah Transaksi', 'Total', '% dari Total'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Memuat...</td></tr>
                  ) : tableData.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Tidak ada data untuk periode ini</td></tr>
                  ) : tableData.map((row: any, i: number) => {
                    const grandTotal = tableData.reduce((s: number, r: any) => s + Number(r.total ?? r.totalSales ?? r.revenue ?? 0), 0);
                    const rowTotal = Number(row.total ?? row.totalSales ?? row.revenue ?? 0);
                    const pct = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F5F2FB' }}>
                        {tab === 'by-cashier' && (
                          <>
                            <td className="px-4 py-3 text-sm font-medium" style={{ color: '#374151' }}>{row.cashierName ?? row.name ?? '-'}</td>
                            <td className="px-4 py-3 text-sm">{row.count ?? row.transactionCount ?? '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#E64A19' }}>{fmt(rowTotal)}</td>
                            <td className="px-4 py-3 text-sm">{row.count ? fmt(Math.round(rowTotal / row.count)) : '-'}</td>
                          </>
                        )}
                        {tab === 'by-product' && (
                          <>
                            <td className="px-4 py-3 text-sm font-medium" style={{ color: '#374151' }}>{row.productName ?? row.name ?? '-'}</td>
                            <td className="px-4 py-3 text-sm">{row.totalQty ?? row.qty ?? '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#E64A19' }}>{fmt(rowTotal)}</td>
                            <td className="px-4 py-3 text-sm">{row.totalQty ? fmt(Math.round(rowTotal / row.totalQty)) : '-'}</td>
                          </>
                        )}
                        {tab === 'by-payment' && (
                          <>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 text-sm font-medium">
                                <CreditCard className="h-3.5 w-3.5" style={{ color: '#E64A19' }} />
                                {row.paymentMethod ?? row.method ?? '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{row.count ?? '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#E64A19' }}>{fmt(rowTotal)}</td>
                            <td className="px-4 py-3 text-sm">{pct}%</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

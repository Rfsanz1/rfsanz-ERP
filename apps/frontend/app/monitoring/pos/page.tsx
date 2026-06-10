'use client';

import { useEffect, useState, useCallback } from 'react';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import api from '../../../lib/api';
import { Monitor, ExternalLink, RefreshCw, Search, DollarSign, ShoppingCart, Users, Clock } from 'lucide-react';

const C = {
  primary: '#5B52D1', border: '#EDE9FE', textDark: '#1E1B4B',
  textMid: '#6B7280', textLight: '#9CA3AF', appColor: '#E64A19',
};

const formatRp = (v: any) => v != null ? `Rp ${Number(v).toLocaleString('id')}` : '–';
const formatDate = (v: any) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';
const formatTime = (v: any) => v ? new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '–';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}>
      {label}
    </span>
  );
}

type TabKey = 'transactions' | 'sessions';

export default function MonitoringPOS() {
  const [activeTab, setActiveTab] = useState<TabKey>('transactions');
  const [data, setData] = useState<{ transactions: any[]; sessions: any[] }>({ transactions: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ totalTransactions: 0, totalOmzet: 0, activeSessions: 0, avgTransaction: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [txRes, sessRes] = await Promise.allSettled([
        api.get(`/pos/orders?today=true&limit=50&dateFrom=${today}`),
        api.get('/pos/sessions?status=open&limit=20'),
      ]);

      const extract = (r: any) => {
        if (r.status !== 'fulfilled') return [];
        const d = r.value.data;
        return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
      };

      const tx = extract(txRes);
      const sess = extract(sessRes);

      const totalOmzet = tx.reduce((sum: number, t: any) => sum + Number(t.totalAmount ?? t.total ?? 0), 0);
      const avgTransaction = tx.length > 0 ? totalOmzet / tx.length : 0;

      setData({ transactions: tx, sessions: sess });
      setStats({ totalTransactions: tx.length, totalOmzet, activeSessions: sess.length, avgTransaction });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterRows = (rows: any[]) =>
    rows.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const renderTransactions = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['No. Transaksi','Kasir','Pelanggan','Item','Total','Metode Bayar','Waktu'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.number ?? r.receiptNumber ?? r.code ?? `TRX-${i+1}`}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.cashier?.name ?? r.cashierName ?? r.user?.name ?? '–'}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.customer?.name ?? r.customerName ?? 'Walk-in'}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.itemCount ?? r.items?.length ?? r.lines?.length ?? 0}</td>
            <td className="px-4 py-3 font-semibold" style={{ color: C.textDark }}>{formatRp(r.totalAmount ?? r.total)}</td>
            <td className="px-4 py-3">
              <Badge label={r.paymentMethod ?? r.payment?.method ?? 'Tunai'} color="#8B5CF6" />
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatTime(r.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSessions = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['Kasir','Sesi Dibuka','Status','Modal Awal','Total Transaksi','Omzet Sesi'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.cashier?.name ?? r.user?.name ?? r.cashierName ?? `Kasir ${i+1}`}</td>
            <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatTime(r.openedAt ?? r.startTime ?? r.createdAt)}</td>
            <td className="px-4 py-3"><Badge label={r.status === 'open' ? 'Aktif' : 'Tutup'} color={r.status === 'open' ? '#22C55E' : '#9CA3AF'} /></td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{formatRp(r.openingBalance ?? r.cashOpening ?? 0)}</td>
            <td className="px-4 py-3 font-semibold" style={{ color: C.textDark }}>{r.transactionCount ?? r.orderCount ?? 0}</td>
            <td className="px-4 py-3 font-bold" style={{ color: C.appColor }}>{formatRp(r.totalSales ?? r.revenue ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const currentRows = filterRows(data[activeTab]);

  return (
    <OdooLayout title="Monitoring POS" subtitle="Data lengkap POS App">
      <PageHeader
        title="Monitoring POS App"
        subtitle="Semua sesi kasir dan transaksi hari ini"
        icon={Monitor}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'rgba(91,82,209,.1)', color: C.primary }}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <a href="http://localhost:3004" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: C.appColor }}>
              <ExternalLink className="h-3.5 w-3.5" /> Buka di POS App
            </a>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Transaksi Hari Ini" value={stats.totalTransactions} icon={ShoppingCart} iconColor="#E64A19" />
        <StatCard label="Total Omzet POS" value={stats.totalOmzet >= 1_000_000 ? `Rp ${(stats.totalOmzet/1_000_000).toFixed(1)} Jt` : formatRp(stats.totalOmzet)} icon={DollarSign} iconColor="#22C55E" />
        <StatCard label="Sesi Kasir Aktif" value={stats.activeSessions} icon={Users} iconColor="#8B5CF6" />
        <StatCard label="Rata-rata Transaksi" value={stats.avgTransaction >= 1_000 ? `Rp ${(stats.avgTransaction/1_000).toFixed(0)} rb` : formatRp(stats.avgTransaction)} icon={Clock} iconColor="#0891B2" />
      </div>

      {/* Omzet highlight */}
      {stats.totalOmzet > 0 && (
        <div className="rounded-2xl p-5 mb-6 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${C.appColor}, #FF7043)`, color: '#fff' }}>
          <div>
            <p className="text-sm opacity-80 mb-1">Total Omzet POS Hari Ini (Real-time)</p>
            <p className="text-3xl font-bold">{formatRp(stats.totalOmzet)}</p>
          </div>
          <Monitor className="h-12 w-12 opacity-20" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-4 flex items-center gap-3" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari transaksi atau kasir…"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ border: `1.5px solid ${C.border}`, color: C.textDark }} />
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-2xl" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="flex items-center gap-1 px-4 pt-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
          {([{ key: 'transactions' as TabKey, label: 'Transaksi Hari Ini' }, { key: 'sessions' as TabKey, label: 'Sesi Kasir Aktif' }]).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                color: activeTab === t.key ? C.primary : C.textMid,
                borderBottom: activeTab === t.key ? `2px solid ${C.primary}` : '2px solid transparent',
                backgroundColor: activeTab === t.key ? 'rgba(91,82,209,.08)' : 'transparent',
              }}>
              {t.label}
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: activeTab === t.key ? 'rgba(91,82,209,.15)' : '#F3F4F6', color: activeTab === t.key ? C.primary : C.textLight }}>
                {data[t.key].length}
              </span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto min-h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-transparent" style={{ borderTopColor: C.primary }} />
            </div>
          ) : currentRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Monitor className="h-8 w-8" style={{ color: '#D1C4E9' }} />
              <p className="text-sm" style={{ color: C.textLight }}>Belum ada data</p>
            </div>
          ) : activeTab === 'transactions' ? renderTransactions(currentRows) : renderSessions(currentRows)}
        </div>
      </div>
    </OdooLayout>
  );
}

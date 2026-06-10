'use client';

import { useEffect, useState, useCallback } from 'react';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { PageHeader } from '../../../components/ui/PageHeader';
import api from '../../../lib/api';
import { ShoppingCart, ExternalLink, RefreshCw, Search, Filter } from 'lucide-react';

const C = {
  primary: '#5B52D1', border: '#EDE9FE', textDark: '#1E1B4B',
  textMid: '#6B7280', textLight: '#9CA3AF', appColor: '#0891B2',
};

type TabKey = 'orders' | 'quotations' | 'invoices';

const STATUS_COLOR: Record<string, string> = {
  draft: '#9CA3AF', confirmed: '#3B82F6', done: '#22C55E',
  cancel: '#EF4444', sent: '#8B5CF6', sale: '#22C55E',
};

function Badge({ label }: { label: string }) {
  const color = STATUS_COLOR[label?.toLowerCase()] ?? '#9CA3AF';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}>
      {label ?? 'Draft'}
    </span>
  );
}

const formatRp = (v: any) => v != null ? `Rp ${Number(v).toLocaleString('id')}` : '–';
const formatDate = (v: any) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

export default function MonitoringSales() {
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [data, setData] = useState<{ orders: any[]; quotations: any[]; invoices: any[] }>({ orders: [], quotations: [], invoices: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (statusFilter) params.status = statusFilter;
      const qs = new URLSearchParams(params).toString();

      const [ordersRes, quotesRes, invoicesRes] = await Promise.allSettled([
        api.get(`/sales/orders?${qs}`),
        api.get(`/sales/quotations?${qs}`),
        api.get(`/invoice/list?${qs}`),
      ]);

      const extract = (r: any) => {
        if (r.status !== 'fulfilled') return [];
        const d = r.value.data;
        return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
      };

      setData({ orders: extract(ordersRes), quotations: extract(quotesRes), invoices: extract(invoicesRes) });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterRows = (rows: any[]) =>
    rows.filter((r) =>
      !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
    );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'orders',     label: 'Sales Orders' },
    { key: 'quotations', label: 'Quotations' },
    { key: 'invoices',   label: 'Invoice' },
  ];

  const renderOrders = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['No. Order','Pelanggan','Salesman','Status','Total','Tanggal'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.number ?? r.orderNumber ?? r.code ?? `SO-${i+1}`}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.customer?.name ?? r.customerName ?? '–'}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.salesman?.name ?? r.salesmanName ?? r.user?.name ?? '–'}</td>
            <td className="px-4 py-3"><Badge label={r.status} /></td>
            <td className="px-4 py-3 font-semibold" style={{ color: C.textDark }}>{formatRp(r.totalAmount ?? r.total)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatDate(r.orderDate ?? r.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderQuotations = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['No. Quotation','Pelanggan','Validasi Hingga','Status','Total'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.number ?? r.quoteNumber ?? r.code ?? `QUO-${i+1}`}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.customer?.name ?? r.customerName ?? '–'}</td>
            <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatDate(r.validUntil ?? r.expiryDate)}</td>
            <td className="px-4 py-3"><Badge label={r.status} /></td>
            <td className="px-4 py-3 font-semibold" style={{ color: C.textDark }}>{formatRp(r.totalAmount ?? r.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderInvoices = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['No. Invoice','Pelanggan','Jatuh Tempo','Status','Total','Sisa Bayar'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.number ?? r.invoiceNumber ?? `INV-${i+1}`}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.customer?.name ?? r.customerName ?? '–'}</td>
            <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatDate(r.dueDate)}</td>
            <td className="px-4 py-3"><Badge label={r.status} /></td>
            <td className="px-4 py-3 font-semibold" style={{ color: C.textDark }}>{formatRp(r.totalAmount ?? r.total)}</td>
            <td className="px-4 py-3" style={{ color: r.amountDue > 0 ? '#EF4444' : '#22C55E', fontWeight: 600 }}>{formatRp(r.amountDue ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const currentRows = filterRows(data[activeTab]);

  return (
    <OdooLayout title="Monitoring Sales" subtitle="Data lengkap Sales App">
      <PageHeader
        title="Monitoring Sales App"
        subtitle="Semua data Sales App dapat dipantau di sini oleh Admin"
        icon={ShoppingCart}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'rgba(91,82,209,.1)', color: C.primary }}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <a href="http://localhost:3002" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: C.appColor }}>
              <ExternalLink className="h-3.5 w-3.5" /> Buka di Sales App
            </a>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari…"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ border: `1.5px solid ${C.border}`, color: C.textDark }} />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ border: `1.5px solid ${C.border}`, color: C.textMid }} />
        <span className="text-xs" style={{ color: C.textLight }}>s/d</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ border: `1.5px solid ${C.border}`, color: C.textMid }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ border: `1.5px solid ${C.border}`, color: C.textMid }}>
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="done">Done</option>
          <option value="cancel">Cancelled</option>
        </select>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-2xl" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="flex items-center gap-1 px-4 pt-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
          {TABS.map(t => (
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
              <ShoppingCart className="h-8 w-8" style={{ color: '#D1C4E9' }} />
              <p className="text-sm" style={{ color: C.textLight }}>Belum ada data</p>
            </div>
          ) : activeTab === 'orders' ? renderOrders(currentRows)
            : activeTab === 'quotations' ? renderQuotations(currentRows)
            : renderInvoices(currentRows)}
        </div>
      </div>
    </OdooLayout>
  );
}

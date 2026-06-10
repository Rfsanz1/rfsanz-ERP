'use client';

import { useEffect, useState, useCallback } from 'react';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import api from '../../../lib/api';
import { Package, ExternalLink, RefreshCw, Search, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardList } from 'lucide-react';

const C = {
  primary: '#5B52D1', border: '#EDE9FE', textDark: '#1E1B4B',
  textMid: '#6B7280', textLight: '#9CA3AF', appColor: '#D97706',
};

const formatDate = (v: any) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}>
      {label}
    </span>
  );
}

type TabKey = 'products' | 'inbound' | 'outbound' | 'picking';

export default function MonitoringGudang() {
  const [activeTab, setActiveTab] = useState<TabKey>('products');
  const [data, setData] = useState<{ products: any[]; inbound: any[]; outbound: any[]; picking: any[] }>({
    products: [], inbound: [], outbound: [], picking: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stats, setStats] = useState({ products: 0, criticalStock: 0, pendingInbound: 0, pendingOutbound: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const whParam = selectedWarehouse ? `&warehouseId=${selectedWarehouse}` : '';
      const [productsRes, inboundRes, outboundRes, pickingRes, warehousesRes] = await Promise.allSettled([
        api.get(`/inventory/products?limit=50${whParam}`),
        api.get(`/purchasing/goods-receipts?status=pending&limit=20${whParam}`),
        api.get(`/inventory/transfers?type=out&status=pending&limit=20${whParam}`),
        api.get(`/inventory/transfers?limit=20${whParam}`),
        api.get('/inventory/warehouses'),
      ]);

      const extract = (r: any) => {
        if (r.status !== 'fulfilled') return [];
        const d = r.value.data;
        return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
      };

      const prods = extract(productsRes);
      const inbound = extract(inboundRes);
      const outbound = extract(outboundRes);
      const picking = extract(pickingRes);
      const wh = extract(warehousesRes);

      setData({ products: prods, inbound, outbound, picking });
      setWarehouses(wh);
      setStats({
        products: prods.length,
        criticalStock: prods.filter((p: any) => (p.stock ?? p.currentStock ?? 0) <= (p.minStock ?? p.reorderPoint ?? 5)).length,
        pendingInbound: inbound.length,
        pendingOutbound: outbound.length,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterRows = (rows: any[]) =>
    rows.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'products', label: 'Stok Produk',      icon: Package },
    { key: 'inbound',  label: 'Inbound Pending',   icon: ArrowDownToLine },
    { key: 'outbound', label: 'Outbound Pending',  icon: ArrowUpFromLine },
    { key: 'picking',  label: 'Picking List',      icon: ClipboardList },
  ];

  const renderProducts = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['Produk','SKU','Stok','Min. Stok','Satuan','Gudang','Status'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => {
          const stock = r.stock ?? r.currentStock ?? 0;
          const minStock = r.minStock ?? r.reorderPoint ?? 5;
          const isCritical = stock <= minStock;
          return (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: isCritical ? 'rgba(239,68,68,0.03)' : undefined }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = isCritical ? 'rgba(239,68,68,0.06)' : '#F5F3FF')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = isCritical ? 'rgba(239,68,68,0.03)' : 'transparent')}>
              <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>
                {isCritical && <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-red-500" />}
                {r.name ?? r.productName ?? `Produk ${i+1}`}
              </td>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: C.textLight }}>{r.sku ?? r.code ?? '–'}</td>
              <td className="px-4 py-3 font-bold" style={{ color: isCritical ? '#EF4444' : C.textDark }}>{stock}</td>
              <td className="px-4 py-3" style={{ color: C.textLight }}>{minStock}</td>
              <td className="px-4 py-3" style={{ color: C.textMid }}>{r.unit?.name ?? r.unitName ?? 'pcs'}</td>
              <td className="px-4 py-3" style={{ color: C.textMid }}>{r.warehouse?.name ?? r.warehouseName ?? '–'}</td>
              <td className="px-4 py-3"><Badge label={isCritical ? 'Kritis' : 'Normal'} color={isCritical ? '#EF4444' : '#22C55E'} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderTransfers = (rows: any[], type: 'inbound' | 'outbound' | 'picking') => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['Referensi', type === 'inbound' ? 'Supplier' : 'Tujuan', 'Jadwal','Status','Item','Tanggal'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>{r.reference ?? r.number ?? r.code ?? `REF-${i+1}`}</td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.supplier?.name ?? r.partner?.name ?? r.destination ?? r.destinationLocation ?? '–'}</td>
            <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatDate(r.scheduledDate ?? r.expectedDate)}</td>
            <td className="px-4 py-3"><Badge label={r.status ?? 'pending'} color={r.status === 'done' ? '#22C55E' : r.status === 'in_progress' ? '#3B82F6' : '#F59E0B'} /></td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.itemCount ?? r.lines?.length ?? r.items?.length ?? 0} item</td>
            <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatDate(r.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const currentRows = filterRows(data[activeTab]);

  return (
    <OdooLayout title="Monitoring Gudang" subtitle="Data lengkap Gudang App">
      <PageHeader
        title="Monitoring Gudang App"
        subtitle="Stok real-time, inbound/outbound, dan picking list"
        icon={Package}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'rgba(91,82,209,.1)', color: C.primary }}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <a href="http://localhost:3003" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: C.appColor }}>
              <ExternalLink className="h-3.5 w-3.5" /> Buka di Gudang App
            </a>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Produk" value={stats.products} icon={Package} iconColor="#8B5CF6" />
        <StatCard label="Stok Kritis" value={stats.criticalStock} icon={AlertTriangle} iconColor="#EF4444" />
        <StatCard label="Inbound Pending" value={stats.pendingInbound} icon={ArrowDownToLine} iconColor="#22C55E" />
        <StatCard label="Outbound Pending" value={stats.pendingOutbound} icon={ArrowUpFromLine} iconColor="#F59E0B" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk…"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ border: `1.5px solid ${C.border}`, color: C.textDark }} />
        </div>
        <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ border: `1.5px solid ${C.border}`, color: C.textMid }}>
          <option value="">Semua Gudang</option>
          {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-2xl" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto" style={{ borderBottom: `1.5px solid ${C.border}` }}>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap"
                style={{
                  color: activeTab === t.key ? C.primary : C.textMid,
                  borderBottom: activeTab === t.key ? `2px solid ${C.primary}` : '2px solid transparent',
                  backgroundColor: activeTab === t.key ? 'rgba(91,82,209,.08)' : 'transparent',
                }}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </div>
        <div className="overflow-x-auto min-h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-transparent" style={{ borderTopColor: C.primary }} />
            </div>
          ) : currentRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Package className="h-8 w-8" style={{ color: '#D1C4E9' }} />
              <p className="text-sm" style={{ color: C.textLight }}>Belum ada data</p>
            </div>
          ) : activeTab === 'products' ? renderProducts(currentRows)
            : renderTransfers(currentRows, activeTab)}
        </div>
      </div>
    </OdooLayout>
  );
}

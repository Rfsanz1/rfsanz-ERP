'use client';

import { useEffect, useState, useCallback } from 'react';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import api from '../../../lib/api';
import { Truck, ExternalLink, RefreshCw, Search, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

const C = {
  primary: '#5B52D1', border: '#EDE9FE', textDark: '#1E1B4B',
  textMid: '#6B7280', textLight: '#9CA3AF', appColor: '#1D4ED8',
};

const formatDate = (v: any) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';
const formatTime = (v: any) => v ? new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '–';

const DRIVER_STATUS_COLOR: Record<string, string> = {
  available: '#22C55E',
  on_delivery: '#3B82F6',
  done: '#8B5CF6',
  off: '#9CA3AF',
};

const DELIVERY_STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  on_progress: '#3B82F6',
  done: '#22C55E',
  cancelled: '#EF4444',
  late: '#EF4444',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}>
      {label}
    </span>
  );
}

function isLate(delivery: any): boolean {
  const deadline = delivery.deadline ?? delivery.expectedDate ?? delivery.scheduledDate;
  if (!deadline) return false;
  return new Date(deadline) < new Date() && delivery.status !== 'done';
}

export default function MonitoringDriver() {
  const [data, setData] = useState<{ drivers: any[]; deliveries: any[] }>({ drivers: [], deliveries: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'deliveries' | 'drivers'>('deliveries');
  const [stats, setStats] = useState({ total: 0, onProgress: 0, done: 0, late: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50';
      const [deliveriesRes, driversRes] = await Promise.allSettled([
        api.get(`/delivery${params}`),
        api.get('/hr/employees?role=driver&limit=50'),
      ]);

      const extract = (r: any) => {
        if (r.status !== 'fulfilled') return [];
        const d = r.value.data;
        return Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
      };

      const deliveries = extract(deliveriesRes);
      const drivers = extract(driversRes);

      const lateCount = deliveries.filter(isLate).length;
      setData({ drivers, deliveries });
      setStats({
        total: deliveries.length,
        onProgress: deliveries.filter((d: any) => d.status === 'on_progress').length,
        done: deliveries.filter((d: any) => d.status === 'done').length,
        late: lateCount,
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterRows = (rows: any[]) =>
    rows.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const renderDeliveries = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['No. Pengiriman','Driver','Pelanggan','Alamat','Deadline','Status','Waktu'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => {
          const late = isLate(r);
          return (
            <tr key={i}
              style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: late ? 'rgba(239,68,68,0.03)' : undefined }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = late ? 'rgba(239,68,68,0.06)' : '#F5F3FF')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = late ? 'rgba(239,68,68,0.03)' : 'transparent')}>
              <td className="px-4 py-3 font-medium" style={{ color: C.textDark }}>
                {late && <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-red-500" />}
                {r.number ?? r.deliveryNumber ?? r.code ?? `DEL-${i+1}`}
              </td>
              <td className="px-4 py-3" style={{ color: C.textMid }}>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ backgroundColor: C.appColor }}>
                    {(r.driver?.name ?? r.driverName ?? 'D').charAt(0).toUpperCase()}
                  </div>
                  {r.driver?.name ?? r.driverName ?? '–'}
                </div>
              </td>
              <td className="px-4 py-3" style={{ color: C.textMid }}>{r.customer?.name ?? r.customerName ?? '–'}</td>
              <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: C.textLight }} title={r.deliveryAddress ?? r.address ?? ''}>
                {r.deliveryAddress ?? r.address ?? '–'}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: late ? '#EF4444' : C.textLight, fontWeight: late ? 700 : 400 }}>
                {formatDate(r.deadline ?? r.scheduledDate)}
              </td>
              <td className="px-4 py-3">
                <Badge label={late ? 'Terlambat' : (r.status ?? 'pending')} color={late ? '#EF4444' : (DELIVERY_STATUS_COLOR[r.status] ?? '#F59E0B')} />
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: C.textLight }}>{formatTime(r.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderDrivers = (rows: any[]) => (
    <table className="w-full text-sm">
      <thead><tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
        {['Driver','No. HP','Status','Kendaraan','Pengiriman Aktif','Selesai Hari Ini'].map(h => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: C.textLight }}>{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${C.appColor}, #3B82F6)` }}>
                  {(r.name ?? 'D').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: C.textDark }}>{r.name ?? r.employeeName ?? `Driver ${i+1}`}</p>
                  <p className="text-xs" style={{ color: C.textLight }}>{r.employeeId ?? r.code ?? '–'}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 font-mono text-xs" style={{ color: C.textMid }}>{r.phone ?? r.mobile ?? '–'}</td>
            <td className="px-4 py-3">
              <Badge label={r.driverStatus ?? 'available'} color={DRIVER_STATUS_COLOR[r.driverStatus ?? 'available']} />
            </td>
            <td className="px-4 py-3" style={{ color: C.textMid }}>{r.vehicle?.plate ?? r.vehiclePlate ?? r.vehicle ?? '–'}</td>
            <td className="px-4 py-3 font-semibold" style={{ color: C.appColor }}>{r.activeDeliveries ?? 0}</td>
            <td className="px-4 py-3" style={{ color: '#22C55E', fontWeight: 600 }}>{r.completedToday ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const deliveryRows = filterRows(data.deliveries);
  const driverRows = filterRows(data.drivers);
  const currentRows = activeTab === 'deliveries' ? deliveryRows : driverRows;

  return (
    <OdooLayout title="Monitoring Driver" subtitle="Data lengkap Driver App">
      <PageHeader
        title="Monitoring Driver App"
        subtitle="Status driver dan pengiriman real-time"
        icon={Truck}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'rgba(91,82,209,.1)', color: C.primary }}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <a href="http://localhost:3005" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: C.appColor }}>
              <ExternalLink className="h-3.5 w-3.5" /> Buka di Driver App
            </a>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Pengiriman" value={stats.total} icon={Truck} iconColor="#1D4ED8" />
        <StatCard label="On Progress" value={stats.onProgress} icon={Clock} iconColor="#3B82F6" />
        <StatCard label="Selesai" value={stats.done} icon={CheckCircle} iconColor="#22C55E" />
        <StatCard label="Terlambat" value={stats.late} icon={AlertTriangle} iconColor="#EF4444" />
      </div>

      {/* Late alert */}
      {stats.late > 0 && (
        <div className="rounded-xl p-4 mb-4 flex items-center gap-3"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">
            {stats.late} pengiriman terlambat! Segera hubungi driver yang bersangkutan.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari driver atau pengiriman…"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ border: `1.5px solid ${C.border}`, color: C.textDark }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ border: `1.5px solid ${C.border}`, color: C.textMid }}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="on_progress">On Progress</option>
          <option value="done">Selesai</option>
        </select>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-2xl" style={{ border: `1.5px solid ${C.border}` }}>
        <div className="flex items-center gap-1 px-4 pt-4" style={{ borderBottom: `1.5px solid ${C.border}` }}>
          {([
            { key: 'deliveries' as const, label: 'Daftar Pengiriman', icon: Truck },
            { key: 'drivers' as const, label: 'Status Driver', icon: Users },
          ]).map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
                style={{
                  color: activeTab === t.key ? C.primary : C.textMid,
                  borderBottom: activeTab === t.key ? `2px solid ${C.primary}` : '2px solid transparent',
                  backgroundColor: activeTab === t.key ? 'rgba(91,82,209,.08)' : 'transparent',
                }}>
                <Icon className="h-3.5 w-3.5" />{t.label}
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: activeTab === t.key ? 'rgba(91,82,209,.15)' : '#F3F4F6', color: activeTab === t.key ? C.primary : C.textLight }}>
                  {t.key === 'deliveries' ? data.deliveries.length : data.drivers.length}
                </span>
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
              <Truck className="h-8 w-8" style={{ color: '#D1C4E9' }} />
              <p className="text-sm" style={{ color: C.textLight }}>Belum ada data</p>
            </div>
          ) : activeTab === 'deliveries' ? renderDeliveries(currentRows) : renderDrivers(currentRows)}
        </div>
      </div>
    </OdooLayout>
  );
}

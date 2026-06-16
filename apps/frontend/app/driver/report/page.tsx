'use client';
import { useEffect, useState } from 'react';
import DriverBottomNav from '@/components/DriverBottomNav';

function getDriverToken() { return typeof window !== 'undefined' ? (localStorage.getItem('driver_token') || localStorage.getItem('gm_auth_token') || '') : ''; }

interface ReportData {
  totalDeliveries: number;
  totalDistance?: number;
  onTimeRate: number;
  avgDeliveryTime?: number;
  deliveriesByStatus: Record<string, number>;
  recentActivity: Array<{
    id: string; shipmentRef?: string; status: string;
    date: string; origin?: string; destination?: string;
  }>;
}

const STATUS_LABEL: Record<string, string> = {
  delivered: 'Terkirim', in_transit: 'Dalam Perjalanan',
  cancelled: 'Dibatalkan', booked: 'Booked',
  pickup: 'Pickup', picked_up: 'Sudah Pickup',
};
const STATUS_COLOR: Record<string, string> = {
  delivered: '#388e3c', in_transit: '#1976d2',
  cancelled: '#b71c1c', booked: '#757575',
  pickup: '#f57c00', picked_up: '#e65100',
};

export default function DriverReportPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/v1/driver-portal/report?period=${period}`, {
          headers: { Authorization: `Bearer ${getDriverToken()}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal memuat laporan');
        setReport(json.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [period]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 480, margin: '0 auto', fontFamily: 'Inter, Roboto, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #c62828, #e53935)', padding: '20px 16px 28px', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Laporan Saya</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.75 }}>Performa pengiriman Anda</p>
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {([['week', '7 Hari'], ['month', '30 Hari'], ['all', 'Semua']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{
              padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
              border: period === val ? 'none' : '1.5px solid #e0e0e0',
              background: period === val ? '#e53935' : '#fff',
              color: period === val ? '#fff' : '#757575', cursor: 'pointer',
            }}>
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#9e9e9e' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e53935', borderTopColor: 'transparent', borderRadius: 18, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Memuat laporan...
          </div>
        )}

        {error && (
          <div style={{ background: '#ffebee', borderRadius: 12, padding: 16, color: '#b71c1c', fontSize: 13 }}>{error}</div>
        )}

        {report && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { icon: '🚚', label: 'Total Pengiriman', value: report.totalDeliveries, color: '#1976d2' },
                { icon: '⏱️', label: 'On-Time Rate', value: `${report.onTimeRate.toFixed(1)}%`, color: '#388e3c' },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {report.deliveriesByStatus && Object.keys(report.deliveriesByStatus).length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Pengiriman per Status</h3>
                {Object.entries(report.deliveriesByStatus).map(([status, count]) => {
                  const total = Object.values(report.deliveriesByStatus).reduce((a, b) => a + b, 0) || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={status} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#424242' }}>{STATUS_LABEL[status] || status}</span>
                        <span style={{ color: '#9e9e9e' }}>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ background: '#f5f5f5', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: STATUS_COLOR[status] || '#9e9e9e', borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {report.recentActivity && report.recentActivity.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Aktivitas Terbaru</h3>
                {report.recentActivity.map(act => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #fafafa' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: STATUS_COLOR[act.status] || '#9e9e9e', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{act.shipmentRef || `SHP-${act.id.slice(0, 6)}`}</div>
                      {act.origin && <div style={{ fontSize: 11, color: '#9e9e9e' }}>{act.origin} → {act.destination}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, fontWeight: 600, color: STATUS_COLOR[act.status] || '#757575', background: (STATUS_COLOR[act.status] || '#9e9e9e') + '18' }}>
                        {STATUS_LABEL[act.status] || act.status}
                      </div>
                      <div style={{ fontSize: 10, color: '#bdbdbd', marginTop: 3 }}>{new Date(act.date).toLocaleDateString('id-ID')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <DriverBottomNav />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../lib/nav-configs';

const C = FLEET_CONFIG.appColor;

interface Shipment {
  id: string;
  referenceNumber?: string;
  status: string;
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
}

interface Order { id: string; status: string; }

interface Issue {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  sourceEntityId?: string;
}

interface SlaSummary {
  active: number;
  warning: number;
  breached: number;
  met: number;
  total: number;
}

const STATUS_CHIP: Record<string, { label: string; color: string }> = {
  booked:     { label: 'Booked',         color: '#1565c0' },
  pickup:     { label: 'Pickup',          color: '#e65100' },
  picked_up:  { label: 'Sudah Pickup',   color: '#7b1fa2' },
  in_transit: { label: 'Dalam Perjalanan', color: '#f57c00' },
  delivered:  { label: 'Terkirim',       color: '#388e3c' },
  cancelled:  { label: 'Dibatalkan',     color: '#b71c1c' },
};

function relTime(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
}

export default function TmsDashboardPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeIssues, setActiveIssues] = useState<Issue[]>([]);
  const [slaSummary, setSlaSummary] = useState<SlaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') : '');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [shipRes, ordRes] = await Promise.all([
          fetch('/api/v1/shipments', { headers }),
          fetch('/api/v1/orders', { headers }),
        ]);
        const shipJson = shipRes.ok ? await shipRes.json() : { data: [] };
        const ordJson = ordRes.ok ? await ordRes.json() : { data: [] };
        if (!cancelled) {
          setShipments(shipJson.data || []);
          setOrders(ordJson.data || []);
        }
        fetch('/api/v1/issues', { headers })
          .then(r => r.ok ? r.json() : { data: [] })
          .then(json => {
            if (!cancelled) {
              const issues = (json.data || [])
                .filter((i: Issue) => i.status === 'open' || i.status === 'in_progress')
                .slice(0, 5);
              setActiveIssues(issues);
            }
          }).catch(() => {});
        fetch('/api/v1/sla/evaluations/summary', { headers })
          .then(r => r.ok ? r.json() : { data: null })
          .then(json => { if (!cancelled) setSlaSummary(json.data || null); })
          .catch(() => {});
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Gagal memuat data TMS');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const activeShipments = shipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled');
  const inTransit       = shipments.filter(s => s.status === 'in_transit');
  const delivered       = shipments.filter(s => s.status === 'delivered');
  const pendingOrders   = orders.filter(o => o.status === 'pending' || o.status === 'new');
  const recentShipments = shipments.slice(0, 6);
  const total           = shipments.length || 1;
  const onTimeRate      = delivered.length > 0 ? Math.round((delivered.length / total) * 100) : 0;

  const severityColor = (p: string) => {
    if (p === 'critical' || p === 'high') return '#c62828';
    if (p === 'medium') return '#f57c00';
    return '#1976d2';
  };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ padding: 24, fontFamily: 'Inter, Roboto, sans-serif', color: '#212121' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Dashboard TMS</h1>
            <p style={{ margin: '4px 0 0', color: '#757575', fontSize: 13 }}>{today}</p>
          </div>
          <button
            onClick={() => router.push('/driver')}
            style={{
              padding: '8px 18px', borderRadius: 10, border: 'none',
              background: C, color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🚚 Portal Driver
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e9e9e' }}>
            <div style={{ fontSize: 15 }}>Memuat data TMS...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: '#fff3e0', border: '1px solid #ffcc02', borderRadius: 12,
            padding: '16px 20px', color: '#e65100', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            ⚠️ {error} — Pastikan backend TMS sudah berjalan dan terhubung.
          </div>
        )}

        {!loading && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { emoji: '🚚', label: 'Shipment Aktif',   value: activeShipments.length, color: '#1976d2' },
                { emoji: '📋', label: 'Order Pending',    value: pendingOrders.length,   color: '#7b1fa2' },
                { emoji: '▶️', label: 'Dalam Perjalanan', value: inTransit.length,       color: '#f57c00' },
                { emoji: '✅', label: 'Terkirim',         value: delivered.length,       color: '#388e3c' },
                { emoji: '⏱️', label: 'On-Time Rate',     value: `${onTimeRate}%`,       color: '#00897b' },
              ].map(item => (
                <div key={item.label} style={{
                  background: '#fff', borderRadius: 12, padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: item.color + '18', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{item.emoji}</div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#212121', lineHeight: 1 }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: '#757575', marginTop: 3 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* Recent Shipments */}
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Shipment Terbaru</h3>
                  <span style={{ fontSize: 12, color: '#9e9e9e' }}>{shipments.length} total</span>
                </div>
                <div>
                  {recentShipments.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9e9e9e', fontSize: 13 }}>
                      Belum ada data shipment
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Referensi', 'Rute', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#9e9e9e', textAlign: 'left', borderBottom: '1px solid #f5f5f5' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentShipments.map(s => {
                          const chip = STATUS_CHIP[s.status] || { label: s.status, color: '#757575' };
                          const origin = s.originCity ? `${s.originCity}${s.originState ? ', ' + s.originState : ''}` : 'N/A';
                          const dest = s.destinationCity ? `${s.destinationCity}${s.destinationState ? ', ' + s.destinationState : ''}` : 'N/A';
                          return (
                            <tr key={s.id} style={{ cursor: 'pointer' }}>
                              <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #fafafa' }}>
                                <strong>{s.referenceNumber || `SHP-${s.id.slice(0, 6).toUpperCase()}`}</strong>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #fafafa' }}>
                                <div>{origin}</div>
                                <div style={{ color: '#9e9e9e', fontSize: 11 }}>→ {dest}</div>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #fafafa' }}>
                                <span style={{
                                  display: 'inline-block', padding: '3px 8px', borderRadius: 100,
                                  fontSize: 11, fontWeight: 600, color: chip.color, background: chip.color + '18',
                                }}>{chip.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Active Issues */}
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Isu Aktif</h3>
                </div>
                <div>
                  {activeIssues.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9e9e9e', fontSize: 13 }}>
                      ✅ Tidak ada isu aktif
                    </div>
                  ) : (
                    activeIssues.map(issue => (
                      <div key={issue.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 20px', borderBottom: '1px solid #fafafa',
                      }}>
                        <span style={{ fontSize: 18, color: severityColor(issue.priority) }}>⚠</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{issue.title}</div>
                          <div style={{ fontSize: 11, color: '#9e9e9e' }}>
                            {issue.sourceEntityId || 'N/A'} · {relTime(issue.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* SLA Health */}
            {slaSummary && slaSummary.total > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 20, marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>SLA Health</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
                  {[
                    { label: 'Aktif',      value: slaSummary.active,   color: '#1976d2' },
                    { label: 'Peringatan', value: slaSummary.warning,  color: '#f57c00' },
                    { label: 'Dilanggar', value: slaSummary.breached, color: '#c62828' },
                    { label: 'Terpenuhi', value: slaSummary.met,      color: '#388e3c' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {slaSummary.breached > 0 && (
                  <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#b71c1c', marginTop: 12 }}>
                    ⚠ {slaSummary.breached} SLA dilanggar
                  </div>
                )}
              </div>
            )}

            {/* Delivery Performance */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Performa Pengiriman</h3>
              {[
                { label: 'Terkirim',         pct: (delivered.length / total) * 100,       count: delivered.length,   color: '#388e3c' },
                { label: 'Dalam Perjalanan', pct: (inTransit.length / total) * 100,        count: inTransit.length,   color: '#f57c00' },
                { label: 'Lainnya',          pct: ((total - delivered.length - inTransit.length) / total) * 100, count: total - delivered.length - inTransit.length, color: '#c62828' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{row.label}</span>
                    <span style={{ color: '#757575' }}>{row.count} shipment ({row.pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

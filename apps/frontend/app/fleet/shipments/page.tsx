'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../lib/nav-configs';
import { Search, RefreshCw, Plus } from 'lucide-react';

const C = FLEET_CONFIG.appColor;

interface Shipment {
  id: string;
  referenceNumber?: string;
  status: string;
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
  scheduledPickup?: string;
  scheduledDelivery?: string;
  customerName?: string;
  driverName?: string;
  totalWeight?: number;
  createdAt?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  booked:     { label: 'Booked',           color: '#1565c0', bg: '#e3f2fd' },
  pickup:     { label: 'Menuju Pickup',    color: '#e65100', bg: '#fff3e0' },
  picked_up:  { label: 'Barang Diambil',   color: '#7b1fa2', bg: '#f3e5f5' },
  in_transit: { label: 'Dalam Perjalanan', color: '#f57c00', bg: '#fff8e1' },
  delivered:  { label: 'Terkirim',         color: '#2e7d32', bg: '#e8f5e9' },
  cancelled:  { label: 'Dibatalkan',       color: '#b71c1c', bg: '#ffebee' },
};

const SAMPLE: Shipment[] = [
  { id: 'shp-001', referenceNumber: 'SHP-2026-001', status: 'in_transit', originCity: 'Jakarta', destinationCity: 'Bandung', customerName: 'PT Maju Sejahtera', driverName: 'Agus Salim', scheduledDelivery: new Date(Date.now() + 3600000 * 5).toISOString(), totalWeight: 250 },
  { id: 'shp-002', referenceNumber: 'SHP-2026-002', status: 'booked',     originCity: 'Bandung', destinationCity: 'Surabaya', customerName: 'CV Berkah Jaya',   driverName: 'Eko Prasetyo', scheduledDelivery: new Date(Date.now() + 3600000 * 28).toISOString(), totalWeight: 180 },
  { id: 'shp-003', referenceNumber: 'SHP-2026-003', status: 'delivered',  originCity: 'Surabaya', destinationCity: 'Malang', customerName: 'Toko Makmur',     driverName: 'Budi Hartono', scheduledDelivery: new Date(Date.now() - 3600000 * 24).toISOString(), totalWeight: 90 },
  { id: 'shp-004', referenceNumber: 'SHP-2026-004', status: 'pickup',     originCity: 'Jakarta', destinationCity: 'Semarang', customerName: 'UD Subur',       driverName: 'Deni Kurniawan', scheduledDelivery: new Date(Date.now() + 3600000 * 10).toISOString(), totalWeight: 320 },
  { id: 'shp-005', referenceNumber: 'SHP-2026-005', status: 'cancelled',  originCity: 'Yogyakarta', destinationCity: 'Solo',  customerName: 'PT Cahaya',      driverName: '', scheduledDelivery: new Date(Date.now() - 3600000 * 48).toISOString(), totalWeight: 60 },
];

export default function FleetShipmentsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSample, setIsSample] = useState(false);

  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') : '');

  async function fetchShipments() {
    setLoading(true);
    setIsSample(false);
    try {
      const res = await fetch('/api/v1/shipments', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setShipments(json.data || []);
    } catch {
      setShipments(SAMPLE);
      setIsSample(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchShipments(); }, []);

  const filtered = shipments.filter(s => {
    const matchSearch = !search ||
      (s.referenceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.driverName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.originCity || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.destinationCity || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      shipments.length,
    active:     shipments.filter(s => !['delivered','cancelled'].includes(s.status)).length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    delivered:  shipments.filter(s => s.status === 'delivered').length,
  };

  return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#212121' }}>Shipment</h1>
            <p style={{ margin: '4px 0 0', color: '#757575', fontSize: 13 }}>Pantau semua pengiriman dari portal driver</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchShipments} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: C, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Buat Shipment
            </button>
          </div>
        </div>

        {isSample && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#e65100', marginBottom: 20 }}>
            ⚠️ Menampilkan data contoh — hubungkan backend TMS untuk data nyata.
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',           value: stats.total,      color: C,        emoji: '📋' },
            { label: 'Aktif',           value: stats.active,     color: '#1565c0', emoji: '🔄' },
            { label: 'Dalam Perjalanan',value: stats.in_transit, color: '#f57c00', emoji: '🚚' },
            { label: 'Terkirim',        value: stats.delivered,  color: '#2e7d32', emoji: '✅' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#212121', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari referensi, customer, driver, kota..."
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">Semua Status</option>
            <option value="booked">Booked</option>
            <option value="pickup">Menuju Pickup</option>
            <option value="picked_up">Barang Diambil</option>
            <option value="in_transit">Dalam Perjalanan</option>
            <option value="delivered">Terkirim</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e9e9e' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C}`, borderTopColor: 'transparent', borderRadius: 18, animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
            Memuat data shipment...
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Referensi', 'Rute', 'Customer', 'Driver', 'Jadwal Antar', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#9e9e9e', textAlign: 'left', borderBottom: '1px solid #f5f5f5', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9e9e9e', fontSize: 13 }}>Tidak ada shipment ditemukan</td></tr>
                ) : filtered.map(ship => {
                  const chip = STATUS_MAP[ship.status] || { label: ship.status, color: '#757575', bg: '#f5f5f5' };
                  const origin = [ship.originCity, ship.originState].filter(Boolean).join(', ') || 'N/A';
                  const dest = [ship.destinationCity, ship.destinationState].filter(Boolean).join(', ') || 'N/A';
                  return (
                    <tr
                      key={ship.id}
                      onClick={() => router.push(`/fleet/shipments/${ship.id}`)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #fafafa', fontWeight: 700 }}>
                        {ship.referenceNumber || `SHP-${ship.id.slice(0, 8).toUpperCase()}`}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #fafafa' }}>
                        <div>{origin}</div>
                        <div style={{ fontSize: 11, color: '#9e9e9e' }}>→ {dest}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #fafafa', color: '#555' }}>
                        {ship.customerName || '-'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #fafafa', color: '#555' }}>
                        {ship.driverName || <span style={{ color: '#bdbdbd', fontStyle: 'italic' }}>Belum di-assign</span>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, borderBottom: '1px solid #fafafa', color: '#757575', whiteSpace: 'nowrap' }}>
                        {ship.scheduledDelivery ? new Date(ship.scheduledDelivery).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: '1px solid #fafafa' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, color: chip.color, background: chip.bg }}>
                          {chip.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AppShell>
  );
}

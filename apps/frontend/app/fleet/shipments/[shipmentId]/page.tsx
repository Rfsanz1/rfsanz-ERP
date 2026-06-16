'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../../lib/nav-configs';
import { ArrowLeft, RefreshCw, MapPin, User, Phone, Package } from 'lucide-react';

const C = FLEET_CONFIG.appColor;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  booked:     { label: 'Booked',           color: '#1565c0', bg: '#e3f2fd' },
  pickup:     { label: 'Menuju Pickup',    color: '#e65100', bg: '#fff3e0' },
  picked_up:  { label: 'Barang Diambil',   color: '#7b1fa2', bg: '#f3e5f5' },
  in_transit: { label: 'Dalam Perjalanan', color: '#f57c00', bg: '#fff8e1' },
  delivered:  { label: 'Terkirim',         color: '#2e7d32', bg: '#e8f5e9' },
  cancelled:  { label: 'Dibatalkan',       color: '#b71c1c', bg: '#ffebee' },
};

const SAMPLE_SHIP = {
  id: 'shp-001',
  referenceNumber: 'SHP-2026-001',
  status: 'in_transit',
  originCity: 'Jakarta', originState: 'DKI', originAddress: 'Jl. Sudirman No. 45',
  destinationCity: 'Bandung', destinationState: 'Jabar', destinationAddress: 'Jl. Merdeka No. 12',
  customerName: 'PT Maju Sejahtera', customerPhone: '021-5551234',
  driverName: 'Agus Salim', driverPhone: '08123456789',
  scheduledPickup: new Date(Date.now() - 3600000 * 3).toISOString(),
  scheduledDelivery: new Date(Date.now() + 3600000 * 5).toISOString(),
  totalWeight: 250,
  notes: 'Barang fragile, hati-hati saat bongkar muat.',
  stops: [
    { id: 'stop-1', type: 'pickup', locationName: 'Gudang Jakarta Pusat', city: 'Jakarta', status: 'completed', completedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'stop-2', type: 'delivery', locationName: 'Kantor Bandung', city: 'Bandung', status: 'pending' },
  ],
};

export default function ShipmentDetailPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const shipmentId = params?.shipmentId as string;

  const [ship, setShip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSample, setIsSample] = useState(false);

  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') : '');

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/shipments/${shipmentId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setShip(json.data);
    } catch {
      setShip(SAMPLE_SHIP);
      setIsSample(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (shipmentId) fetchData(); }, [shipmentId]);

  if (loading) return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#9e9e9e' }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${C}`, borderTopColor: 'transparent', borderRadius: 16, animation: 'spin .8s linear infinite' }} />
        Memuat data shipment...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );

  if (!ship) return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ padding: 24 }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C, fontSize: 14 }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e9e9e' }}>Shipment tidak ditemukan.</div>
      </div>
    </AppShell>
  );

  const chip = STATUS_MAP[ship.status] || { label: ship.status, color: '#757575', bg: '#f5f5f5' };

  return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', maxWidth: 900 }}>

        <button onClick={() => router.push('/fleet/shipments')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C, fontSize: 13, marginBottom: 20, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Kembali ke Daftar Shipment
        </button>

        {isSample && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#e65100', marginBottom: 20 }}>
            ⚠️ Menampilkan data contoh — hubungkan backend TMS untuk data nyata.
          </div>
        )}

        {/* Header card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#212121' }}>
                {ship.referenceNumber || `SHP-${ship.id.slice(0, 8).toUpperCase()}`}
              </h2>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, color: chip.color, background: chip.bg }}>{chip.label}</span>
            </div>
            <button onClick={fetchData} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Route */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <div style={{ background: '#fff3e0', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f57c00', marginBottom: 4 }}>PICKUP</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#212121' }}>{ship.originCity}{ship.originState ? `, ${ship.originState}` : ''}</div>
              {ship.originAddress && <div style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>{ship.originAddress}</div>}
            </div>
            <div style={{ textAlign: 'center', color: '#9e9e9e', fontSize: 20 }}>→</div>
            <div style={{ background: '#e3f2fd', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1565c0', marginBottom: 4 }}>TUJUAN</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#212121' }}>{ship.destinationCity}{ship.destinationState ? `, ${ship.destinationState}` : ''}</div>
              {ship.destinationAddress && <div style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>{ship.destinationAddress}</div>}
            </div>
          </div>

          {/* Info rows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: <User size={14} style={{ color: '#9e9e9e' }} />, label: 'Customer', value: ship.customerName },
              { icon: <Phone size={14} style={{ color: '#9e9e9e' }} />, label: 'Telp Customer', value: ship.customerPhone },
              { icon: <User size={14} style={{ color: '#9e9e9e' }} />, label: 'Driver', value: ship.driverName || 'Belum di-assign' },
              { icon: <Phone size={14} style={{ color: '#9e9e9e' }} />, label: 'Telp Driver', value: ship.driverPhone },
              { icon: <Package size={14} style={{ color: '#9e9e9e' }} />, label: 'Berat', value: ship.totalWeight ? `${ship.totalWeight} kg` : '-' },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {row.icon}
                <div>
                  <div style={{ fontSize: 10, color: '#9e9e9e', fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: '#212121', fontWeight: 500 }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          {ship.notes && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#f5f5f5', borderRadius: 10, fontSize: 13, color: '#555', borderLeft: '3px solid #e0e0e0' }}>
              <span style={{ fontWeight: 600 }}>Catatan: </span>{ship.notes}
            </div>
          )}
        </div>

        {/* Timeline stops */}
        {ship.stops && ship.stops.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600 }}>Timeline Pengiriman</h3>
            {ship.stops.map((stop: any, i: number) => {
              const done = stop.status === 'completed';
              return (
                <div key={stop.id} style={{ display: 'flex', gap: 16, paddingBottom: i < ship.stops.length - 1 ? 20 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: done ? '#e8f5e9' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${done ? '#2e7d32' : '#e0e0e0'}` }}>
                      <MapPin size={16} style={{ color: done ? '#2e7d32' : '#9e9e9e' }} />
                    </div>
                    {i < ship.stops.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: done ? '#2e7d32' : '#e0e0e0', marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < ship.stops.length - 1 ? 4 : 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: stop.type === 'pickup' ? '#f57c00' : '#1565c0', marginBottom: 2 }}>
                      {stop.type === 'pickup' ? 'PICKUP' : 'PENGIRIMAN'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#212121' }}>{stop.locationName || stop.city}</div>
                    {stop.completedAt && (
                      <div style={{ fontSize: 12, color: '#2e7d32', marginTop: 3 }}>
                        ✓ Selesai: {new Date(stop.completedAt).toLocaleString('id-ID')}
                      </div>
                    )}
                    {!done && stop.status === 'pending' && (
                      <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 3 }}>Menunggu...</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AppShell>
  );
}

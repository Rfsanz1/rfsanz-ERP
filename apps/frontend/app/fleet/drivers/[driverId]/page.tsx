'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../../lib/nav-configs';
import { ArrowLeft, Phone, Mail, Truck, Package, CheckCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';

const C = FLEET_CONFIG.appColor;

const STATUS_SHIP: Record<string, { label: string; color: string }> = {
  booked:     { label: 'Booked',           color: '#1565c0' },
  pickup:     { label: 'Menuju Pickup',    color: '#e65100' },
  picked_up:  { label: 'Barang Diambil',   color: '#7b1fa2' },
  in_transit: { label: 'Dalam Perjalanan', color: '#f57c00' },
  delivered:  { label: 'Terkirim',         color: '#388e3c' },
  cancelled:  { label: 'Dibatalkan',       color: '#b71c1c' },
};

const STATUS_DRIVER: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Tersedia',        color: '#2e7d32', bg: '#e8f5e9' },
  on_duty:   { label: 'Sedang Bertugas', color: '#1565c0', bg: '#e3f2fd' },
  off_duty:  { label: 'Tidak Bertugas',  color: '#757575', bg: '#f5f5f5' },
  inactive:  { label: 'Nonaktif',        color: '#b71c1c', bg: '#ffebee' },
};

const SAMPLE = {
  id: 'drv-001', name: 'Agus Salim', phone: '08123456789', email: 'agus@example.com',
  licenseNumber: 'B12345678', status: 'on_duty', carrierName: 'PT Gentong Mas',
  totalDeliveries: 47, onTimeRate: 92, activeLoads: 2,
  loads: [
    { id: 'ld-001', shipmentId: 'shp-001', referenceNumber: 'SHP-001', status: 'in_transit', originCity: 'Jakarta', destinationCity: 'Bandung', scheduledDelivery: new Date(Date.now() + 3600000 * 5).toISOString() },
    { id: 'ld-002', shipmentId: 'shp-002', referenceNumber: 'SHP-002', status: 'booked',     originCity: 'Bandung', destinationCity: 'Surabaya', scheduledDelivery: new Date(Date.now() + 3600000 * 28).toISOString() },
  ],
};

export default function DriverDetailPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const driverId = params?.driverId as string;

  const [driver, setDriver] = useState<any>(null);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSample, setIsSample] = useState(false);

  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') : '');

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/drivers/${driverId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setDriver(json.data);
      const loadsRes = await fetch(`/api/v1/drivers/${driverId}/loads`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (loadsRes.ok) {
        const loadsJson = await loadsRes.json();
        setLoads(loadsJson.data || []);
      }
    } catch {
      setDriver(SAMPLE);
      setLoads(SAMPLE.loads);
      setIsSample(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (driverId) fetchData(); }, [driverId]);

  if (loading) return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#9e9e9e' }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${C}`, borderTopColor: 'transparent', borderRadius: 16, animation: 'spin .8s linear infinite' }} />
        Memuat data driver...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppShell>
  );

  if (!driver) return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ padding: 24 }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C, fontSize: 14 }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e9e9e' }}>Driver tidak ditemukan.</div>
      </div>
    </AppShell>
  );

  const st = STATUS_DRIVER[driver.status || 'off_duty'] || STATUS_DRIVER.off_duty;
  const initials = driver.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const activeLoads = loads.filter(l => l.status !== 'delivered' && l.status !== 'cancelled');
  const doneLoads = loads.filter(l => l.status === 'delivered');

  return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', maxWidth: 900 }}>

        {/* Back */}
        <button onClick={() => router.push('/fleet/drivers')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C, fontSize: 13, marginBottom: 20, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Kembali ke Daftar Driver
        </button>

        {isSample && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#e65100', marginBottom: 20 }}>
            ⚠️ Menampilkan data contoh — hubungkan backend TMS untuk data nyata.
          </div>
        )}

        {/* Profile card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20, display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg, ${C}, ${C}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#212121' }}>{driver.name}</h2>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, color: st.color, background: st.bg }}>{st.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {driver.phone && (
                <a href={`tel:${driver.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', textDecoration: 'none' }}>
                  <Phone size={14} style={{ color: '#9e9e9e' }} /> {driver.phone}
                </a>
              )}
              {driver.email && (
                <a href={`mailto:${driver.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', textDecoration: 'none' }}>
                  <Mail size={14} style={{ color: '#9e9e9e' }} /> {driver.email}
                </a>
              )}
              {driver.carrierName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                  <Truck size={14} style={{ color: '#9e9e9e' }} /> {driver.carrierName}
                </div>
              )}
            </div>
            {driver.licenseNumber && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#9e9e9e' }}>SIM: {driver.licenseNumber}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <button onClick={fetchData} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: <Package size={18} style={{ color: '#1565c0' }} />, label: 'Tugas Aktif',     value: activeLoads.length, bg: '#e3f2fd' },
            { icon: <CheckCircle size={18} style={{ color: '#2e7d32' }} />, label: 'Total Selesai', value: driver.totalDeliveries || doneLoads.length, bg: '#e8f5e9' },
            { icon: <Clock size={18} style={{ color: '#f57c00' }} />,    label: 'On-Time Rate',   value: `${driver.onTimeRate || 0}%`, bg: '#fff3e0' },
          ].map(item => (
            <div key={item.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#212121', lineHeight: 1 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 3 }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Loads table */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Riwayat & Tugas Pengiriman</h3>
            <span style={{ fontSize: 12, color: '#9e9e9e' }}>{loads.length} total</span>
          </div>
          {loads.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9e9e9e', fontSize: 13 }}>
              Belum ada riwayat pengiriman
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Referensi', 'Rute', 'Jadwal', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#9e9e9e', textAlign: 'left', borderBottom: '1px solid #f5f5f5', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loads.map(load => {
                  const chip = STATUS_SHIP[load.status] || { label: load.status, color: '#757575' };
                  const origin = load.shipment?.originCity || load.originCity || 'N/A';
                  const dest = load.shipment?.destinationCity || load.destinationCity || 'N/A';
                  const scheduled = load.shipment?.scheduledDelivery || load.scheduledDelivery;
                  return (
                    <tr key={load.id}>
                      <td style={{ padding: '13px 16px', fontSize: 13, borderBottom: '1px solid #fafafa', fontWeight: 600 }}>
                        {load.shipment?.referenceNumber || load.referenceNumber || `SHP-${(load.shipmentId || load.id).slice(0, 8).toUpperCase()}`}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, borderBottom: '1px solid #fafafa' }}>
                        {origin} → {dest}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, borderBottom: '1px solid #fafafa', color: '#757575', whiteSpace: 'nowrap' }}>
                        {scheduled ? new Date(scheduled).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #fafafa' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: chip.color, background: chip.color + '18' }}>
                          {chip.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid #fafafa' }}>
                        <button
                          onClick={() => router.push(`/fleet/shipments/${load.shipmentId || load.id}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                        >
                          Detail <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AppShell>
  );
}

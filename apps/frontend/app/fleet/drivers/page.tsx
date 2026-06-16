'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../lib/nav-configs';
import { Search, Plus, UserCheck, Truck, Phone, Mail, RefreshCw } from 'lucide-react';

const C = FLEET_CONFIG.appColor;

interface Driver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  status?: string;
  carrierName?: string;
  activeLoads?: number;
  totalDeliveries?: number;
  createdAt?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: 'Tersedia',        color: '#2e7d32', bg: '#e8f5e9' },
  on_duty:     { label: 'Sedang Bertugas', color: '#1565c0', bg: '#e3f2fd' },
  off_duty:    { label: 'Tidak Bertugas',  color: '#757575', bg: '#f5f5f5' },
  inactive:    { label: 'Nonaktif',        color: '#b71c1c', bg: '#ffebee' },
};

const SAMPLE_DRIVERS: Driver[] = [
  { id: 'drv-001', name: 'Agus Salim',     phone: '08123456789', email: 'agus@example.com',  licenseNumber: 'B12345678', status: 'on_duty',   carrierName: 'PT Gentong Mas', activeLoads: 2, totalDeliveries: 47 },
  { id: 'drv-002', name: 'Budi Hartono',   phone: '08234567890', email: 'budi@example.com',  licenseNumber: 'B87654321', status: 'available', carrierName: 'PT Gentong Mas', activeLoads: 0, totalDeliveries: 31 },
  { id: 'drv-003', name: 'Deni Kurniawan', phone: '08345678901', email: 'deni@example.com',  licenseNumber: 'B11223344', status: 'available', carrierName: 'PT Gentong Mas', activeLoads: 0, totalDeliveries: 22 },
  { id: 'drv-004', name: 'Eko Prasetyo',   phone: '08456789012', email: 'eko@example.com',   licenseNumber: 'B55667788', status: 'on_duty',   carrierName: 'CV Mitra Jaya',  activeLoads: 1, totalDeliveries: 58 },
  { id: 'drv-005', name: 'Feri Susanto',   phone: '08567890123', email: 'feri@example.com',  licenseNumber: 'B99001122', status: 'off_duty',  carrierName: 'CV Mitra Jaya',  activeLoads: 0, totalDeliveries: 15 },
];

export default function FleetDriversPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('gm_auth_token') : '');

  async function fetchDrivers() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/drivers', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Backend TMS belum tersambung');
      const json = await res.json();
      setDrivers(json.data || []);
    } catch {
      setDrivers(SAMPLE_DRIVERS);
      setError('Menampilkan data contoh — hubungkan backend TMS untuk data nyata.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDrivers(); }, []);

  const filtered = drivers.filter(d => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.phone || '').includes(search) ||
      (d.carrierName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     drivers.length,
    on_duty:   drivers.filter(d => d.status === 'on_duty').length,
    available: drivers.filter(d => d.status === 'available').length,
    activeLoads: drivers.reduce((s, d) => s + (d.activeLoads || 0), 0),
  };

  return (
    <AppShell appConfig={FLEET_CONFIG} navItems={FLEET_NAV}>
      <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#212121' }}>Manajemen Driver</h1>
            <p style={{ margin: '4px 0 0', color: '#757575', fontSize: 13 }}>Kelola semua driver & pantau status dari portal driver</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchDrivers} style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => router.push('/fleet/drivers/new')}
              style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: C, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> Tambah Driver
            </button>
          </div>
        </div>

        {/* Info banner jika pakai data sample */}
        {error && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#e65100', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Driver',      value: stats.total,       color: C,        icon: '👤' },
            { label: 'Sedang Bertugas',   value: stats.on_duty,     color: '#1565c0', icon: '🚚' },
            { label: 'Tersedia',          value: stats.available,   color: '#2e7d32', icon: '✅' },
            { label: 'Tugas Aktif',       value: stats.activeLoads, color: '#f57c00', icon: '📦' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#212121', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, telepon, perusahaan..."
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">Semua Status</option>
            <option value="available">Tersedia</option>
            <option value="on_duty">Sedang Bertugas</option>
            <option value="off_duty">Tidak Bertugas</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {/* Driver list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e9e9e' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C}`, borderTopColor: 'transparent', borderRadius: 18, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Memuat data driver...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9e9e9e' }}>
            <UserCheck size={48} style={{ display: 'block', margin: '0 auto 12px', color: '#e0e0e0' }} />
            <div style={{ fontWeight: 500 }}>Tidak ada driver ditemukan</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map(driver => {
              const st = STATUS_MAP[driver.status || 'off_duty'] || STATUS_MAP.off_duty;
              const initials = driver.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div
                  key={driver.id}
                  onClick={() => router.push(`/fleet/drivers/${driver.id}`)}
                  style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow .15s', border: '1.5px solid transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; (e.currentTarget as HTMLDivElement).style.borderColor = C + '40'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${C}, ${C}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#212121', marginBottom: 3 }}>{driver.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, color: st.color, background: st.bg }}>{st.label}</span>
                    </div>
                    {(driver.activeLoads || 0) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#e3f2fd', borderRadius: 10, padding: '4px 10px', flexShrink: 0 }}>
                        <Truck size={12} style={{ color: '#1565c0' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1565c0' }}>{driver.activeLoads}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {driver.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                        <Phone size={13} style={{ color: '#9e9e9e', flexShrink: 0 }} />
                        {driver.phone}
                      </div>
                    )}
                    {driver.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                        <Mail size={13} style={{ color: '#9e9e9e', flexShrink: 0 }} />
                        {driver.email}
                      </div>
                    )}
                    {driver.carrierName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                        <Truck size={13} style={{ color: '#9e9e9e', flexShrink: 0 }} />
                        {driver.carrierName}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f5f5f5', fontSize: 12, color: '#9e9e9e' }}>
                    <span>SIM: {driver.licenseNumber || '-'}</span>
                    <span>{driver.totalDeliveries || 0} pengiriman</span>
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

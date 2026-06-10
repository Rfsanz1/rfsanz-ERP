'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { Bus, Plus, Wrench } from 'lucide-react';

const VEHICLES = [
  { id: 'B-1234-XYZ', type: 'Truck Engkel',  driver: 'Budi Prasetyo', status: 'active',     km: 48200, service: '15 Jun 2026' },
  { id: 'B-5678-ABC', type: 'Pickup L300',   driver: 'Deni Hendra',   status: 'active',     km: 32100, service: '20 Jun 2026' },
  { id: 'B-9012-DEF', type: 'Minibus',       driver: 'Eko Santoso',   status: 'service',    km: 61500, service: '24 Mei 2026' },
  { id: 'B-3456-GHI', type: 'Motor Kurir',   driver: '–',             status: 'idle',       km: 18300, service: '1 Jul 2026' },
];

export default function HrFleetPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/fleet">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Armada Kendaraan</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola kendaraan operasional perusahaan</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: HR_CONFIG.appColor }}><Plus className="h-4 w-4" /> Tambah Kendaraan</button>
        </div>
        <div className="grid gap-4">
          {VEHICLES.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl p-5 flex items-center justify-between" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(194,24,91,.1)' }}>
                  {v.status === 'service' ? <Wrench className="h-5 w-5" style={{ color: '#FF9800' }} /> : <Bus className="h-5 w-5" style={{ color: HR_CONFIG.appColor }} />}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{v.id}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{v.type} · Driver: {v.driver}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: '#1E1B4B' }}>{v.km.toLocaleString()} km</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Odometer</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{v.service}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Service berikutnya</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{
                  color: v.status === 'active' ? '#4CAF50' : v.status === 'service' ? '#FF9800' : '#9CA3AF',
                  backgroundColor: v.status === 'active' ? 'rgba(76,175,80,.1)' : v.status === 'service' ? 'rgba(255,152,0,.1)' : 'rgba(165,163,174,.12)',
                }}>
                  {v.status === 'active' ? 'Aktif' : v.status === 'service' ? 'Servis' : 'Idle'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

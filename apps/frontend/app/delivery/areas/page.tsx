'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { DELIVERY_CONFIG, DELIVERY_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { MapPin, Plus } from 'lucide-react';

export default function DeliveryAreasPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  useEffect(() => {
    if (token) api.get('/driver-areas').then(r => setAreas(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);
  if (!token) return null;

  return (
    <AppShell {...DELIVERY_CONFIG} navItems={DELIVERY_NAV} activeHref="/delivery/areas">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Wilayah Pengiriman</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola zona dan jadwal pengiriman</p></div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: DELIVERY_CONFIG.appColor }}><Plus className="h-4 w-4" /> Tambah Wilayah</button>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          {loading ? <p className="p-6 text-sm" style={{ color: '#9CA3AF' }}>Memuat...</p>
          : areas.length === 0 ? <p className="p-6 text-sm" style={{ color: '#9CA3AF' }}>Belum ada wilayah terdaftar</p>
          : areas.map((a: any, i: number) => (
            <div key={a.id} className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: i < areas.length - 1 ? '1px solid #F5F2FB' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(21,101,192,.1)' }}><MapPin className="h-4 w-4" style={{ color: '#1565C0' }} /></div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{a.wilayah}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Driver: {a.driver || '–'} · Jadwal: {a.jadwal || '–'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

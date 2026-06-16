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
  const router    = useRouter();
  const [areas, setAreas]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) api.get('/driver-areas').then(r => setAreas(r.data ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);


  return (
    <AppShell {...DELIVERY_CONFIG} navItems={DELIVERY_NAV} activeHref="/delivery/areas">
      <div style={{ maxWidth: 800 }} className="space-y-5">

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Wilayah Pengiriman</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola zona dan jadwal pengiriman</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: DELIVERY_CONFIG.appColor, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Wilayah
          </button>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat…</p>
          ) : areas.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <MapPin size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              Belum ada wilayah terdaftar
            </div>
          ) : areas.map((a: any, i: number) => (
            <div key={a.id} className="flex items-center justify-between"
              style={{ padding: '14px 20px', borderBottom: i < areas.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(21,101,192,0.10)' }}>
                  <MapPin size={15} style={{ color: '#1565C0' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{a.wilayah}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Driver: {a.driver || '–'} · Jadwal: {a.jadwal || '–'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import DriverBottomNav from '@/components/DriverBottomNav';
import { User, Phone, Mail, Truck, LogOut, Star, Package, MapPin } from 'lucide-react';

const C = '#475569';

export default function DriverProfilePage() {
  const { token, user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.replace('/dashboard'); };
  if (!token || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-sunken)', paddingBottom: 80, maxWidth: 430, margin: '0 auto', fontFamily: 'Inter,sans-serif' }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,#334155,${C})`, padding: '28px 20px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,.06)' }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(255,255,255,.3),rgba(255,255,255,.1))', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 800, color: '#fff' }}>
            {(user.name || 'D').charAt(0).toUpperCase()}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{user.name || 'Driver'}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', margin: 0 }}>Driver · Gentong Mas</p>
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: -48 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Kirim', value: '142', icon: Package },
            { label: 'Rating',     value: '4.8', icon: Star },
            { label: 'Kota',       value: 'JKT',  icon: MapPin },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, border: '1.5px solid var(--border)', padding: '14px 10px', textAlign: 'center', boxShadow: '0 4px 14px rgba(71,85,105,.08)' }}>
              <s.icon size={16} style={{ color: C, margin: '0 auto 6px', display: 'block' }} />
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1.5px solid var(--border)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Informasi Akun</p>
          </div>
          {[
            { icon: User,  label: 'Nama',      value: user.name || '–' },
            { icon: Mail,  label: 'Email',     value: user.email || '–' },
            { icon: Phone, label: 'Telepon',   value: (user as any).phone || '–' },
            { icon: Truck, label: 'Kendaraan', value: (user as any).vehicleNumber || 'B 1234 XYZ' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon size={14} style={{ color: C }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 1px', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</p>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleLogout}
          style={{ width: '100%', height: 52, borderRadius: 14, border: '1.5px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#DC2626', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={16} /> Keluar dari Akun
        </button>
      </div>
      <DriverBottomNav />
    </div>
  );
}

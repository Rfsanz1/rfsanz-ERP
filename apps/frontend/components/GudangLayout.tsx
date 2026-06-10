'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  Package, ArrowDownRight, ArrowUpRight, ClipboardList,
  ClipboardCheck, ArrowLeftRight, Clock, Bell, LogOut,
  Menu, X, Home, Search,
} from 'lucide-react';

const C = {
  primary:   '#D97706',
  dark:      '#78350F',
  bg:        '#FFFBEB',
  border:    '#FEF3C7',
  textMid:   '#6B7280',
  textLight: '#9CA3AF',
  sidebar1:  '#D97706',
  sidebar2:  '#B45309',
};

const NAV = [
  { href: '/gudang',              label: 'Dashboard',    icon: Home },
  { href: '/gudang/picking',      label: 'Picking Order', icon: ClipboardList },
  { href: '/gudang/inbound',      label: 'Barang Masuk',  icon: ArrowDownRight },
  { href: '/gudang/outbound',     label: 'Barang Keluar', icon: ArrowUpRight },
  { href: '/gudang/transfer',     label: 'Transfer Stok', icon: ArrowLeftRight },
  { href: '/gudang/stock-opname', label: 'Stock Opname',  icon: ClipboardCheck },
  { href: '/gudang/products',     label: 'Cek Stok',      icon: Search },
  { href: '/gudang/history',      label: 'Riwayat',       icon: Clock },
];

interface GudangLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function GudangLayout({ children, title, subtitle }: GudangLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout, loadProfile } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      const stored = localStorage.getItem('erp_token');
      if (!stored) { router.replace('/dashboard'); return; }
      useAuthStore.getState().rehydrate();
      return;
    }
    if (!user) loadProfile().catch(() => { logout(); router.replace('/dashboard'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => { logout(); router.replace('/dashboard'); };

  const hasToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('erp_token') : null);
  if (!hasToken) return null;

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      backgroundColor: C.bg, opacity: mounted ? 1 : 0, transition: 'opacity .3s',
    }}>
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,.45)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {sidebarOpen && (
        <aside style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50, width: 240,
          background: `linear-gradient(180deg,${C.sidebar1} 0%,${C.sidebar2} 100%)`,
          display: 'flex', flexDirection: 'column',
        }}>
          <SidebarContents nav={NAV} pathname={pathname ?? ''} user={user}
            onNav={h => { router.push(h); setSidebarOpen(false); }}
            onLogout={handleLogout} onClose={() => setSidebarOpen(false)} />
        </aside>
      )}

      <aside style={{
        width: 224, flexShrink: 0,
        background: `linear-gradient(180deg,${C.sidebar1} 0%,${C.sidebar2} 100%)`,
        display: 'flex', flexDirection: 'column',
      }} className="gm-gudang-sidebar">
        <style>{`.gm-gudang-sidebar{display:flex!important}@media(max-width:1023px){.gm-gudang-sidebar{display:none!important}}`}</style>
        <SidebarContents nav={NAV} pathname={pathname ?? ''} user={user}
          onNav={h => router.push(h)} onLogout={handleLogout} />
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{
          height: 60, backgroundColor: '#fff',
          borderBottom: `2px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', flexShrink: 0,
          boxShadow: '0 1px 8px rgba(217,119,6,.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="gm-gudang-menu" onClick={() => setSidebarOpen(true)}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer', color: C.textMid }}>
              <style>{`.gm-gudang-menu{display:flex!important}@media(min-width:1024px){.gm-gudang-menu{display:none!important}}`}</style>
              <Menu size={20} />
            </button>
            <div>
              {title && <h1 style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: 0, lineHeight: 1.2 }}>{title}</h1>}
              {subtitle && <p style={{ fontSize: 12, color: C.textLight, margin: 0 }}>{subtitle}</p>}
              {!title && <span style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>Gudang</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${C.border}`, borderRadius: 10, background: 'none', cursor: 'pointer', color: C.textMid }}>
              <Bell size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, backgroundColor: `${C.primary}12`, border: `1px solid ${C.border}` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${C.primary},#FBBF24)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                {(user?.name || 'G').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{user?.name?.split(' ')[0] || 'Staff'}</span>
            </div>
            <button onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 14px', border: 'none', borderRadius: 10, backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContents({ nav, pathname, user, onNav, onLogout, onClose }: {
  nav: typeof NAV; pathname: string;
  user: { name?: string; email?: string } | null;
  onNav: (h: string) => void; onLogout: () => void; onClose?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,.15)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>G</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Gudang</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', margin: 0 }}>Gentong Mas ERP</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.18)', borderRadius: 7, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {nav.map(item => {
          const isActive = item.href === '/gudang'
            ? pathname === '/gudang'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <button key={item.href} onClick={() => onNav(item.href)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                textAlign: 'left', marginBottom: 2, minHeight: 46,
                backgroundColor: isActive ? 'rgba(255,255,255,.25)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,.75)',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,.12)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              <item.icon size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, flex: 1 }}>{item.label}</span>
              {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {(user?.name || 'G').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>{user?.name || 'Staff Gudang'}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.65)', backgroundColor: 'transparent', minHeight: 44 }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.1)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={14} /><span style={{ fontSize: 14, fontWeight: 500 }}>Keluar</span>
        </button>
      </div>
    </div>
  );
}

export default GudangLayout;

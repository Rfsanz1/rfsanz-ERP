'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  ShoppingCart, FileText, Users,
  Zap, Bell, LogOut, Home, Menu, X,
  Star, Phone, LayoutGrid, BarChart2, Settings, CreditCard,
} from 'lucide-react';

const C = {
  primary:      '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark:  '#5B21B6',
  bg:           '#F5F3FF',
  sidebar:      '#7C3AED',
  border:       '#EDE9FE',
  textDark:     '#1E1B4B',
  textMid:      '#6B7280',
  textLight:    '#9CA3AF',
};

const NAV = [
  { href: '/sales',               label: 'Dashboard',    icon: Home },
  { href: '/sales/smart-order',   label: 'Smart Order',  icon: Zap },
  { href: '/sales/quotations',    label: 'Quotation',    icon: FileText },
  { href: '/sales/orders',        label: 'Sales Order',  icon: ShoppingCart },
  { href: '/sales/faktur',        label: 'Faktur',       icon: CreditCard },
  { href: '/sales/customers',     label: 'Pelanggan',    icon: Users },
  { href: '/sales/crm/pipeline',  label: 'Pipeline CRM', icon: LayoutGrid },
  { href: '/sales/crm/leads',     label: 'Leads',        icon: Star },
  { href: '/sales/crm/activities',label: 'Aktivitas',    icon: Phone },
  { href: '/sales/reports',       label: 'Laporan',      icon: BarChart2 },
];

interface SalesLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function SalesLayout({ children, title, subtitle }: SalesLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout, loadProfile } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Jika token belum ada di store, coba rehydrate dari localStorage (sinkron)
    if (!token) {
      const stored = localStorage.getItem('erp_token');
      if (!stored) { router.replace('/dashboard'); return; }
      useAuthStore.getState().rehydrate(); // sinkron, langsung update store
      return;
    }
    if (!user) loadProfile().catch(() => { logout(); router.replace('/dashboard'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => { logout(); router.replace('/dashboard'); };

  // Cek localStorage langsung agar tidak flicker saat store belum rehydrate
  const hasToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('erp_token') : null);
  if (!hasToken) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: C.bg, opacity: mounted ? 1 : 0, transition: 'opacity .3s' }}>
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,.4)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {sidebarOpen && (
        <aside style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50, width: 220,
          background: `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          display: 'flex', flexDirection: 'column',
        }}>
          <SidebarContents nav={NAV} pathname={pathname ?? ''} user={user}
            onNav={h => { router.push(h); setSidebarOpen(false); }}
            onLogout={handleLogout} onClose={() => setSidebarOpen(false)} />
        </aside>
      )}

      <aside style={{
        width: 220, flexShrink: 0,
        background: `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
        display: 'flex', flexDirection: 'column',
      }} className="gm-sales-sidebar">
        <style>{`.gm-sales-sidebar{display:flex!important}@media(max-width:1023px){.gm-sales-sidebar{display:none!important}}`}</style>
        <SidebarContents nav={NAV} pathname={pathname ?? ''} user={user}
          onNav={h => router.push(h)} onLogout={handleLogout} />
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{
          height: 56, backgroundColor: '#fff',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', flexShrink: 0,
          boxShadow: '0 1px 8px rgba(124,58,237,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="gm-sales-menu" onClick={() => setSidebarOpen(true)}
              style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: C.textMid }}>
              <style>{`.gm-sales-menu{display:flex!important}@media(min-width:1024px){.gm-sales-menu{display:none!important}}`}</style>
              <Menu size={20} />
            </button>
            <div>
              {title && <h1 style={{ fontSize: 14, fontWeight: 700, color: C.textDark, margin: 0, lineHeight: 1.2 }}>{title}</h1>}
              {subtitle && <p style={{ fontSize: 11, color: C.textLight, margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: C.textMid }}>
              <Bell size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 10, backgroundColor: `${C.primary}10` }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textDark }}>{user?.name?.split(' ')[0] || 'Sales'}</span>
            </div>
            <button onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: 'none', borderRadius: 8, backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContents({
  nav, pathname, user, onNav, onLogout, onClose,
}: {
  nav: typeof NAV; pathname: string;
  user: { name?: string; email?: string } | null;
  onNav: (h: string) => void; onLogout: () => void; onClose?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px', borderBottom: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>S</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Sales</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', margin: 0 }}>Gentong Mas ERP</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.15)', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={13} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {nav.map(item => {
          const isActive = item.href === '/sales'
            ? pathname === '/sales'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <button key={item.href} onClick={() => onNav(item.href)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                textAlign: 'left', marginBottom: 2,
                backgroundColor: isActive ? 'rgba(255,255,255,.22)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,.72)',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,.1)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              <item.icon size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, flex: 1 }}>{item.label}</span>
              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff', flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {(user?.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{user?.name || 'Sales'}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.6)', backgroundColor: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.08)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={13} /><span style={{ fontSize: 12.5, fontWeight: 500 }}>Keluar</span>
        </button>
      </div>
    </div>
  );
}

export default SalesLayout;

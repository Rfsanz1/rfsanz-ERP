'use client';
import React, { useState } from 'react';
import { Home, LogOut, ChevronLeft, Menu, X, Bell } from 'lucide-react';

export interface NavChild { label: string; href: string; }
export interface NavItem {
  label: string; href: string; icon: React.ElementType;
  badge?: number; children?: NavChild[];
}

interface AppShellProps {
  appName: string; appColor: string; appGradient: string;
  appIcon: React.ElementType; navItems: NavItem[];
  children: React.ReactNode; activeHref?: string;
  userName?: string; userEmail?: string;
  onNavigate: (href: string) => void;
  onHome: () => void;
  onLogout: () => void;
}

function SidebarContent({
  appName, appIcon: AppIcon, navItems, activeHref, expandedItem, setExpandedItem,
  onNavigate, onClose, onHome, onLogout, userName, userEmail,
}: {
  appName: string; appIcon: React.ElementType; navItems: NavItem[];
  activeHref?: string; expandedItem: string | null;
  setExpandedItem: (v: string | null) => void;
  onNavigate: (href: string) => void; onClose?: () => void;
  onHome: () => void; onLogout: () => void;
  userName: string; userEmail: string;
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px', borderBottom:'1px solid rgba(255,255,255,.12)' }}>
        <div style={{ width:36, height:36, borderRadius:10, backgroundColor:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <AppIcon style={{ width:18, height:18, color:'#fff' }} />
        </div>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#fff', margin:0, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{appName}</p>
          <p style={{ fontSize:10, color:'rgba(255,255,255,.55)', margin:0 }}>Gentong Mas ERP</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft:'auto', background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, padding:6, cursor:'pointer', color:'#fff', display:'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      <nav style={{ flex:1, overflowY:'auto', padding:'12px 8px' }}>
        {navItems.map((item) => {
          const isActive = activeHref === item.href || activeHref?.startsWith(item.href + '/');
          const isExpanded = expandedItem === item.href;
          const hasChildren = item.children && item.children.length > 0;
          return (
            <div key={item.href}>
              <button
                onClick={() => { if (hasChildren) setExpandedItem(isExpanded ? null : item.href); else { onNavigate(item.href); onClose?.(); } }}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderRadius:10, border:'none', cursor:'pointer', textAlign:'left', transition:'all .15s',
                  backgroundColor: isActive ? 'rgba(255,255,255,.2)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,.75)',
                }}
              >
                <item.icon style={{ width:15, height:15, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span style={{ backgroundColor:'rgba(255,255,255,.25)', color:'#fff', borderRadius:100, fontSize:10, fontWeight:700, padding:'2px 6px' }}>{item.badge}</span>
                )}
                {hasChildren && <ChevronLeft style={{ width:12, height:12, flexShrink:0, transform: isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)', transition:'transform .2s' }} />}
              </button>
              {hasChildren && isExpanded && (
                <div style={{ marginLeft:16, paddingLeft:12, borderLeft:'1px solid rgba(255,255,255,.15)' }}>
                  {item.children!.map((child) => (
                    <button key={child.href} onClick={() => { onNavigate(child.href); onClose?.(); }}
                      style={{ width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12.5, color:'rgba(255,255,255,.65)', backgroundColor:'transparent', transition:'all .15s' }}>
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding:12, borderTop:'1px solid rgba(255,255,255,.1)' }}>
        <button onClick={onHome} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', color:'rgba(255,255,255,.7)', backgroundColor:'transparent', transition:'all .15s' }}>
          <Home size={15} /><span style={{ fontSize:13, fontWeight:500 }}>Beranda</span>
        </button>
        <button onClick={onLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', color:'rgba(255,255,255,.55)', backgroundColor:'transparent', transition:'all .15s' }}>
          <LogOut size={15} /><span style={{ fontSize:13, fontWeight:500 }}>Keluar</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', marginTop:4 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', backgroundColor:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, flexShrink:0 }}>
            {(userName || 'U').charAt(0).toUpperCase()
          }</div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName || 'User'}</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,.5)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ appName, appColor, appGradient, appIcon, navItems, children, activeHref, userName = '', userEmail = '', onNavigate, onHome, onLogout }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const sidebarProps = { appName, appIcon, navItems, activeHref, expandedItem, setExpandedItem, onNavigate, onHome, onLogout, userName, userEmail };
  const sidebarBg = `linear-gradient(180deg, ${appColor} 0%, ${appColor}dd 100%)`;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', backgroundColor:'#F5F4F9' }}>
      <aside style={{ display:'none', width:224, flexShrink:0, background:sidebarBg }} className="gm-sidebar-desktop">
        <SidebarContent {...sidebarProps} />
      </aside>
      <style>{`.gm-sidebar-desktop { display: flex; flex-direction: column; } @media (max-width: 1023px) { .gm-sidebar-desktop { display: none !important; } }`}</style>

      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }}>
          <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,.4)' }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ position:'relative', display:'flex', flexDirection:'column', width:256, height:'100%', zIndex:10, background:sidebarBg }}>
            <SidebarContent {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', flex:1, minWidth:0, overflow:'hidden' }}>
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:56, flexShrink:0, backgroundColor:'#fff', borderBottom:'1px solid #EDE8F5', boxShadow:'0 1px 0 rgba(47,43,61,.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="gm-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display:'none', padding:8, borderRadius:8, border:'none', cursor:'pointer', color:'#9CA3AF', backgroundColor:'transparent' }}>
              <Menu size={20} />
            </button>
            <style>{`.gm-menu-btn { display: flex !important; } @media (min-width: 1024px) { .gm-menu-btn { display: none !important; } }`}</style>
            <button onClick={onHome} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:500, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer' }}>
              <Home size={14} />Beranda
            </button>
            <span style={{ color:'#D4CDE0' }}>/</span>
            <span style={{ fontSize:12, fontWeight:600, color:appColor }}>{appName}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button style={{ padding:8, borderRadius:8, border:'none', cursor:'pointer', color:'#9CA3AF', backgroundColor:'transparent' }}>
              <Bell size={18} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', border:'1px solid #EDE8F5', borderRadius:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', backgroundColor:appColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>
                {(userName || 'A').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:'#1E1B4B' }}>{userName || 'Admin'}</span>
            </div>
          </div>
        </header>
        <main style={{ flex:1, overflowY:'auto' }}>{children}</main>
      </div>
    </div>
  );
}

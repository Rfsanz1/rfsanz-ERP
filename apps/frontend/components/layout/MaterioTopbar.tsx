'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import InputBase from '@mui/material/InputBase';
import Avatar from '@mui/material/Avatar';
import {
  Menu as MenuIcon, Search, Bell, Settings, HelpCircle,
  LogOut, User, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useNotificationStore } from '../../lib/store/useNotificationStore';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './MaterioSidebar';

interface TopbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

export function MaterioTopbar({ onToggleSidebar, onToggleMobileSidebar }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [query, setQuery]       = useState('');
  const [userAnchor, setUA]     = useState<null | HTMLElement>(null);
  const [notifAnchor, setNA]    = useState<null | HTMLElement>(null);

  const unread = notifications?.length ?? 0;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 99,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 16px',
        height: 64,
        flexShrink: 0,
      }}
    >
      {/* Hamburger — desktop */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex"
        style={{
          width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-light)'; (e.currentTarget as HTMLElement).style.color = '#6366F1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        <MenuIcon size={17} strokeWidth={2} />
      </button>

      {/* Hamburger — mobile */}
      <button
        onClick={onToggleMobileSidebar}
        className="flex lg:hidden"
        style={{
          width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
          alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        <MenuIcon size={17} strokeWidth={2} />
      </button>

      {/* Search */}
      <div
        className="hidden md:flex"
        style={{
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-sunken)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '0 12px',
          height: 38,
          width: 280,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onFocus={() => {}}
      >
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <InputBase
          placeholder="Cari menu, modul, data…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          fullWidth
          sx={{
            fontSize: '0.8125rem',
            color: 'var(--text-primary)',
            '& input::placeholder': { color: 'var(--text-muted)', opacity: 1 },
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        {/* Help */}
        <button
          className="hidden sm:flex"
          style={{
            width: 36, height: 36, borderRadius: 9, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-light)'; (e.currentTarget as HTMLElement).style.color = '#6366F1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <HelpCircle size={18} strokeWidth={1.8} />
        </button>

        {/* Settings */}
        <button
          className="hidden sm:flex"
          style={{
            width: 36, height: 36, borderRadius: 9, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-light)'; (e.currentTarget as HTMLElement).style.color = '#6366F1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <Settings size={18} strokeWidth={1.8} />
        </button>

        {/* Notif */}
        <button
          onClick={e => { setNA(e.currentTarget); setUA(null); }}
          style={{
            width: 36, height: 36, borderRadius: 9, border: 'none',
            background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            position: 'relative',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-light)'; (e.currentTarget as HTMLElement).style.color = '#6366F1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <Bell size={18} strokeWidth={1.8} />
          {unread > 0 && (
            <span
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: '#EF4444',
                border: '2px solid var(--surface)',
              }}
            />
          )}
        </button>

        {/* Divider */}
        <div className="hidden sm:block" style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        {/* User */}
        <button
          onClick={e => { setUA(e.currentTarget); setNA(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px 5px 5px', borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-sunken)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <div
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 12, color: '#fff',
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="hidden sm:block" style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.name ?? 'Admin'}
            </p>
            <p style={{ margin: 0, fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1, marginTop: 1 }}>
              {Array.isArray(user?.roles) ? user?.roles[0] : 'Administrator'}
            </p>
          </div>
          <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} className="hidden sm:block" />
        </button>
      </div>

      {/* ── Notification popover ──────────────────────────────────────── */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNA(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 320, mt: 1 } } }}
      >
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Notifikasi</span>
          {unread > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(239,68,68,0.10)', color: '#EF4444' }}>
              {unread} baru
            </span>
          )}
        </div>
        <Divider />
        {unread === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Bell size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Tidak ada notifikasi baru</p>
          </div>
        ) : (
          <List dense disablePadding>
            {[...Array(Math.min(unread, 4))].map((_, i) => (
              <ListItem key={i} divider sx={{ gap: 1, py: 1.25, px: 2, cursor: 'pointer', '&:hover': { background: 'var(--brand-hover)' } }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 34, height: 34, background: 'rgba(99,102,241,0.10)', color: '#6366F1', fontSize: 14 }}>
                    <Bell size={15} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Update sistem</span>}
                  secondary={<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Baru saja</span>}
                />
              </ListItem>
            ))}
          </List>
        )}
        <Divider />
        <div style={{ padding: 8, textAlign: 'center' }}>
          <Button size="small" sx={{ fontSize: 12, color: '#6366F1', fontWeight: 600 }}>
            Lihat semua notifikasi
          </Button>
        </div>
      </Popover>

      {/* ── User menu popover ─────────────────────────────────────────── */}
      <Popover
        open={Boolean(userAnchor)}
        anchorEl={userAnchor}
        onClose={() => setUA(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 210, mt: 1 } } }}
      >
        <div style={{ padding: '14px 18px', background: 'var(--brand-light)' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name ?? 'Admin'}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{user?.email ?? 'admin@example.com'}</p>
        </div>
        <Divider />
        <MenuList sx={{ py: 0.5 }}>
          {[
            { label: 'Profil Saya',  Icon: User     },
            { label: 'Pengaturan',   Icon: Settings  },
            { label: 'Bantuan',      Icon: HelpCircle},
          ].map(({ label, Icon }) => (
            <MenuItem
              key={label}
              sx={{
                gap: 1.5, py: 1, fontSize: 13, color: 'var(--text-primary)',
                '&:hover': { background: 'var(--brand-light)', color: '#6366F1' },
              }}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </MenuItem>
          ))}
        </MenuList>
        <Divider />
        <MenuList sx={{ py: 0.5 }}>
          <MenuItem
            onClick={logout}
            sx={{
              gap: 1.5, py: 1, fontSize: 13, color: '#EF4444',
              '&:hover': { background: 'rgba(239,68,68,0.06)' },
            }}
          >
            <LogOut size={15} strokeWidth={2} />
            Keluar
          </MenuItem>
        </MenuList>
      </Popover>
    </header>
  );
}

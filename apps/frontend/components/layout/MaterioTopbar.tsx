'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Avatar from '@mui/material/Avatar';
import {
  Menu as MenuIcon, Search, Bell, Settings, HelpCircle,
  Sun, Moon,
} from 'lucide-react';
import { useNotificationStore } from '../../lib/store/useNotificationStore';
import { useThemeMode } from '../../lib/theme/ThemeContext';

interface TopbarProps {
  collapsed: boolean;
  onToggleMobileSidebar: () => void;
}

export function MaterioTopbar({ onToggleMobileSidebar }: TopbarProps) {
  const { notifications } = useNotificationStore();
  const { mode, toggle: toggleTheme } = useThemeMode();
  const [query, setQuery]    = useState('');
  const [notifAnchor, setNA] = useState<null | HTMLElement>(null);

  const unread = notifications?.length ?? 0;
  const isDark = mode === 'dark';

  const iconBtnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 9, border: 'none',
    background: 'transparent', cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', flexShrink: 0,
  };

  function hoverOn(e: React.MouseEvent<HTMLButtonElement>) {
    (e.currentTarget as HTMLElement).style.background = 'var(--brand-light)';
    (e.currentTarget as HTMLElement).style.color = '#6366F1';
  }
  function hoverOff(e: React.MouseEvent<HTMLButtonElement>) {
    (e.currentTarget as HTMLElement).style.background = 'transparent';
    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
  }

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 99,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 16px', height: 64, flexShrink: 0,
      }}
    >
      {/* Hamburger — hanya untuk mobile, disembunyikan di desktop via MUI sx */}
      <Box sx={{ display: 'block', '@media (min-width: 1024px)': { display: 'none' }, flexShrink: 0 }}>
        <button
          onClick={onToggleMobileSidebar}
          style={{ ...iconBtnStyle, border: '1px solid var(--border)' }}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <MenuIcon size={17} strokeWidth={2} />
        </button>
      </Box>

      {/* Search */}
      <div
        className="hidden md:flex"
        style={{
          alignItems: 'center', gap: 8,
          background: 'var(--surface-sunken)',
          border: '1px solid var(--border)',
          borderRadius: 10, padding: '0 12px',
          height: 38, width: 280, flexShrink: 0,
        }}
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

        {/* ☀️ / 🌙 Dark/Light toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          style={iconBtnStyle}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          {isDark
            ? <Sun size={18} strokeWidth={1.8} />
            : <Moon size={18} strokeWidth={1.8} />}
        </button>

        {/* Help */}
        <button
          className="hidden sm:flex"
          style={iconBtnStyle}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <HelpCircle size={18} strokeWidth={1.8} />
        </button>

        {/* Settings */}
        <button
          className="hidden sm:flex"
          style={iconBtnStyle}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <Settings size={18} strokeWidth={1.8} />
        </button>

        {/* Notif */}
        <button
          onClick={e => { setNA(e.currentTarget); }}
          style={{ ...iconBtnStyle, position: 'relative' }}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <Bell size={18} strokeWidth={1.8} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: '#EF4444', border: '2px solid var(--surface)',
            }} />
          )}
        </button>

      </div>

      {/* ── Notification popover ─────────────────────────────────── */}
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

    </header>
  );
}

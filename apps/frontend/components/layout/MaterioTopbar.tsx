'use client';

import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Search,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useNotificationStore } from '../../lib/store/useNotificationStore';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './MaterioSidebar';

interface MaterioTopbarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

export function MaterioTopbar({ collapsed, onToggleSidebar, onToggleMobileSidebar }: MaterioTopbarProps) {
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const unreadCount = notifications?.length ?? 0;
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        width: { lg: `calc(100% - 0px)` },
        zIndex: 99,
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 }, gap: 1 }}>
        {/* Desktop sidebar toggle */}
        <Tooltip title="Toggle menu">
          <IconButton
            onClick={onToggleSidebar}
            size="small"
            sx={{
              display: { xs: 'none', lg: 'flex' },
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha('#7367F0', 0.08) },
            }}
          >
            <MenuIcon size={20} />
          </IconButton>
        </Tooltip>

        {/* Mobile sidebar toggle */}
        <Tooltip title="Menu">
          <IconButton
            onClick={onToggleMobileSidebar}
            size="small"
            sx={{
              display: { xs: 'flex', lg: 'none' },
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha('#7367F0', 0.08) },
            }}
          >
            <MenuIcon size={20} />
          </IconButton>
        </Tooltip>

        {/* Search */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            bgcolor: alpha('#7367F0', 0.05),
            border: '1px solid',
            borderColor: alpha('#7367F0', 0.12),
            borderRadius: '8px',
            px: 1.5,
            py: 0.5,
            gap: 1,
            width: 300,
            transition: 'all 0.2s',
            '&:focus-within': {
              bgcolor: '#fff',
              borderColor: '#7367F0',
              boxShadow: `0 0 0 3px ${alpha('#7367F0', 0.12)}`,
            },
          }}
        >
          <Search size={16} color="#A5A3AE" style={{ flexShrink: 0 }} />
          <InputBase
            placeholder="Cari menu, modul, data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ fontSize: '0.875rem', color: 'text.primary', '& input::placeholder': { color: '#A5A3AE' } }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Help */}
          <Tooltip title="Bantuan">
            <IconButton
              size="small"
              sx={{
                color: 'text.secondary',
                display: { xs: 'none', sm: 'flex' },
                '&:hover': { bgcolor: alpha('#7367F0', 0.08), color: '#7367F0' },
              }}
            >
              <HelpCircle size={20} />
            </IconButton>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Pengaturan">
            <IconButton
              size="small"
              sx={{
                color: 'text.secondary',
                display: { xs: 'none', sm: 'flex' },
                '&:hover': { bgcolor: alpha('#7367F0', 0.08), color: '#7367F0' },
              }}
            >
              <Settings size={20} />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifikasi">
            <IconButton
              size="small"
              onClick={(e) => { setNotifAnchor(e.currentTarget); setUserAnchor(null); }}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha('#7367F0', 0.08), color: '#7367F0' },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
              >
                <Bell size={20} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

          {/* User menu */}
          <Box
            onClick={(e) => { setUserAnchor(e.currentTarget); setNotifAnchor(null); }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              px: 1,
              py: 0.5,
              borderRadius: '8px',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: alpha('#7367F0', 0.08) },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #7367F0, #CE9FFC)',
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}
            >
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#433C50', lineHeight: 1.2 }}>
                {user?.name ?? 'Admin'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#A5A3AE', lineHeight: 1 }}>
                {Array.isArray(user?.roles) ? user?.roles[0] : 'Administrator'}
              </Typography>
            </Box>
            <ChevronDown size={14} color="#A5A3AE" style={{ display: 'none' }} className="hidden sm:block" />
          </Box>
        </Box>
      </Toolbar>

      {/* Notifications popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              mt: 1,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(47,43,61,0.16)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#433C50' }}>Notifikasi</Typography>
          <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
            <Bell size={14} color="#A5A3AE" />
          </Badge>
        </Box>
        <Divider />
        {unreadCount === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Tidak ada notifikasi baru</Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {[...Array(Math.min(unreadCount, 4))].map((_, i) => (
              <ListItem key={i} divider sx={{ '&:hover': { bgcolor: alpha('#7367F0', 0.04) }, cursor: 'pointer' }}>
                <ListItemAvatar>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#7367F0', 0.12) }}>
                    <Bell size={16} color="#7367F0" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 500, color: '#433C50' }}>Update sistem</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">Baru saja</Typography>}
                />
              </ListItem>
            ))}
          </List>
        )}
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" sx={{ color: '#7367F0', fontSize: '0.75rem' }}>Lihat semua notifikasi</Button>
        </Box>
      </Popover>

      {/* User menu popover */}
      <Popover
        open={Boolean(userAnchor)}
        anchorEl={userAnchor}
        onClose={() => setUserAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 220,
              mt: 1,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(47,43,61,0.16)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha('#7367F0', 0.04) }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#433C50' }}>{user?.name ?? 'Admin'}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email ?? 'admin@example.com'}</Typography>
        </Box>
        <Divider />
        <MenuList sx={{ py: 0.5 }}>
          {[
            { label: 'Profil Saya', icon: User },
            { label: 'Pengaturan', icon: Settings },
            { label: 'Bantuan', icon: HelpCircle },
          ].map(({ label, icon: Icon }) => (
            <MenuItem
              key={label}
              sx={{ gap: 1.5, py: 1, fontSize: '0.875rem', color: '#433C50', '&:hover': { bgcolor: alpha('#7367F0', 0.04), color: '#7367F0' } }}
            >
              <Icon size={16} />
              {label}
            </MenuItem>
          ))}
        </MenuList>
        <Divider />
        <MenuList sx={{ py: 0.5 }}>
          <MenuItem
            onClick={logout}
            sx={{ gap: 1.5, py: 1, fontSize: '0.875rem', color: '#EA5455', '&:hover': { bgcolor: alpha('#EA5455', 0.06) } }}
          >
            <LogOut size={16} />
            Keluar
          </MenuItem>
        </MenuList>
      </Popover>
    </AppBar>
  );
}

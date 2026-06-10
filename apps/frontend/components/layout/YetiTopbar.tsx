'use client';

import { useState } from 'react';
import { Search, Bell, Menu, Settings, ChevronDown, Sun, HelpCircle, X } from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useNotificationStore } from '../../lib/store/useNotificationStore';

interface TopbarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

const QUICK_LINKS = ['Dashboard', 'Sales Orders', 'Invoice', 'Inventory', 'Reports'];

export function YetiTopbar({ onToggleSidebar, onToggleMobileSidebar }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications?.length ?? 0;

  return (
    <header
      className="flex items-center justify-between gap-4 px-5 flex-shrink-0 border-b"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', height: '64px', zIndex: 30 }}
    >
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Desktop toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
        >
          <Menu className="h-5 w-5 text-slate-500" />
        </button>
        {/* Mobile toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
        >
          <Menu className="h-5 w-5 text-slate-500" />
        </button>

        {/* Search bar */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari menu, modul, data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 w-64 lg:w-80 text-sm rounded-lg border transition-all outline-none"
            style={{
              backgroundColor: '#F8FAFC',
              borderColor: '#E2E8F0',
              color: '#334155',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3B82F6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: icons + user */}
      <div className="flex items-center gap-1.5">
        {/* Mobile search icon */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100"
        >
          <Search className="h-4.5 w-4.5 text-slate-500" />
        </button>

        {/* Help */}
        <button className="h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hidden sm:flex">
          <HelpCircle className="h-4.5 w-4.5 text-slate-500" />
        </button>

        {/* Settings */}
        <button className="h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 hidden sm:flex">
          <Settings className="h-4.5 w-4.5 text-slate-500" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
            className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <Bell className="h-4.5 w-4.5 text-slate-500" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: '#EA5455' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#F1F5F9' }}>
                <p className="font-semibold text-sm text-slate-700">Notifikasi</p>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  {unreadCount} baru
                </span>
              </div>
              {unreadCount === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">Tidak ada notifikasi baru</div>
              ) : (
                <div className="divide-y">
                  {[...Array(Math.min(unreadCount, 3))].map((_, i) => (
                    <div key={i} className="flex gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
                        <Bell className="h-4 w-4" style={{ color: '#3B82F6' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Update sistem</p>
                        <p className="text-xs text-slate-400 mt-0.5">Baru saja</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: '#F1F5F9' }}>
                <button className="text-xs font-medium" style={{ color: '#3B82F6' }}>Lihat semua notifikasi</button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px mx-1 hidden sm:block" style={{ backgroundColor: '#E2E8F0' }} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
          >
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
            >
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight text-slate-700">{user?.name ?? 'Admin'}</p>
              <p className="text-[10px] leading-tight text-slate-400">
                {Array.isArray(user?.roles) ? user.roles[0] : 'Administrator'}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl border overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: '#F1F5F9' }}>
                <p className="text-sm font-semibold text-slate-700">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-slate-400">{user?.email ?? 'admin@example.com'}</p>
              </div>
              {[
                { label: 'Profil Saya', icon: '👤' },
                { label: 'Pengaturan', icon: '⚙️' },
                { label: 'Bantuan', icon: '❓' },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="border-t" style={{ borderColor: '#F1F5F9' }}>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <span>🚪</span>
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

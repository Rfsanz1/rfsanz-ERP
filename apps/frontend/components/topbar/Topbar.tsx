'use client';

import { Bell, LogOut, Menu, User, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useNotificationStore } from '../../lib/store/useNotificationStore';

export function Topbar() {
  const { token, user, logout } = useAuthStore();
  const { notifications } = useNotificationStore();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-[var(--primary)] hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--primary-soft)]">ERP Control Panel</p>
            <p className="text-sm text-slate-300">Enterprise workflow, realtime alerts, and role-based access.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 text-sm text-slate-300 transition hover:border-[var(--primary)] hover:text-white">
            <Bell className="h-5 w-5 text-[var(--primary)]" />
            <span>{notifications.length || 0} Alerts</span>
          </button>
          {token && (
            <div className="hidden items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 sm:flex">
              <User className="h-5 w-5 text-[var(--primary)]" />
              <div>
                <p className="font-medium text-slate-100">{user?.name ?? user?.email ?? 'User'}</p>
                <p className="text-xs text-slate-500">{user?.roles?.join(', ') || 'Guest'}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-800 bg-[var(--accent)] px-4 text-sm text-slate-950 transition hover:bg-orange-400"
            onClick={logout}
          >
            <Sparkles className="h-4 w-4" />
            {token ? 'Logout' : 'Sign In'}
          </button>
        </div>
      </div>
    </header>
  );
}

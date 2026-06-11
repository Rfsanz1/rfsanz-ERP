'use client';

import { Bell, Menu, Sparkles } from 'lucide-react';
import { useNotificationStore } from '../../lib/store/useNotificationStore';

export function Topbar() {
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
        </div>
      </div>
    </header>
  );
}

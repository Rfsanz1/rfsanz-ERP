'use client';
import { useEffect } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../lib/nav-configs';
import { RolePermissionPanel } from '../../components/access/RolePermissionPanel';

export default function AccessPage() {
  const { loadProfile } = useAuthStore();
  useEffect(() => { void loadProfile(); }, []);

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/access">
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Users & Akses</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola roles dan permission ERP secara modular</p>
        </div>
        <RolePermissionPanel />
      </div>
    </AppShell>
  );
}

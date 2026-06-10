'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../lib/nav-configs';
import { NotificationList } from '../../components/notifications/NotificationList';
import { useNotificationStore } from '../../lib/store/useNotificationStore';

export default function NotificationsPage() {
  const { token, loadProfile } = useAuthStore();
  const { loadNotifications } = useNotificationStore();
  const router = useRouter();
  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    void loadProfile();
    void loadNotifications();
  }, [token]);
  if (!token) return null;

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/notifications">
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Notifikasi</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Semua notifikasi penting sistem dan event ERP realtime</p>
        </div>
        <NotificationList />
      </div>
    </AppShell>
  );
}

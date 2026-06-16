'use client';
import { useEffect } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { NOTIFICATIONS_CONFIG, NOTIFICATIONS_NAV } from '../../lib/nav-configs';
import { NotificationList } from '../../components/notifications/NotificationList';
import { useNotificationStore } from '../../lib/store/useNotificationStore';

export default function NotificationsPage() {
  const { token, loadProfile } = useAuthStore();
  const { loadNotifications } = useNotificationStore();

  useEffect(() => {
    if (!token) return;
    void loadProfile();
    void loadNotifications();
  }, [token]);


  return (
    <AppShell {...NOTIFICATIONS_CONFIG} navItems={NOTIFICATIONS_NAV} activeHref="/notifications">
      <div style={{ maxWidth: 860 }} className="space-y-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Notifikasi</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Semua notifikasi penting sistem dan event ERP secara realtime</p>
        </div>
        <NotificationList />
      </div>
    </AppShell>
  );
}

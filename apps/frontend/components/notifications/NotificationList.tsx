'use client';

import { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useNotificationStore } from '../../lib/store/useNotificationStore';

export function NotificationList() {
  const { notifications, loading, error, markAsRead, setNotifications } = useNotificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const socket = getSocket();
    const recipient = user?.email ?? '';
    if (!recipient) {
      return;
    }

    const eventName = `notification:${recipient}`;

    socket.connect();
    socket.on(eventName, (payload) => {
      setNotifications((current) => [payload, ...current]);
    });

    return () => {
      socket.off(eventName);
      socket.disconnect();
    };
  }, [user?.email, setNotifications]);

  if (loading) {
    return <p className="text-slate-400">Memuat notifikasi...</p>;
  }

  if (error) {
    return <p className="text-rose-400">{error}</p>;
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card>
          <p className="text-slate-300">Tidak ada notifikasi terbaru.</p>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    notification.status === 'read'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  }`}
                >
                  {notification.status === 'read' ? 'Read' : 'New'}
                </span>
                <h3 className="mt-3 text-xl font-semibold text-white">{notification.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{notification.message}</p>
                <p className="mt-3 text-xs text-slate-500">Dikirim pada {new Date(notification.createdAt).toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold"
                  onClick={() => markAsRead(notification.id)}
                >
                  Tandai dibaca
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

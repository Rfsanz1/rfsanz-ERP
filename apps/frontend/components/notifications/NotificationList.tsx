'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useNotificationStore } from '../../lib/store/useNotificationStore';

function NotificationListInner() {
  const { notifications, loading, error, markAsRead, setNotifications } = useNotificationStore();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const statusFilter = searchParams?.get('status') ?? 'all';
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const recipient = user?.email ?? '';
    if (!recipient) return;

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

  const unreadCount = notifications.filter((n) => n.status !== 'read').length;

  const filtered = notifications.filter((n) => {
    if (statusFilter === 'unread') return n.status !== 'read';
    if (statusFilter === 'read') return n.status === 'read';
    return true;
  });

  const handleMarkAll = async () => {
    setMarkingAll(true);
    const unread = notifications.filter((n) => n.status !== 'read');
    await Promise.all(unread.map((n) => markAsRead(n.id)));
    setMarkingAll(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-slate-400">
        <Clock size={16} className="animate-spin" />
        <span>Memuat notifikasi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-rose-400">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-400" />
          <span className="text-sm text-slate-400">
            {unreadCount > 0 ? (
              <><span className="font-semibold text-white">{unreadCount}</span> belum dibaca</>
            ) : (
              'Semua sudah dibaca'
            )}
          </span>
        </div>
        {unreadCount > 0 && (
          <Button
            className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-700"
            onClick={handleMarkAll}
            disabled={markingAll}
          >
            {markingAll ? 'Memproses...' : 'Tandai Semua Dibaca'}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Inbox size={36} className="text-slate-600" />
            <p className="text-slate-400">
              {statusFilter === 'unread'
                ? 'Tidak ada notifikasi yang belum dibaca.'
                : statusFilter === 'read'
                ? 'Tidak ada notifikasi yang sudah dibaca.'
                : 'Tidak ada notifikasi terbaru.'}
            </p>
          </div>
        </Card>
      ) : (
        filtered.map((notification) => {
          const isUnread = notification.status !== 'read';
          return (
            <Card key={notification.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 gap-3">
                  <div
                    className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      isUnread ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    <Bell size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isUnread
                            ? 'bg-cyan-500/10 text-cyan-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {isUnread ? 'Baru' : 'Dibaca'}
                      </span>
                      {isUnread && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-white">{notification.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{notification.message}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={11} />
                      {new Date(notification.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                {isUnread && (
                  <div className="flex-shrink-0">
                    <Button
                      className="rounded-full border border-slate-700 bg-transparent px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CheckCircle2 size={12} className="mr-1.5 inline" />
                      Tandai Dibaca
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

export function NotificationList() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-8 text-slate-400">
          <Clock size={16} className="animate-spin" />
          <span>Memuat notifikasi...</span>
        </div>
      }
    >
      <NotificationListInner />
    </Suspense>
  );
}

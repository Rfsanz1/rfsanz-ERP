'use client';

import { useEffect, useState } from 'react';
import {
  Bell, CheckCircle2, Clock, Inbox, ShoppingCart, FileText,
  Package, AlertTriangle, Info, TrendingUp, RefreshCw, Trash2, X,
} from 'lucide-react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useNotificationStore } from '../../lib/store/useNotificationStore';
import { getSocket } from '../../lib/socket';

const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-1', title: 'Order Baru Masuk', category: 'order', status: 'unread',
    message: 'Order #SO-2025-001 dari PT Maju Bersama senilai Rp 15.000.000 telah masuk dan menunggu konfirmasi.',
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 'demo-2', title: 'Invoice Jatuh Tempo', category: 'invoice', status: 'unread',
    message: 'Invoice #INV-2025-089 dari CV Raya Mandiri senilai Rp 8.500.000 akan jatuh tempo dalam 3 hari.',
    createdAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: 'demo-3', title: 'Stok Hampir Habis', category: 'stock', status: 'unread',
    message: 'Produk "Monitor LED 24 inch" tersisa 5 unit. Segera lakukan pemesanan ulang ke supplier.',
    createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: 'demo-4', title: 'Opportunity Baru Dikualifikasi', category: 'crm', status: 'unread',
    message: 'Lead dari PT Digital Solusi telah dikualifikasi sebagai opportunity senilai Rp 120.000.000.',
    createdAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
  },
  {
    id: 'demo-5', title: 'Pembayaran Diterima', category: 'invoice', status: 'read',
    message: 'Pembayaran Rp 25.000.000 dari PT Global Industri untuk Invoice #INV-2025-081 telah dikonfirmasi.',
    createdAt: new Date(Date.now() - 24 * 3_600_000).toISOString(),
  },
  {
    id: 'demo-6', title: 'Purchase Order Disetujui', category: 'order', status: 'read',
    message: 'PO #PO-2025-044 kepada Supplier PT Sumber Makmur sebesar Rp 45.000.000 telah disetujui manajer.',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'demo-7', title: 'Sistem: Backup Berhasil', category: 'system', status: 'read',
    message: 'Backup database harian telah berhasil diselesaikan pada pukul 02:00 WIB.',
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  },
];

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  order:   { icon: <ShoppingCart size={14} />, color: '#6366F1', label: 'Order' },
  invoice: { icon: <FileText size={14} />,     color: '#3B82F6', label: 'Invoice' },
  stock:   { icon: <Package size={14} />,      color: '#F59E0B', label: 'Stok' },
  crm:     { icon: <TrendingUp size={14} />,   color: '#8B5CF6', label: 'CRM' },
  system:  { icon: <Info size={14} />,         color: '#10B981', label: 'Sistem' },
  default: { icon: <Bell size={14} />,         color: '#64748B', label: 'Info' },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)      return 'Baru saja';
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)} menit lalu`;
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)} jam lalu`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NotificationList() {
  const { notifications, loading, markAsRead, setNotifications } = useNotificationStore();
  const { user } = useAuthStore();
  const [filter, setFilter]     = useState<'all' | 'unread' | 'read'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [localDismiss, setLocalDismiss] = useState<Set<string>>(new Set());

  const isDemo = !loading && notifications.length === 0;
  const source = isDemo ? DEMO_NOTIFICATIONS : notifications;
  const visible = source.filter(n => !localDismiss.has(n.id));

  useEffect(() => {
    const socket = getSocket();
    const recipient = user?.email ?? '';
    if (!recipient) return;
    const eventName = `notification:${recipient}`;
    socket.connect();
    socket.on(eventName, (payload: any) => {
      setNotifications((cur) => [payload, ...cur]);
    });
    return () => { socket.off(eventName); socket.disconnect(); };
  }, [user?.email, setNotifications]);

  const filtered = visible.filter(n => {
    if (filter === 'unread') return n.status !== 'read';
    if (filter === 'read')   return n.status === 'read';
    return true;
  });

  const unreadCount = visible.filter(n => n.status !== 'read').length;

  const handleMarkAll = async () => {
    setMarkingAll(true);
    if (isDemo) {
      setTimeout(() => setMarkingAll(false), 600);
    } else {
      const unread = notifications.filter(n => n.status !== 'read');
      await Promise.all(unread.map(n => markAsRead(n.id)));
      setMarkingAll(false);
    }
  };

  const handleMarkOne = async (id: string) => {
    if (isDemo) return;
    await markAsRead(id);
  };

  const handleDismiss = (id: string) => {
    setLocalDismiss(prev => new Set([...prev, id]));
  };

  const TABS = [
    { key: 'all',    label: 'Semua',         count: visible.length },
    { key: 'unread', label: 'Belum Dibaca',  count: unreadCount },
    { key: 'read',   label: 'Sudah Dibaca',  count: visible.length - unreadCount },
  ] as const;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        <RefreshCw size={15} className="animate-spin" />
        <span>Memuat notifikasi…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filter tabs + actions */}
      <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '12px 16px' }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: 'none',
                background: filter === t.key ? '#6366F1' : 'var(--surface-sunken)',
                color: filter === t.key ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
              {t.label}
              <span style={{ background: filter === t.key ? 'rgba(255,255,255,.25)' : 'var(--border)', borderRadius: 10, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDemo && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-sunken)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              Contoh data (backend offline)
            </span>
          )}
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} disabled={markingAll}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: markingAll ? 0.65 : 1 }}>
              {markingAll ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '48px 24px', textAlign: 'center' }}>
          <Inbox size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
            {filter === 'unread' ? 'Tidak ada notifikasi belum dibaca' : filter === 'read' ? 'Tidak ada notifikasi yang sudah dibaca' : 'Belum ada notifikasi'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Semua aktivitas sistem akan muncul di sini</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(notif => {
            const isUnread = notif.status !== 'read';
            const meta = CATEGORY_META[(notif as any).category ?? 'default'] ?? CATEGORY_META.default;
            return (
              <div key={notif.id}
                style={{ background: 'var(--surface)', borderRadius: 14, border: `1px solid ${isUnread ? meta.color + '30' : 'var(--border)'}`,
                  padding: '14px 16px', transition: 'all .15s',
                  boxShadow: isUnread ? `0 0 0 1px ${meta.color}15` : 'var(--shadow-sm)',
                  position: 'relative', overflow: 'hidden' }}>
                {/* Unread indicator stripe */}
                {isUnread && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meta.color, borderRadius: '14px 0 0 14px' }} />
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.color + '15', padding: '2px 8px', borderRadius: 6 }}>
                        {meta.label}
                      </span>
                      {isUnread && (
                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: meta.color }} />
                      )}
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '6px 0 4px', lineHeight: 1.4 }}>
                      {notif.title}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.6 }}>
                      {notif.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Clock size={11} />
                        {relativeTime(notif.createdAt)}
                      </span>
                      {isUnread && !isDemo && (
                        <button onClick={() => handleMarkOne(notif.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: meta.color, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                          <CheckCircle2 size={11} /> Tandai Dibaca
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Dismiss button */}
                  <button onClick={() => handleDismiss(notif.id)}
                    style={{ padding: 5, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, opacity: 0.5 }}
                    title="Tutup">
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import { Package, ArrowDownRight, ArrowUpRight, ClipboardList, ClipboardCheck, ArrowLeftRight, Clock } from 'lucide-react';

interface GudangStats { picking: number; incoming: number; outgoing: number; transfers: number; stockOpname: number; pending: number; }

export default function GudangDashboardPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<GudangStats>({ picking: 5, incoming: 12, outgoing: 8, transfers: 3, stockOpname: 2, pending: 4 });

  useEffect(() => {
    if (!token) { router.replace('/dashboard'); return; }
    api.get('/inventory/summary').then(r => {
      const d = r.data ?? {};
      setStats({ picking: d.picking_orders ?? 5, incoming: d.incoming_orders ?? 12, outgoing: d.outgoing_orders ?? 8, transfers: d.transfers ?? 3, stockOpname: d.stock_opname ?? 2, pending: d.pending_orders ?? 4 });
    }).catch(() => {});
  }, [token]);

  const CARDS = [
    { label: 'Picking Order', value: stats.picking,    icon: ClipboardList,  accent: '#F59E0B', href: '/gudang/picking' },
    { label: 'Barang Masuk',  value: stats.incoming,   icon: ArrowDownRight, accent: '#3B82F6', href: '/gudang/inbound' },
    { label: 'Barang Keluar', value: stats.outgoing,   icon: ArrowUpRight,   accent: '#10B981', href: '/gudang/outbound' },
    { label: 'Transfer Stok', value: stats.transfers,  icon: ArrowLeftRight, accent: '#8B5CF6', href: '/gudang/transfer' },
    { label: 'Stok Opname',   value: stats.stockOpname,icon: ClipboardCheck, accent: '#6366F1', href: '/gudang/stock-opname' },
    { label: 'Order Pending', value: stats.pending,    icon: Clock,          accent: '#EF4444', href: '/gudang/picking' },
  ];

  const ACTIONS = [
    { label: 'Buat Picking Order', href: '/gudang/picking',       icon: ClipboardList,  accent: '#F59E0B' },
    { label: 'Terima Barang',      href: '/gudang/inbound',       icon: ArrowDownRight, accent: '#3B82F6' },
    { label: 'Kirim Barang',       href: '/gudang/outbound',      icon: ArrowUpRight,   accent: '#10B981' },
    { label: 'Transfer Stok',      href: '/gudang/transfer',      icon: ArrowLeftRight, accent: '#8B5CF6' },
    { label: 'Cek Stok',           href: '/gudang/products',      icon: Package,        accent: '#F59E0B' },
  ];

  return (
    <GudangLayout title="Dashboard Gudang">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Halo, {user?.name?.split(' ')[0] || 'Staff'}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Berikut ringkasan aktivitas gudang hari ini.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        {CARDS.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.label} onClick={() => router.push(c.href)}
              style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: 12, boxShadow: 'var(--shadow-xs)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.accent + '60'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-xs)'; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: c.accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} style={{ color: c.accent }} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, margin: '0 0 4px' }}>{c.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{c.value}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>Aksi Cepat</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
          {ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.href} onClick={() => router.push(a.href)}
                style={{ padding: '10px 14px', borderRadius: 10, background: a.accent + '0D', border: '1px solid ' + a.accent + '25', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = a.accent + '1A'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = a.accent + '0D'; }}
              >
                <Icon size={14} style={{ color: a.accent, flexShrink: 0 }} strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </GudangLayout>
  );
}

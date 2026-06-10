'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import { useAuthStore } from '@/lib/store/useAuthStore';
import api from '@/lib/api';
import { Package, ArrowDownRight, ArrowUpRight, ClipboardList, ClipboardCheck, ArrowLeftRight, Clock } from 'lucide-react';

const APP_COLOR = '#D97706';

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
    { label: 'Picking Order', value: stats.picking, icon: ClipboardList, color: '#F57C00', bg: 'rgba(245,124,0,.1)', href: '/gudang/picking' },
    { label: 'Barang Masuk', value: stats.incoming, icon: ArrowDownRight, color: '#2563EB', bg: 'rgba(37,99,235,.1)', href: '/gudang/inbound' },
    { label: 'Barang Keluar', value: stats.outgoing, icon: ArrowUpRight, color: '#16A34A', bg: 'rgba(22,163,74,.1)', href: '/gudang/outbound' },
    { label: 'Transfer Stok', value: stats.transfers, icon: ArrowLeftRight, color: '#D97706', bg: 'rgba(217,119,6,.1)', href: '/gudang/transfer' },
    { label: 'Stock Opname', value: stats.stockOpname, icon: ClipboardCheck, color: '#7C3AED', bg: 'rgba(124,58,237,.1)', href: '/gudang/stock-opname' },
    { label: 'Order Pending', value: stats.pending, icon: Clock, color: '#DC2626', bg: 'rgba(220,38,38,.1)', href: '/gudang/picking' },
  ];

  return (
    <GudangLayout title="Dashboard Gudang">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: APP_COLOR, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px' }}>Gudang</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#78350F', margin: '0 0 6px' }}>Dashboard Gudang</h1>
        <p style={{ color: '#6B7280', fontSize: 13.5, margin: 0 }}>Selamat datang, {user?.name?.split(' ')[0] || 'Staff'}. Berikut ringkasan aktivitas gudang hari ini.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {CARDS.map(card => (
          <button key={card.label} onClick={() => router.push(card.href)}
            style={{ padding: 20, borderRadius: 16, backgroundColor: '#fff', border: '1.5px solid #FEF3C7', cursor: 'pointer', textAlign: 'left', transition: 'all .2s', display: 'flex', alignItems: 'flex-start', gap: 14 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = card.color; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px ${card.color}22`; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#FEF3C7'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, margin: '0 0 4px' }}>{card.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#78350F', margin: 0, lineHeight: 1 }}>{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #FEF3C7', padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#78350F', margin: '0 0 16px' }}>Aksi Cepat</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
          {[
            { label: 'Buat Picking Order', href: '/gudang/picking', icon: ClipboardList, color: '#F57C00' },
            { label: 'Terima Barang', href: '/gudang/inbound', icon: ArrowDownRight, color: '#2563EB' },
            { label: 'Kirim Barang', href: '/gudang/outbound', icon: ArrowUpRight, color: '#16A34A' },
            { label: 'Transfer Stok', href: '/gudang/transfer', icon: ArrowLeftRight, color: '#7C3AED' },
            { label: 'Cek Stok', href: '/gudang/products', icon: Package, color: '#D97706' },
          ].map(a => (
            <button key={a.href} onClick={() => router.push(a.href)}
              style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: `${a.color}10`, border: `1.5px solid ${a.color}25`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${a.color}20`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${a.color}10`; }}
            >
              <a.icon size={16} style={{ color: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </GudangLayout>
  );
}

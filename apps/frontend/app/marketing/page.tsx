'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell, { NavItem } from '../../components/layout/AppShell';
import {
  Megaphone, BarChart2, Mail, MessageCircle, Tag, Gift,
  Users, TrendingUp, Settings, CheckCircle, Clock, Eye,
  Send, Star, PieChart, Zap,
} from 'lucide-react';

const NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/marketing',              icon: BarChart2 },
  { label: 'Email Marketing', href: '/marketing/email',       icon: Mail, badge: 2 },
  { label: 'WhatsApp',       href: '/marketing/whatsapp',     icon: MessageCircle, badge: 5 },
  { label: 'SMS Marketing',  href: '/marketing/sms',          icon: Send },
  { label: 'Campaign',       href: '/marketing/campaigns',    icon: Megaphone,
    children: [
      { label: 'Semua Campaign',  href: '/marketing/campaigns' },
      { label: 'Aktif',           href: '/marketing/campaigns?status=active' },
      { label: 'Terjadwal',       href: '/marketing/campaigns?status=scheduled' },
      { label: 'Selesai',         href: '/marketing/campaigns?status=done' },
    ],
  },
  { label: 'Voucher & Promo', href: '/marketing/vouchers',   icon: Tag },
  { label: 'Loyalty Program', href: '/marketing/loyalty',    icon: Gift },
  { label: 'Survey',          href: '/marketing/surveys',    icon: Star },
  { label: 'Analytics',       href: '/marketing/analytics',  icon: TrendingUp },
  { label: 'Pengaturan',      href: '/marketing/settings',   icon: Settings },
];

const STATS = [
  { label: 'Campaign Aktif',      value: '8',         sub: '3 terjadwal minggu ini',   color: '#E53935', bg: 'rgba(229,57,53,.1)',   icon: Megaphone },
  { label: 'Total Jangkauan',     value: '24.8K',     sub: '+2.1K vs bulan lalu',      color: '#2196F3', bg: 'rgba(33,150,243,.1)',  icon: Users },
  { label: 'Open Rate Email',     value: '28.4%',     sub: 'Rata-rata industri 21%',   color: '#4CAF50', bg: 'rgba(76,175,80,.1)',   icon: Mail },
  { label: 'Revenue Campaign',    value: 'Rp 84 Jt',  sub: 'Dari 8 campaign aktif',   color: '#FF9800', bg: 'rgba(255,152,0,.1)',   icon: TrendingUp },
];

const CAMPAIGNS = [
  { name: 'Promo Lebaran 2026',         channel: 'Email + WA', audience: 8420, sent: 8420, opened: 2394, clicked: 842, revenue: 'Rp 28.4 Jt', status: 'active',    startDate: '20 Apr', endDate: '5 Mei 2026' },
  { name: 'Flash Sale Elektronik',      channel: 'WhatsApp',   audience: 5200, sent: 4980, opened: 3211, clicked: 1420, revenue: 'Rp 34.1 Jt', status: 'active',   startDate: '24 Mei', endDate: '25 Mei 2026' },
  { name: 'Newsletter Mei 2026',        channel: 'Email',      audience: 6100, sent: 5890, opened: 1650, clicked: 423,  revenue: 'Rp 8.2 Jt',  status: 'done',     startDate: '1 Mei',  endDate: '15 Mei 2026' },
  { name: 'Diskon Member Gold',         channel: 'SMS + WA',   audience: 1240, sent: 0,    opened: 0,    clicked: 0,    revenue: '–',            status: 'scheduled', startDate: '1 Jun',  endDate: '7 Jun 2026' },
  { name: 'Cashback Tokopedia',         channel: 'Email',      audience: 3800, sent: 3800, opened: 1102, clicked: 318,  revenue: 'Rp 13.3 Jt',  status: 'done',    startDate: '10 Mei', endDate: '17 Mei 2026' },
];

const WA_MESSAGES = [
  { template: 'Flash Sale Notif',  sent: 4980, delivered: 4842, read: 3211, status: 'done', rate: '64.5%' },
  { template: 'Order Confirmation', sent: 1248, delivered: 1241, read: 1198, status: 'running', rate: '96.1%' },
  { template: 'Abandoned Cart',    sent: 892,  delivered: 880,  read: 614,  status: 'running', rate: '68.8%' },
  { template: 'Review Request',    sent: 2100, delivered: 2089, read: 1342, status: 'done', rate: '63.9%' },
];

const VOUCHERS = [
  { code: 'LEBARAN25',  discount: '25%',     used: 142, limit: 500, exp: '30 Mei 2026',  status: 'active' },
  { code: 'NEWMEMBER',  discount: 'Rp 50K',  used: 289, limit: 1000, exp: '31 Des 2026', status: 'active' },
  { code: 'FLASHSALE',  discount: '50%',     used: 500, limit: 500,  exp: '25 Mei 2026', status: 'full' },
  { code: 'MEMBER10',   discount: '10%',     used: 88,  limit: 200,  exp: '15 Jun 2026', status: 'active' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Aktif',      color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  scheduled: { label: 'Terjadwal',  color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  done:      { label: 'Selesai',    color: '#9CA3AF', bg: 'rgba(165,163,174,.12)' },
  running:   { label: 'Berjalan',   color: '#9C27B0', bg: 'rgba(156,39,176,.1)' },
  full:      { label: 'Habis',      color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

export default function MarketingDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'whatsapp' | 'vouchers'>('campaigns');
  if (!token) return null;

  return (
    <AppShell
      appName="Marketing"
      appColor="#E53935"
      appGradient="from-red-500 to-orange-600"
      appIcon={Megaphone}
      navItems={NAV}
      activeHref="/marketing"
    >
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#EDE8F5' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: s.bg }}>
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#2F2B3D' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Channel performance bar */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#EDE8F5' }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: '#2F2B3D' }}>Performa Channel Bulan Ini</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { ch: 'Email', sent: 18290, open: 28.4, click: 7.2, revenue: 'Rp 49.9 Jt', color: '#E53935', icon: Mail },
              { ch: 'WhatsApp', sent: 9220, open: 64.5, click: 28.9, revenue: 'Rp 24.1 Jt', color: '#2E7D32', icon: MessageCircle },
              { ch: 'SMS', sent: 3400, open: 42.1, click: 12.4, revenue: 'Rp 10.0 Jt', color: '#1565C0', icon: Send },
            ].map(ch => {
              const Icon = ch.icon;
              return (
                <div key={ch.ch} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${ch.color}15` }}>
                      <Icon className="h-5 w-5" style={{ color: ch.color }} />
                    </div>
                  </div>
                  <p className="text-xs font-bold mb-3" style={{ color: '#2F2B3D' }}>{ch.ch}</p>
                  {[
                    { label: 'Terkirim', val: ch.sent.toLocaleString() },
                    { label: 'Open Rate', val: `${ch.open}%` },
                    { label: 'Click Rate', val: `${ch.click}%` },
                    { label: 'Revenue', val: ch.revenue },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-[11px] py-1 border-b" style={{ borderColor: '#F5F4F9' }}>
                      <span style={{ color: '#9CA3AF' }}>{row.label}</span>
                      <span className="font-semibold" style={{ color: '#2F2B3D' }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#EDE8F5' }}>
          <div className="flex items-center border-b" style={{ borderColor: '#EDE8F5' }}>
            {[
              { key: 'campaigns', label: 'Campaign' },
              { key: 'whatsapp',  label: 'WhatsApp Blast' },
              { key: 'vouchers',  label: 'Voucher & Promo' },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className="px-5 py-3.5 text-sm font-semibold border-b-2 transition-all"
                style={{ borderBottomColor: activeTab === t.key ? '#E53935' : 'transparent', color: activeTab === t.key ? '#E53935' : '#9CA3AF' }}
              >{t.label}</button>
            ))}
            <div className="ml-auto px-5">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#E53935' }}>
                + Buat Baru
              </button>
            </div>
          </div>

          {activeTab === 'campaigns' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                  {['Campaign', 'Channel', 'Audience', 'Terkirim', 'Dibuka', 'Diklik', 'Revenue', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {CAMPAIGNS.map(c => {
                    const st = STATUS_MAP[c.status];
                    const openRate = c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0;
                    return (
                      <tr key={c.name} className="border-b hover:bg-gray-50" style={{ borderColor: '#F5F4F9' }}>
                        <td className="px-4 py-3">
                          <p className="font-semibold" style={{ color: '#2F2B3D' }}>{c.name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{c.startDate} – {c.endDate}</p>
                        </td>
                        <td className="px-4 py-3" style={{ color: '#6B7280' }}>{c.channel}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: '#2F2B3D' }}>{c.audience.toLocaleString()}</td>
                        <td className="px-4 py-3" style={{ color: '#6B7280' }}>{c.sent > 0 ? c.sent.toLocaleString() : '–'}</td>
                        <td className="px-4 py-3">
                          {c.opened > 0 ? <><span className="font-semibold" style={{ color: '#2F2B3D' }}>{c.opened.toLocaleString()}</span><span className="text-[10px] ml-1" style={{ color: '#9CA3AF' }}>({openRate}%)</span></> : '–'}
                        </td>
                        <td className="px-4 py-3" style={{ color: '#6B7280' }}>{c.clicked > 0 ? c.clicked.toLocaleString() : '–'}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: '#4CAF50' }}>{c.revenue}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {WA_MESSAGES.map(m => {
                const st = STATUS_MAP[m.status];
                const readPct = m.sent > 0 ? Math.round((m.read / m.sent) * 100) : 0;
                return (
                  <div key={m.template} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(46,125,50,.1)' }}>
                      <MessageCircle className="h-5 w-5" style={{ color: '#2E7D32' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold" style={{ color: '#2F2B3D' }}>{m.template}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div className="flex gap-4 text-[11px]" style={{ color: '#9CA3AF' }}>
                        <span>Terkirim: <b style={{ color: '#2F2B3D' }}>{m.sent.toLocaleString()}</b></span>
                        <span>Diterima: <b style={{ color: '#2F2B3D' }}>{m.delivered.toLocaleString()}</b></span>
                        <span>Dibaca: <b style={{ color: '#2E7D32' }}>{m.read.toLocaleString()}</b></span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold" style={{ color: '#2E7D32' }}>{m.rate}</p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Read rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {VOUCHERS.map(v => {
                const st = STATUS_MAP[v.status];
                const usedPct = Math.round((v.used / v.limit) * 100);
                return (
                  <div key={v.code} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(173,20,87,.1)' }}>
                      <Tag className="h-5 w-5" style={{ color: '#AD1457' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-sm px-2 py-0.5 rounded-lg" style={{ backgroundColor: '#F3E5F5', color: '#AD1457' }}>{v.code}</span>
                        <span className="text-xs font-bold" style={{ color: '#2F2B3D' }}>Diskon {v.discount}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#EDE8F5' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${usedPct}%`, backgroundColor: '#AD1457' }} />
                        </div>
                        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{v.used}/{v.limit} · {usedPct}%</span>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: '#B0AAB9' }}>Berlaku s.d. {v.exp}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

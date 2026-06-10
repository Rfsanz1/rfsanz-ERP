'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell, { NavItem } from '../../components/layout/AppShell';
import {
  Globe, BarChart2, Layout, BookOpen, MessageCircle, Search,
  Users, Camera, Settings, Eye, TrendingUp, CheckCircle,
  ExternalLink, Zap, Monitor, Smartphone, Clock,
} from 'lucide-react';

const NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/website',               icon: BarChart2 },
  { label: 'Website Builder', href: '/website/builder',      icon: Layout },
  { label: 'Halaman',        href: '/website/pages',         icon: Globe,
    children: [
      { label: 'Semua Halaman', href: '/website/pages' },
      { label: 'Landing Page',  href: '/website/pages/landing' },
      { label: 'Produk',        href: '/website/pages/products' },
    ],
  },
  { label: 'Blog',           href: '/website/blog',          icon: BookOpen, badge: 3 },
  { label: 'Live Chat',      href: '/website/chat',          icon: MessageCircle, badge: 8 },
  { label: 'SEO',            href: '/website/seo',           icon: Search },
  { label: 'Banner & Slider', href: '/website/banners',      icon: Camera },
  { label: 'Portal Pelanggan', href: '/website/portal',      icon: Users },
  { label: 'Analytics',      href: '/website/analytics',     icon: TrendingUp },
  { label: 'Pengaturan',     href: '/website/settings',      icon: Settings },
];

const STATS = [
  { label: 'Pengunjung Hari Ini', value: '2.841',   sub: '+12% vs kemarin',       color: '#0097A7', bg: 'rgba(0,151,167,.1)',   icon: Eye },
  { label: 'Pengunjung Unik',     value: '1.924',   sub: '67.7% dari total',      color: '#1976D2', bg: 'rgba(25,118,210,.1)',  icon: Users },
  { label: 'Rata-rata Sesi',      value: '3m 24s',  sub: '+18s vs kemarin',       color: '#4CAF50', bg: 'rgba(76,175,80,.1)',   icon: Clock },
  { label: 'Konversi',            value: '3.2%',    sub: '+0.4% vs kemarin',      color: '#FF9800', bg: 'rgba(255,152,0,.1)',   icon: TrendingUp },
];

const PAGES = [
  { name: 'Beranda',             path: '/',            views: 1842, bounce: '32%', lastEdit: '20 Mei 2026',  status: 'published' },
  { name: 'Produk Samsung',      path: '/produk/samsung', views: 624, bounce: '41%', lastEdit: '22 Mei 2026', status: 'published' },
  { name: 'Flash Sale',          path: '/promo/flash-sale', views: 1201, bounce: '28%', lastEdit: '24 Mei 2026', status: 'published' },
  { name: 'Tentang Kami',        path: '/tentang',     views: 218,  bounce: '55%', lastEdit: '10 Apr 2026',  status: 'published' },
  { name: 'Promo Lebaran Draft', path: '/promo/lebaran', views: 0,  bounce: '–',  lastEdit: '23 Mei 2026',  status: 'draft' },
];

const BLOG_POSTS = [
  { title: 'Review Samsung Galaxy A55 2026 — Worth It?', views: 3241, comments: 18, date: '22 Mei 2026', status: 'published' },
  { title: '5 Tips Pilih Laptop untuk Mahasiswa',         views: 2184, comments: 12, date: '19 Mei 2026', status: 'published' },
  { title: 'Panduan Beli TV OLED vs QLED',               views: 1890, comments: 7,  date: '15 Mei 2026', status: 'published' },
  { title: 'Review Earphone TWS Terbaik 2026',            views: 0,    comments: 0,  date: '24 Mei 2026', status: 'draft' },
];

const SEO_ITEMS = [
  { page: 'Beranda',     score: 94, issue: 0,  status: 'excellent' },
  { page: 'Flash Sale',  score: 81, issue: 2,  status: 'good' },
  { page: 'Blog',        score: 73, issue: 4,  status: 'warning' },
  { page: 'Produk',      score: 68, issue: 6,  status: 'warning' },
];

const LIVE_CHATS = [
  { customer: 'Andi S.',   message: 'Stock iPhone 15 ada ga kak?',     time: '2 mnt lalu', status: 'waiting' },
  { customer: 'Maya R.',   message: 'Harga laptop gaming terbaru?',    time: '5 mnt lalu', status: 'active' },
  { customer: 'Budi P.',   message: 'Gimana cara klaim garansi?',      time: '8 mnt lalu', status: 'active' },
];

export default function WebsiteDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  return (
    <AppShell
      appName="Website"
      appColor="#0097A7"
      appGradient="from-cyan-600 to-teal-700"
      appIcon={Globe}
      navItems={NAV}
      activeHref="/website"
    >
      <div className="p-6 space-y-6">
        {/* Website live banner */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #0097A7, #00838F)' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,.15)' }}>
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">gentongmas.id</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,.8)' }}>Online · SSL aktif · PageSpeed 94/100</p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}>
              <Monitor className="h-3.5 w-3.5" /> Preview Desktop
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white" style={{ color: '#0097A7' }}>
              <ExternalLink className="h-3.5 w-3.5" /> Buka Website
            </button>
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pages */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
                <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Halaman Website</h2>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#0097A7' }}>+ Halaman Baru</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                    {['Halaman', 'Path', 'Views', 'Bounce', 'Edit Terakhir', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {PAGES.map(p => (
                      <tr key={p.path} className="border-b hover:bg-gray-50" style={{ borderColor: '#F5F4F9' }}>
                        <td className="px-4 py-3 font-semibold" style={{ color: '#2F2B3D' }}>{p.name}</td>
                        <td className="px-4 py-3 font-mono text-[10px]" style={{ color: '#9CA3AF' }}>{p.path}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: '#2F2B3D' }}>{p.views.toLocaleString()}</td>
                        <td className="px-4 py-3" style={{ color: '#6B7280' }}>{p.bounce}</td>
                        <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{p.lastEdit}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: p.status === 'published' ? 'rgba(76,175,80,.1)' : 'rgba(255,152,0,.1)', color: p.status === 'published' ? '#4CAF50' : '#FF9800' }}>
                            {p.status === 'published' ? 'Publish' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Blog */}
            <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
                <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Blog Terbaru</h2>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#0097A7' }}>+ Tulis Artikel</button>
              </div>
              <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
                {BLOG_POSTS.map(b => (
                  <div key={b.title} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(92,107,192,.1)' }}>
                      <BookOpen className="h-4 w-4" style={{ color: '#5C6BC0' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#2F2B3D' }}>{b.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{b.date} · {b.views.toLocaleString()} views · {b.comments} komentar</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.status === 'published' ? 'rgba(76,175,80,.1)' : 'rgba(255,152,0,.1)', color: b.status === 'published' ? '#4CAF50' : '#FF9800' }}>
                      {b.status === 'published' ? 'Publish' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* SEO */}
            <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
                <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>SEO Score</h2>
              </div>
              <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
                {SEO_ITEMS.map(s => {
                  const scoreColor = s.score >= 90 ? '#4CAF50' : s.score >= 75 ? '#FF9800' : '#EA5455';
                  return (
                    <div key={s.page} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: '#2F2B3D' }}>{s.page}</span>
                        <span className="text-sm font-bold" style={{ color: scoreColor }}>{s.score}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: '#EDE8F5' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${s.score}%`, backgroundColor: scoreColor }} />
                      </div>
                      {s.issue > 0 && <p className="text-[10px] mt-1" style={{ color: '#FF9800' }}>{s.issue} isu ditemukan</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live chat */}
            <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
                <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Live Chat</h2>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#EA5455' }}>
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  3 aktif
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
                {LIVE_CHATS.map(c => (
                  <div key={c.customer} className="flex items-start gap-2.5 px-5 py-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #0097A7, #00838F)' }}>
                      {c.customer.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: '#2F2B3D' }}>{c.customer}</p>
                      <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>{c.message}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#B0AAB9' }}>{c.time}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${c.status === 'waiting' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {c.status === 'waiting' ? 'Menunggu' : 'Aktif'}
                    </span>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <button className="w-full py-2 rounded-xl text-xs font-semibold border" style={{ color: '#0097A7', borderColor: 'rgba(0,151,167,.3)' }}>
                    Buka Live Chat Console
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

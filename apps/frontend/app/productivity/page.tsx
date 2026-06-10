'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell, { NavItem } from '../../components/layout/AppShell';
import {
  BookOpen, BarChart2, FileBox, CheckSquare, MessageCircle,
  Bell, Calendar, Workflow, Activity, Search, Plus,
  Clock, User, Tag, ChevronRight, Inbox,
} from 'lucide-react';

const NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/productivity',           icon: BarChart2 },
  { label: 'Dokumen',       href: '/productivity/documents', icon: FileBox },
  { label: 'Approval',      href: '/productivity/approvals', icon: CheckSquare, badge: 7 },
  { label: 'Knowledge Base', href: '/productivity/knowledge', icon: BookOpen },
  { label: 'Kalender',      href: '/productivity/calendar',  icon: Calendar },
  { label: 'Chat Internal', href: '/productivity/chat',      icon: MessageCircle, badge: 3 },
  { label: 'Pengumuman',    href: '/productivity/announce',  icon: Bell },
  { label: 'Workflow',      href: '/productivity/workflows', icon: Workflow },
  { label: 'Activity Log',  href: '/productivity/activity',  icon: Activity },
];

const APPROVAL_QUEUE = [
  { id: 'APR-0241', type: 'Purchase Order',  from: 'Andi Gunawan',  amount: 'Rp 12.400.000', dept: 'Operasional', priority: 'urgent', age: '2 jam' },
  { id: 'APR-0240', type: 'Pengeluaran',     from: 'Maya Sari',     amount: 'Rp 850.000',    dept: 'Marketing',   priority: 'normal', age: '4 jam' },
  { id: 'APR-0239', type: 'Pengajuan Cuti',  from: 'Budi Pratama',  amount: '3 hari',        dept: 'Sales',       priority: 'normal', age: '5 jam' },
  { id: 'APR-0238', type: 'Cash Advance',    from: 'Lina Kusuma',   amount: 'Rp 2.000.000', dept: 'SDM',         priority: 'urgent', age: '6 jam' },
  { id: 'APR-0237', type: 'Reimbursement',   from: 'Eko Wibowo',    amount: 'Rp 340.000',   dept: 'IT',          priority: 'normal', age: '1 hari' },
];

const DOCS = [
  { name: 'SOP Penjualan B2B 2026',         type: 'SOP',      owner: 'Andi G.', updated: '22 Mei 2026', shared: 4 },
  { name: 'Panduan Onboarding Karyawan',    type: 'Panduan',  owner: 'HR Team', updated: '18 Mei 2026', shared: 12 },
  { name: 'Prosedur Klaim Garansi',         type: 'SOP',      owner: 'Service', updated: '15 Mei 2026', shared: 6 },
  { name: 'Price List Elektronik Q2 2026',  type: 'Dokumen',  owner: 'Sales',   updated: '10 Mei 2026', shared: 18 },
  { name: 'Kebijakan Cuti & Izin',          type: 'Kebijakan', owner: 'HR',     updated: '2 Apr 2026',  shared: 35 },
];

const ACTIVITIES = [
  { user: 'Andi G.',   action: 'membuat Sales Order',       ref: 'SO-2026-1248',    time: '2 mnt lalu',  color: '#00BCD4' },
  { user: 'Maya S.',   action: 'menyetujui Pengeluaran',    ref: 'APR-0238',        time: '8 mnt lalu',  color: '#4CAF50' },
  { user: 'System',    action: 'sinkronisasi marketplace',  ref: '142 order baru',  time: '15 mnt lalu', color: '#E91E63' },
  { user: 'Budi P.',   action: 'mengupdate stok produk',    ref: '18 SKU diupdate', time: '24 mnt lalu', color: '#FF9800' },
  { user: 'Lina K.',   action: 'mengirim invoice',          ref: 'INV-2026-0849',   time: '35 mnt lalu', color: '#2196F3' },
  { user: 'Eko W.',    action: 'menyelesaikan work order',  ref: 'WO-2026-0092',    time: '1 jam lalu',  color: '#9C27B0' },
];

const EVENTS = [
  { title: 'Rapat Tim Sales Mingguan',  time: '09:00',  duration: '1 jam',      attendees: 8,  type: 'meeting' },
  { title: 'Review Stok Bulanan',       time: '14:00',  duration: '30 mnt',     attendees: 4,  type: 'review' },
  { title: 'Training: ERP Dashboard',  time: '16:00',  duration: '2 jam',      attendees: 15, type: 'training' },
];

export default function ProductivityDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'approval' | 'docs' | 'activity'>('approval');
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AppShell
      appName="Produktivitas"
      appColor="#7C3AED"
      appGradient="from-violet-600 to-purple-700"
      appIcon={BookOpen}
      navItems={NAV}
      activeHref="/productivity"
    >
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Approval Pending',  value: '7',  sub: '2 urgent',            color: '#EA5455', bg: 'rgba(234,84,85,.1)',   icon: CheckSquare },
            { label: 'Dokumen Baru',      value: '12', sub: 'Minggu ini',           color: '#2196F3', bg: 'rgba(33,150,243,.1)',  icon: FileBox },
            { label: 'Pesan Belum Baca',  value: '3',  sub: 'Chat internal',        color: '#FF9800', bg: 'rgba(255,152,0,.1)',   icon: MessageCircle },
            { label: 'Event Hari Ini',    value: '3',  sub: today,                  color: '#7C3AED', bg: 'rgba(124,58,237,.1)',  icon: Calendar },
          ].map(s => {
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
          {/* Main tabs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#EDE8F5' }}>
              <div className="flex items-center border-b" style={{ borderColor: '#EDE8F5' }}>
                {[
                  { key: 'approval', label: 'Antrian Approval', count: 7 },
                  { key: 'docs',     label: 'Dokumen Terbaru',  count: null },
                  { key: 'activity', label: 'Activity Log',     count: null },
                ].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                    className="flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all"
                    style={{ borderBottomColor: activeTab === t.key ? '#7C3AED' : 'transparent', color: activeTab === t.key ? '#7C3AED' : '#9CA3AF' }}
                  >
                    {t.label}
                    {t.count !== null && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: activeTab === t.key ? 'rgba(124,58,237,.1)' : '#F5F4F9', color: activeTab === t.key ? '#7C3AED' : '#9CA3AF' }}>{t.count}</span>
                    )}
                  </button>
                ))}
                <div className="ml-auto px-4">
                  <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#7C3AED' }}>
                    <Plus className="inline h-3 w-3 mr-1" /> Baru
                  </button>
                </div>
              </div>

              {activeTab === 'approval' && (
                <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
                  {APPROVAL_QUEUE.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-xs" style={{ color: '#7C3AED' }}>{a.id}</span>
                          {a.priority === 'urgent' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#EA5455' }}>Urgent</span>}
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F5F4F9', color: '#9CA3AF' }}>{a.type}</span>
                        </div>
                        <p className="text-xs" style={{ color: '#6B7280' }}><span className="font-medium" style={{ color: '#2F2B3D' }}>{a.from}</span> · {a.dept} · {a.age}</p>
                      </div>
                      <p className="font-bold text-xs flex-shrink-0" style={{ color: '#2F2B3D' }}>{a.amount}</p>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white" style={{ backgroundColor: '#4CAF50' }}>Setuju</button>
                        <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#EA5455' }}>Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
                  {DOCS.map(d => (
                    <div key={d.name} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(124,58,237,.1)' }}>
                        <FileBox className="h-5 w-5" style={{ color: '#7C3AED' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: '#2F2B3D' }}>{d.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{d.type} · {d.owner} · {d.updated}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{d.shared} pengguna</p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: '#EDE8F5' }} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
                  {ACTIVITIES.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full mt-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: a.color }}>
                        {a.user.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs"><span className="font-bold" style={{ color: '#2F2B3D' }}>{a.user}</span> <span style={{ color: '#6B7280' }}>{a.action}</span></p>
                        <p className="text-[11px] mt-0.5 font-semibold" style={{ color: a.color }}>{a.ref}</p>
                      </div>
                      <p className="text-[11px] flex-shrink-0" style={{ color: '#9CA3AF' }}>{a.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Calendar + Chat */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
                <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Jadwal Hari Ini</h2>
                <span className="text-xs font-semibold" style={{ color: '#7C3AED' }}>{today}</span>
              </div>
              <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
                {EVENTS.map(e => (
                  <div key={e.title} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="flex-shrink-0 text-center w-12">
                      <p className="text-xs font-bold" style={{ color: '#7C3AED' }}>{e.time}</p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{e.duration}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#2F2B3D' }}>{e.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{e.attendees} peserta</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3">
                <button className="w-full py-2 rounded-xl text-xs font-semibold border" style={{ color: '#7C3AED', borderColor: 'rgba(124,58,237,.3)' }}>
                  <Calendar className="inline h-3.5 w-3.5 mr-1" /> Buka Kalender
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
                <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Chat Internal</h2>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#EA5455' }}>
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> 3 belum baca
                </span>
              </div>
              {[
                { ch: '#sales-team', msg: 'Budi: target hari ini sudah 80%!', time: '5 mnt lalu', unread: 2 },
                { ch: '#umum',       msg: 'Admin: pengumuman jam kerja...', time: '30 mnt lalu', unread: 1 },
                { ch: '#warehouse',  msg: 'Maya: stok Samsung A55 menipis', time: '1 jam lalu',  unread: 0 },
              ].map(c => (
                <div key={c.ch} className="flex items-center gap-3 px-5 py-3 border-b hover:bg-gray-50 cursor-pointer" style={{ borderColor: '#F5F4F9' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-[10px] font-bold" style={{ backgroundColor: 'rgba(124,58,237,.1)', color: '#7C3AED' }}>
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: '#2F2B3D' }}>{c.ch}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>{c.msg}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{c.time}</p>
                    {c.unread > 0 && <span className="inline-block mt-1 h-4 w-4 rounded-full text-[9px] font-bold text-white text-center leading-4" style={{ backgroundColor: '#7C3AED' }}>{c.unread}</span>}
                  </div>
                </div>
              ))}
              <div className="px-5 py-3">
                <button className="w-full py-2 rounded-xl text-xs font-semibold border" style={{ color: '#7C3AED', borderColor: 'rgba(124,58,237,.3)' }}>
                  <MessageCircle className="inline h-3.5 w-3.5 mr-1" /> Buka Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

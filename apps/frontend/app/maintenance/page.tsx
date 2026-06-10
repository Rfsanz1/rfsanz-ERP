'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell, { NavItem } from '../../components/layout/AppShell';
import {
  Wrench, BarChart2, Calendar, Package, Settings,
  CheckCircle, AlertTriangle, Clock, TrendingUp, Zap,
} from 'lucide-react';

const NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/maintenance',              icon: BarChart2 },
  { label: 'Permintaan',   href: '/maintenance/requests',     icon: Wrench, badge: 5 },
  { label: 'Jadwal',       href: '/maintenance/schedules',    icon: Calendar },
  { label: 'Peralatan',    href: '/maintenance/equipment',    icon: Package },
  { label: 'Laporan',      href: '/maintenance/reports',      icon: TrendingUp },
  { label: 'Pengaturan',   href: '/maintenance/settings',     icon: Settings },
];

const STATS = [
  { label: 'Permintaan Aktif',    value: '8',   sub: '3 mendesak',            color: '#F57F17', bg: 'rgba(245,127,23,.1)',  icon: Wrench },
  { label: 'Selesai Bulan Ini',   value: '34',  sub: '+6 vs bulan lalu',      color: '#4CAF50', bg: 'rgba(76,175,80,.1)',   icon: CheckCircle },
  { label: 'Jadwal Mendatang',    value: '12',  sub: '3 dalam 7 hari ke depan', color: '#2196F3', bg: 'rgba(33,150,243,.1)', icon: Calendar },
  { label: 'Total Peralatan',     value: '67',  sub: '5 dalam perbaikan',     color: '#9C27B0', bg: 'rgba(156,39,176,.1)',  icon: Package },
];

const REQUESTS = [
  { id: 'MNT-0158', equipment: 'Mesin Mixing Line 1',  issue: 'Getaran abnormal pada gear box',      priority: 'urgent',  technician: 'Iman S.',   status: 'in_progress', created: '24 Mei 2026' },
  { id: 'MNT-0157', equipment: 'Kompresor Udara #3',   issue: 'Tekanan drop di bawah 6 bar',         priority: 'urgent',  technician: 'Rudi P.',   status: 'in_progress', created: '23 Mei 2026' },
  { id: 'MNT-0156', equipment: 'Conveyor Belt B',      issue: 'Belt slip saat beban penuh',          priority: 'normal',  technician: 'Iman S.',   status: 'new',         created: '23 Mei 2026' },
  { id: 'MNT-0155', equipment: 'Panel Listrik Panel 4', issue: 'MCB trip berulang di jalur 3',       priority: 'urgent',  technician: 'Teguh W.',  status: 'new',         created: '22 Mei 2026' },
  { id: 'MNT-0154', equipment: 'Forklift Toyota #2',   issue: 'Hidrolik lambat saat angkat beban',  priority: 'normal',  technician: 'Rudi P.',   status: 'done',        created: '21 Mei 2026' },
];

const SCHEDULES = [
  { equipment: 'Mesin Mixing Line 1',  type: 'Preventif',  date: '28 Mei 2026', technician: 'Iman S.' },
  { equipment: 'Generator Cadangan',   type: 'Inspeksi',   date: '30 Mei 2026', technician: 'Teguh W.' },
  { equipment: 'Kompresor Udara #1',   type: 'Penggantian Oli', date: '1 Jun 2026', technician: 'Rudi P.' },
  { equipment: 'Crane Gudang',         type: 'Sertifikasi', date: '5 Jun 2026', technician: 'Iman S.' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  new:         { label: 'Baru',       color: '#9CA3AF', bg: 'rgba(165,163,174,.12)', icon: Clock },
  in_progress: { label: 'Dikerjakan', color: '#2196F3', bg: 'rgba(33,150,243,.1)',   icon: Wrench },
  done:        { label: 'Selesai',    color: '#4CAF50', bg: 'rgba(76,175,80,.1)',    icon: CheckCircle },
};

export default function MaintenanceDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  return (
    <AppShell
      appName="Pemeliharaan"
      appColor="#F57F17"
      appGradient="from-amber-500 to-amber-700"
      appIcon={Wrench}
      navItems={NAV}
      activeHref="/maintenance"
    >
      <div className="p-6 space-y-6">
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
          <div className="lg:col-span-2 bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
              <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Permintaan Pemeliharaan</h2>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#F57F17' }}>+ Permintaan Baru</button>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {REQUESTS.map(req => {
                const st = STATUS_MAP[req.status];
                const Icon = st.icon;
                return (
                  <div key={req.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: st.bg }}>
                      <Icon className="h-4 w-4" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: '#F57F17' }}>{req.id}</span>
                        {req.priority === 'urgent' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#EA5455' }}>Mendesak</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: '#2F2B3D' }}>{req.equipment}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{req.issue}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#B0AAB9' }}>Teknisi: {req.technician} · {req.created}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
              <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Jadwal Pemeliharaan</h2>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {SCHEDULES.map(sch => (
                <div key={sch.equipment} className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#2196F3' }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#2F2B3D' }}>{sch.equipment}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{sch.type} · {sch.date}</p>
                      <p className="text-[11px]" style={{ color: '#B0AAB9' }}>Teknisi: {sch.technician}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t" style={{ borderColor: '#EDE8F5' }}>
              <button className="w-full py-2 rounded-xl text-xs font-semibold border" style={{ color: '#F57F17', borderColor: 'rgba(245,127,23,.3)' }}>
                <Zap className="inline h-3.5 w-3.5 mr-1" />
                Tambah Jadwal
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

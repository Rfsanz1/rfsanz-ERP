'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell, { NavItem } from '../../components/layout/AppShell';
import {
  Layers, BarChart2, CheckSquare, Users, Flag, Settings,
  CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar,
} from 'lucide-react';

const NAV: NavItem[] = [
  { label: 'Dashboard',   href: '/project',             icon: BarChart2 },
  { label: 'Proyek',      href: '/project/projects',    icon: Layers },
  { label: 'Tugas',       href: '/project/tasks',       icon: CheckSquare, badge: 9 },
  { label: 'Milestone',   href: '/project/milestones',  icon: Flag },
  { label: 'Tim',         href: '/project/team',        icon: Users },
  { label: 'Laporan',     href: '/project/reports',     icon: TrendingUp },
  { label: 'Pengaturan',  href: '/project/settings',    icon: Settings },
];

const STATS = [
  { label: 'Proyek Aktif',   value: '7',  sub: '2 hampir deadline',   color: '#5C6BC0', bg: 'rgba(92,107,192,.1)',  icon: Layers },
  { label: 'Tugas Open',     value: '34', sub: '9 jatuh tempo hari ini', color: '#E53935', bg: 'rgba(229,57,53,.1)', icon: CheckSquare },
  { label: 'Selesai Minggu Ini', value: '18', sub: '+4 vs minggu lalu', color: '#4CAF50', bg: 'rgba(76,175,80,.1)', icon: CheckCircle },
  { label: 'Anggota Tim',    value: '12', sub: '3 departemen',         color: '#FF9800', bg: 'rgba(255,152,0,.1)',   icon: Users },
];

const PROJECTS = [
  { name: 'Implementasi ERP Fase 2',       code: 'ERP-F2',  progress: 68, tasks: 42, done: 29, deadline: '30 Jun 2026', status: 'on_track',   owner: 'Rudi H.' },
  { name: 'Website Redesign 2026',         code: 'WEB-26',  progress: 45, tasks: 18, done: 8,  deadline: '15 Jul 2026', status: 'on_track',   owner: 'Sari D.' },
  { name: 'Integrasi Marketplace',         code: 'MKT-INT', progress: 82, tasks: 25, done: 20, deadline: '31 Mei 2026', status: 'at_risk',    owner: 'Andi S.' },
  { name: 'Audit Sistem Keamanan',         code: 'SEC-24',  progress: 100, tasks: 12, done: 12, deadline: '20 Mei 2026', status: 'done',     owner: 'Budi P.' },
  { name: 'Training & Onboarding Q2',     code: 'HR-Q2',   progress: 33, tasks: 9,  done: 3,  deadline: '28 Jun 2026', status: 'on_track',   owner: 'Rina K.' },
];

const TASKS = [
  { title: 'Review desain UI modul Akuntansi',  project: 'ERP-F2',   assignee: 'Sari D.',  due: 'Hari ini',    priority: 'high',   stage: 'in_progress' },
  { title: 'Testing API integrasi marketplace', project: 'MKT-INT',  assignee: 'Andi S.',  due: 'Hari ini',    priority: 'urgent', stage: 'todo' },
  { title: 'Buat dokumentasi SOP keuangan',    project: 'ERP-F2',   assignee: 'Budi P.',  due: 'Besok',       priority: 'normal', stage: 'todo' },
  { title: 'Update konten halaman produk',     project: 'WEB-26',   assignee: 'Rudi H.',  due: '27 Mei',      priority: 'normal', stage: 'review' },
  { title: 'Prepare materi training modul HR', project: 'HR-Q2',    assignee: 'Rina K.',  due: '28 Mei',      priority: 'high',   stage: 'todo' },
];

const STATUS_PROJECT: Record<string, { label: string; color: string; bg: string }> = {
  on_track: { label: 'On Track', color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  at_risk:  { label: 'At Risk',  color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  delayed:  { label: 'Terlambat', color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
  done:     { label: 'Selesai',  color: '#9CA3AF', bg: 'rgba(165,163,174,.12)' },
};

const PRIORITY_MAP: Record<string, { color: string; label: string }> = {
  urgent: { color: '#EA5455', label: '🔴 Kritis' },
  high:   { color: '#FF9800', label: '🟠 Tinggi' },
  normal: { color: '#2196F3', label: '🔵 Normal' },
  low:    { color: '#9CA3AF', label: '⚪ Rendah' },
};

const STAGE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: 'To Do',      color: '#9CA3AF', bg: 'rgba(165,163,174,.12)' },
  in_progress: { label: 'In Progress', color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  review:      { label: 'Review',     color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  done:        { label: 'Selesai',    color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
};

export default function ProjectDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();


  return (
    <AppShell
      appName="Proyek"
      appColor="#5C6BC0"
      appGradient="from-indigo-500 to-indigo-700"
      appIcon={Layers}
      navItems={NAV}
      activeHref="/project"
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
              <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Daftar Proyek</h2>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#5C6BC0' }}>+ Proyek Baru</button>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {PROJECTS.map(proj => {
                const st = STATUS_PROJECT[proj.status];
                return (
                  <div key={proj.code} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#EDE8F5', color: '#5C6BC0' }}>{proj.code}</span>
                          <span className="text-xs font-bold truncate" style={{ color: '#2F2B3D' }}>{proj.name}</span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                          {proj.owner} · Deadline: {proj.deadline} · {proj.done}/{proj.tasks} tugas
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#EDE8F5' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${proj.progress}%`, backgroundColor: st.color }} />
                      </div>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#9CA3AF' }}>{proj.progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
              <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Tugas Hari Ini</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#EA5455' }}>9 open</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {TASKS.map((task, i) => {
                const pr = PRIORITY_MAP[task.priority];
                const st = STAGE_MAP[task.stage];
                return (
                  <div key={i} className="px-5 py-3.5">
                    <p className="text-xs font-semibold leading-snug" style={{ color: '#2F2B3D' }}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#EDE8F5', color: '#5C6BC0' }}>{task.project}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#9CA3AF' }}>
                        <Calendar className="h-2.5 w-2.5" />{task.due}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

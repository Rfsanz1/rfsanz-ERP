'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell, { NavItem } from '../../components/layout/AppShell';
import {
  Award, BarChart2, ClipboardCheck, AlertTriangle, Settings,
  CheckCircle, XCircle, Clock, TrendingUp, ShieldCheck,
} from 'lucide-react';

const NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/quality',              icon: BarChart2 },
  { label: 'Inspeksi',       href: '/quality/inspections',  icon: ClipboardCheck, badge: 6 },
  { label: 'Alert Kualitas', href: '/quality/alerts',       icon: AlertTriangle, badge: 3 },
  { label: 'Kontrol Poin',   href: '/quality/checkpoints',  icon: ShieldCheck },
  { label: 'Laporan',        href: '/quality/reports',      icon: TrendingUp },
  { label: 'Pengaturan',     href: '/quality/settings',     icon: Settings },
];

const STATS = [
  { label: 'Inspeksi Minggu Ini', value: '42',    sub: '38 lulus, 4 gagal',     color: '#1976D2', bg: 'rgba(25,118,210,.1)',   icon: ClipboardCheck },
  { label: 'Tingkat Kelulusan',   value: '90.5%', sub: '+1.2% vs minggu lalu',  color: '#4CAF50', bg: 'rgba(76,175,80,.1)',    icon: CheckCircle },
  { label: 'Alert Aktif',         value: '3',     sub: '1 kritis, 2 minor',     color: '#EA5455', bg: 'rgba(234,84,85,.1)',    icon: AlertTriangle },
  { label: 'Kontrol Poin',        value: '18',    sub: '5 lini produksi',       color: '#FF9800', bg: 'rgba(255,152,0,.1)',    icon: ShieldCheck },
];

const INSPECTIONS = [
  { id: 'QC-0342', product: 'Semen Custom Blend 25kg',  lot: 'LOT-2026-0234', inspector: 'Teguh W.',  result: 'passed',  date: '24 Mei 2026' },
  { id: 'QC-0341', product: 'Cat Interior Premium 5L',  lot: 'LOT-2026-0233', inspector: 'Nita S.',   result: 'failed',  date: '24 Mei 2026' },
  { id: 'QC-0340', product: 'Pipa PVC 3 inch',          lot: 'LOT-2026-0232', inspector: 'Teguh W.',  result: 'passed',  date: '23 Mei 2026' },
  { id: 'QC-0339', product: 'Bata Ringan AAC 60x20',    lot: 'LOT-2026-0231', inspector: 'Ahmad F.',  result: 'passed',  date: '23 Mei 2026' },
  { id: 'QC-0338', product: 'Keramik Floor 60x60',      lot: 'LOT-2026-0230', inspector: 'Nita S.',   result: 'pending', date: '23 Mei 2026' },
];

const ALERTS = [
  { id: 'ALT-012', title: 'Cat Interior batch LOT-0233 tidak lulus uji viskositas', severity: 'critical', product: 'Cat Interior Premium 5L', date: '24 Mei 2026' },
  { id: 'ALT-011', title: 'Deviasi dimensi pada Keramik Floor 60x60 > 0.5mm',       severity: 'minor',    product: 'Keramik Floor 60x60',     date: '23 Mei 2026' },
  { id: 'ALT-010', title: 'Kadar air semen melebihi batas atas spesifikasi',        severity: 'minor',    product: 'Semen Portland 40kg',     date: '22 Mei 2026' },
];

const RESULT_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  passed:  { label: 'Lulus',  color: '#4CAF50', bg: 'rgba(76,175,80,.1)',   icon: CheckCircle },
  failed:  { label: 'Gagal',  color: '#EA5455', bg: 'rgba(234,84,85,.1)',   icon: XCircle },
  pending: { label: 'Proses', color: '#FF9800', bg: 'rgba(255,152,0,.1)',   icon: Clock },
};

export default function QualityDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  return (
    <AppShell
      appName="Kontrol Kualitas"
      appColor="#1976D2"
      appGradient="from-blue-600 to-blue-800"
      appIcon={Award}
      navItems={NAV}
      activeHref="/quality"
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
              <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Inspeksi Terbaru</h2>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#1976D2' }}>+ Inspeksi Baru</button>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {INSPECTIONS.map(insp => {
                const r = RESULT_MAP[insp.result];
                const Icon = r.icon;
                return (
                  <div key={insp.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: r.bg }}>
                      <Icon className="h-4 w-4" style={{ color: r.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#2F2B3D' }}>{insp.product}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{insp.lot} · {insp.inspector} · {insp.date}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.bg, color: r.color }}>{r.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border" style={{ borderColor: '#EDE8F5' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#EDE8F5' }}>
              <h2 className="font-bold text-sm" style={{ color: '#2F2B3D' }}>Alert Kualitas</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(234,84,85,.1)', color: '#EA5455' }}>3 aktif</span>
            </div>
            <div className="divide-y" style={{ borderColor: '#EDE8F5' }}>
              {ALERTS.map(alt => (
                <div key={alt.id} className="px-5 py-4">
                  <div className="flex items-start gap-2 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: alt.severity === 'critical' ? '#EA5455' : '#FF9800' }} />
                    <p className="text-xs font-semibold leading-snug" style={{ color: '#2F2B3D' }}>{alt.title}</p>
                  </div>
                  <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{alt.product} · {alt.date}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: alt.severity === 'critical' ? 'rgba(234,84,85,.1)' : 'rgba(255,152,0,.1)', color: alt.severity === 'critical' ? '#EA5455' : '#FF9800' }}>
                    {alt.severity === 'critical' ? 'Kritis' : 'Minor'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

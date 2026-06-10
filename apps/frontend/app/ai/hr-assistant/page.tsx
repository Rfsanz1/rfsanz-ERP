'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { UserCheck, Users, CalendarCheck, TrendingUp, AlertCircle, Star, MessageSquare, FileText } from 'lucide-react';

const HR_INSIGHTS = [
  { title: 'Tingkat Kehadiran', value: '94.2%', sub: 'Target: 95%', status: 'warning', icon: CalendarCheck, color: '#F59E0B' },
  { title: 'Karyawan Aktif', value: '248', sub: '+3 bulan ini', status: 'good', icon: Users, color: '#22C55E' },
  { title: 'Turnover Rate', value: '4.1%', sub: 'Industri avg: 8%', status: 'good', icon: TrendingUp, color: '#3B82F6' },
  { title: 'Masa Cuti Tersisa', value: '1,840 hari', sub: 'Rata-rata 7.4 hari/karyawan', status: 'good', icon: Star, color: '#8B5CF6' },
];

const HR_RECOMMENDATIONS = [
  { msg: '12 karyawan memiliki masa kontrak berakhir dalam 30 hari — segera proses perpanjangan', priority: 'high' },
  { msg: 'Departemen Warehouse rata-rata lembur 14 jam/minggu — pertimbangkan penambahan staff', priority: 'medium' },
  { msg: '3 karyawan belum mengambil cuti tahunan >6 bulan — perlu diingatkan sesuai regulasi', priority: 'low' },
  { msg: 'Pelatihan K3 wajib untuk 28 karyawan baru yang belum tersertifikasi', priority: 'high' },
  { msg: 'BPJS Kesehatan 5 karyawan baru belum didaftarkan — deadline 30 Juni 2026', priority: 'high' },
];

const ATTENDANCE_DATA = [
  { dept: 'Sales', total: 45, hadir: 43, alpha: 0, izin: 2, sakit: 0 },
  { dept: 'Warehouse', total: 62, hadir: 58, alpha: 1, izin: 2, sakit: 1 },
  { dept: 'Finance', total: 18, hadir: 18, alpha: 0, izin: 0, sakit: 0 },
  { dept: 'HR & Admin', total: 12, hadir: 11, alpha: 0, izin: 1, sakit: 0 },
  { dept: 'IT', total: 8, hadir: 8, alpha: 0, izin: 0, sakit: 0 },
  { dept: 'Delivery', total: 35, hadir: 31, alpha: 2, izin: 1, sakit: 1 },
];

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: '#EF4444', bg: 'rgba(239,68,68,.08)', label: 'Prioritas Tinggi' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,.08)', label: 'Prioritas Sedang' },
  low: { color: '#22C55E', bg: 'rgba(34,197,94,.08)', label: 'Prioritas Rendah' },
};

export default function AiHrAssistantPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI HR Assistant" subtitle="Asisten cerdas untuk manajemen sumber daya manusia">
      <div className="space-y-6">
        {/* Banner */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', color: 'white' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI HR Assistant</h2>
              <p className="text-sm opacity-80">Analisis SDM real-time · 248 karyawan dipantau · Diperbarui setiap hari</p>
            </div>
          </div>
        </div>

        {/* HR Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HR_INSIGHTS.map((h, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: h.color + '15' }}>
                <h.icon className="h-4.5 w-4.5" style={{ color: h.color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: '#1E1B4B' }}>{h.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#6B7280' }}>{h.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{h.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Recommendations */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <AlertCircle className="h-4 w-4" style={{ color: '#6366F1' }} /> AI HR Recommendations
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {HR_RECOMMENDATIONS.map((r, i) => {
                const cfg = PRIORITY_CONFIG[r.priority];
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                    <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: '#1E1B4B' }}>{r.msg}</p>
                      <span className="text-[10px] font-semibold mt-1 inline-block" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Today */}
          <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                <CalendarCheck className="h-4 w-4" style={{ color: '#6366F1' }} /> Kehadiran Hari Ini per Departemen
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F5F3FF' }}>
                    {['Departemen', 'Total', 'Hadir', 'Izin', 'Alpha', 'Sakit', '%'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ATTENDANCE_DATA.map((d, i) => {
                    const pct = Math.round((d.hadir / d.total) * 100);
                    return (
                      <tr key={i} className="hover:bg-gray-50 transition-colors" style={{ borderTop: '1px solid #F0EDF8' }}>
                        <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#1E1B4B' }}>{d.dept}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: '#6B7280' }}>{d.total}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#22C55E' }}>{d.hadir}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: '#F59E0B' }}>{d.izin}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: '#EF4444' }}>{d.alpha}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: '#3B82F6' }}>{d.sakit}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-bold" style={{ color: pct >= 95 ? '#22C55E' : pct >= 90 ? '#F59E0B' : '#EF4444' }}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Lihat Data Karyawan', href: '/hr/employees', icon: Users, color: '#6366F1' },
            { label: 'Rekap Absensi', href: '/hr/attendances', icon: CalendarCheck, color: '#22C55E' },
            { label: 'Proses Payroll', href: '/hr/payrolls/batch', icon: FileText, color: '#F59E0B' },
            { label: 'Chat AI HR', href: '/ai/chatbot', icon: MessageSquare, color: '#5B52D1' },
          ].map((q, i) => (
            <a key={i} href={q.href} className="rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: q.color + '15' }}>
                <q.icon className="h-4.5 w-4.5" style={{ color: q.color }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>{q.label}</p>
            </a>
          ))}
        </div>
      </div>
    </OdooLayout>
  );
}

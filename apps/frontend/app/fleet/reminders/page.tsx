'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { FLEET_CONFIG, FLEET_NAV } from '../../../lib/nav-configs';
import { Bell, AlertTriangle, Check, MessageSquare } from 'lucide-react';

const C = FLEET_CONFIG.appColor;

const today = new Date();
const getDaysUntil = (dateStr: string) => {
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const REMINDERS = [
  { id: 1, vehicle: 'B 9012 GHI — Mitsubishi Colt Diesel', type: 'STNK', expire_date: '2025-06-20', driver: '-', status: 'expired' },
  { id: 2, vehicle: 'B 9012 GHI — Mitsubishi Colt Diesel', type: 'KIR', expire_date: '2025-05-10', driver: '-', status: 'expired' },
  { id: 3, vehicle: 'B 1234 ABC — Toyota Avanza', type: 'STNK', expire_date: '2025-08-15', driver: 'Agus Salim', status: 'soon' },
  { id: 4, vehicle: 'B 5678 DEF — Isuzu Elf', type: 'KIR', expire_date: '2025-09-15', driver: 'Budi Hartono', status: 'ok' },
  { id: 5, vehicle: 'B 3456 JKL — Honda Beat', type: 'STNK', expire_date: '2026-03-15', driver: 'Deni K.', status: 'ok' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  expired: { label: 'Kadaluarsa', color: '#EA5455', bg: 'rgba(234,84,85,.1)', icon: AlertTriangle },
  soon:    { label: 'Segera Habis', color: '#FF9800', bg: 'rgba(255,152,0,.1)', icon: Bell },
  ok:      { label: 'Masih Valid', color: '#4CAF50', bg: 'rgba(76,175,80,.1)', icon: Check },
};

export default function FleetRemindersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  if (!token) return null;

  const enriched = REMINDERS.map(r => {
    const days = getDaysUntil(r.expire_date);
    const status = days < 0 ? 'expired' : days <= 30 ? 'soon' : 'ok';
    return { ...r, status, days };
  });

  const expired = enriched.filter(r => r.status === 'expired');
  const soon = enriched.filter(r => r.status === 'soon');

  return (
    <AppShell {...FLEET_CONFIG} navItems={FLEET_NAV} activeHref="/fleet/reminders">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Reminder STNK & KIR</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Pantau masa berlaku dokumen kendaraan dan terima notifikasi otomatis</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <MessageSquare className="h-4 w-4" /> Kirim Notif WA
          </button>
        </div>

        {expired.length > 0 && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(234,84,85,.06)', border: '1.5px solid rgba(234,84,85,.2)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#EA5455' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#C62828' }}>{expired.length} Dokumen Sudah Kadaluarsa!</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Segera perpanjang dokumen berikut untuk menghindari denda atau tilang.</p>
            </div>
          </div>
        )}

        {soon.length > 0 && (
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(255,152,0,.06)', border: '1.5px solid rgba(255,152,0,.2)' }}>
            <Bell className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#FF9800' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#E65100' }}>{soon.length} Dokumen Akan Segera Habis</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Dokumen berikut akan habis dalam 30 hari. Segera proses perpanjangan.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Kadaluarsa', value: expired.length, color: '#EA5455' },
            { label: 'Segera Habis', value: soon.length, color: '#FF9800' },
            { label: 'Valid', value: enriched.filter(r => r.status === 'ok').length, color: '#4CAF50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Status Dokumen Kendaraan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Kendaraan', 'Tipe Dokumen', 'Tanggal Kadaluarsa', 'Driver', 'Sisa Hari', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.sort((a, b) => a.days - b.days).map(r => {
                  const s = STATUS_MAP[r.status];
                  const IconComp = s.icon;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-sm" style={{ color: '#1E1B4B' }}>{r.vehicle}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${C}15`, color: C }}>{r.type}</span>
                      </td>
                      <td className="px-6 py-3 text-sm" style={{ color: r.status === 'expired' ? '#EA5455' : '#1E1B4B' }}>
                        {new Date(r.expire_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 text-sm" style={{ color: '#6B7280' }}>{r.driver}</td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-sm" style={{ color: r.status === 'expired' ? '#EA5455' : r.status === 'soon' ? '#FF9800' : '#4CAF50' }}>
                          {r.days < 0 ? `${Math.abs(r.days)} hari lalu` : r.days === 0 ? 'Hari ini' : `${r.days} hari`}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold w-fit" style={{ color: s.color, backgroundColor: s.bg }}>
                          <IconComp className="h-3 w-3" />{s.label}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {r.status !== 'ok' && (
                          <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${C}15`, color: C }}>
                            Perpanjang
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

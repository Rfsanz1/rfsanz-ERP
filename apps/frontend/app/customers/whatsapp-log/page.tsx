'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

const LOGS = [
  { recipient: 'Budi Santoso',  phone: '0812-3456-7890', message: 'Order SO-0128 Anda telah dikonfirmasi.',       status: 'sent',    time: '24 Mei 09:32' },
  { recipient: 'Siti Rahayu',   phone: '0813-2345-6789', message: 'Invoice INV-2026-0891 jatuh tempo 28 Mei.',   status: 'sent',    time: '24 Mei 09:15' },
  { recipient: 'Ahmad Fauzi',   phone: '0815-3456-7891', message: 'Pengiriman DO-0141 sedang dalam perjalanan.', status: 'failed',  time: '24 Mei 08:58' },
  { recipient: 'Dewi Kusuma',   phone: '0811-4567-8902', message: 'Terima kasih atas pembayaran Anda.',          status: 'sent',    time: '23 Mei 16:20' },
  { recipient: 'Hari Pratama',  phone: '0817-5678-9013', message: 'Promo Mei: Diskon 5% untuk order di atas 5 jt.',status: 'pending',time: '23 Mei 10:00' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  sent:    { color: '#4CAF50', bg: 'rgba(76,175,80,.1)',   icon: CheckCircle, label: 'Terkirim' },
  failed:  { color: '#EA5455', bg: 'rgba(234,84,85,.1)',   icon: XCircle,     label: 'Gagal' },
  pending: { color: '#FF9800', bg: 'rgba(255,152,0,.1)',   icon: Clock,       label: 'Pending' },
};

export default function WhatsappLogPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers/whatsapp-log">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(37,211,102,.15)' }}>
            <MessageSquare className="h-5 w-5" style={{ color: '#25D366' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>WhatsApp Log</h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Riwayat notifikasi WhatsApp ke pelanggan</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                {['Penerima', 'Nomor', 'Pesan', 'Status', 'Waktu'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {LOGS.map((l, i) => {
                  const st = STATUS_STYLE[l.status];
                  return (
                    <tr key={i} style={{ borderBottom: i < LOGS.length - 1 ? '1px solid #F5F2FB' : 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FDFCFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td className="px-6 py-3.5 text-sm font-medium" style={{ color: '#1E1B4B' }}>{l.recipient}</td>
                      <td className="px-6 py-3.5 text-xs font-mono" style={{ color: '#9CA3AF' }}>{l.phone}</td>
                      <td className="px-6 py-3.5 text-xs max-w-xs" style={{ color: '#1E1B4B' }}>{l.message}</td>
                      <td className="px-6 py-3.5"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: st.color, backgroundColor: st.bg }}><st.icon className="h-3 w-3" />{st.label}</span></td>
                      <td className="px-6 py-3.5 text-xs" style={{ color: '#9CA3AF' }}>{l.time}</td>
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

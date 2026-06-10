'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

const LOGS = [
  { recipient: 'Budi Santoso', phone: '0812-3456-7890', message: 'Order SO-0128 Anda telah dikonfirmasi.',       status: 'sent',    time: '24 Mei 09:32' },
  { recipient: 'Siti Rahayu',  phone: '0813-2345-6789', message: 'Invoice INV-2026-0891 jatuh tempo 28 Mei.',   status: 'sent',    time: '24 Mei 09:15' },
  { recipient: 'Ahmad Fauzi',  phone: '0815-3456-7891', message: 'Pengiriman DO-0141 sedang dalam perjalanan.', status: 'failed',  time: '24 Mei 08:58' },
  { recipient: 'Dewi Kusuma',  phone: '0811-4567-8902', message: 'Terima kasih atas pembayaran Anda.',          status: 'sent',    time: '23 Mei 16:20' },
  { recipient: 'Hari Pratama', phone: '0817-5678-9013', message: 'Promo Mei: Diskon 5% untuk order di atas 5 jt.', status: 'pending', time: '23 Mei 10:00' },
];

const STATUS_STYLE: Record<string, { color: string; icon: any; label: string }> = {
  sent:    { color: '#10B981', icon: CheckCircle, label: 'Terkirim' },
  failed:  { color: '#EF4444', icon: XCircle,     label: 'Gagal' },
  pending: { color: '#F59E0B', icon: Clock,       label: 'Pending' },
};

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function WhatsappLogPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers/whatsapp-log">
      <div style={{ maxWidth: 1000 }} className="space-y-5">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,211,102,0.12)' }}>
            <MessageSquare size={18} style={{ color: '#25D366' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>WhatsApp Log</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>Riwayat notifikasi WhatsApp ke pelanggan</p>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Penerima','Nomor','Pesan','Status','Waktu'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOGS.map((l, i) => {
                  const st = STATUS_STYLE[l.status];
                  const StIcon = st.icon;
                  return (
                    <tr key={i} style={{ borderBottom: i < LOGS.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{l.recipient}</td>
                      <td style={{ padding: '12px 20px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{l.phone}</td>
                      <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280 }}>{l.message}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: st.color, background: st.color + '1A' }}>
                          <StIcon size={11} /> {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)' }}>{l.time}</td>
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

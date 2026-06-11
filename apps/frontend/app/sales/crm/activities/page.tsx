'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Plus, RefreshCw, Phone, Mail, Users, Calendar, MessageSquare } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const TYPE_CFG: Record<string, { icon: typeof Phone; label: string; color: string }> = {
  call:    { icon: Phone,    label: 'Telepon',  color: '#3B82F6' },
  email:   { icon: Mail,     label: 'Email',    color: '#8B5CF6' },
  meeting: { icon: Users,    label: 'Meeting',  color: '#22C55E' },
  followup:{ icon: Calendar, label: 'Follow-up',color: '#F59E0B' },
  note:    { icon: MessageSquare, label: 'Catatan', color: '#94A3B8' },
};

const DEMO: any[] = [
  { id: 'a1', type: 'call',    customerName: 'PT Maju Sejahtera', subject: 'Follow-up order Q1',       date: '2024-01-15T10:00', duration: 15, notes: 'Sudah konfirmasi order SO-001' },
  { id: 'a2', type: 'meeting', customerName: 'CV Berkah Jaya',    subject: 'Presentasi produk baru',    date: '2024-01-14T14:30', duration: 60, notes: 'Tertarik produk premium, minta proposal' },
  { id: 'a3', type: 'email',   customerName: 'Toko Bangunan',     subject: 'Pengiriman penawaran harga', date: '2024-01-13T09:15', duration: null, notes: 'Kirim quotation QUO-003' },
  { id: 'a4', type: 'followup',customerName: 'UD Subur Makmur',   subject: 'Tagihan jatuh tempo',       date: '2024-01-12T16:00', duration: 10, notes: 'Janji bayar minggu depan' },
];

export default function ActivitiesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/crm/activities?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>Aktivitas</h2>
          <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>{rows.length} aktivitas tercatat</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}><RefreshCw size={13} /></button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Log Aktivitas
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(act => {
            const cfg = TYPE_CFG[act.type] ?? TYPE_CFG.note;
            return (
              <div key={act.id} style={{ backgroundColor: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = cfg.color; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 12px ${cfg.color}16`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <cfg.icon size={16} style={{ color: cfg.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.textDark }}>{act.subject}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}15` }}>{cfg.label}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.textMid, margin: '0 0 4px' }}>{act.customerName}</p>
                  {act.notes && <p style={{ fontSize: 12, color: C.textLight, margin: 0, fontStyle: 'italic' }}>{act.notes}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 11.5, color: C.textLight, margin: '0 0 3px' }}>{formatDate(act.date)}</p>
                  {act.duration && <p style={{ fontSize: 11, color: C.textLight, margin: 0 }}>{act.duration} menit</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

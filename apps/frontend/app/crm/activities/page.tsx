'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Calendar, Phone, Mail, CheckCircle, Clock, Plus } from 'lucide-react';

const ACTIVITIES = [
  { type: 'call',    title: 'Follow up Budi Santoso',          due: 'Hari ini, 10:00',  lead: 'PT Maju Sejahtera',  done: false },
  { type: 'email',   title: 'Kirim proposal ke Dewi Kusuma',   due: 'Hari ini, 14:00',  lead: 'PT Global Mandiri',  done: false },
  { type: 'meeting', title: 'Demo produk - CV Berkah Utama',   due: 'Besok, 09:00',     lead: 'CV Berkah Utama',    done: false },
  { type: 'call',    title: 'Check up Ahmad Fauzi',            due: '26 Jun, 11:00',    lead: 'UD Karya Bersama',   done: false },
  { type: 'email',   title: 'Follow up Hari Pratama',          due: '27 Jun, 10:00',    lead: 'CV Sentosa Jaya',    done: false },
  { type: 'call',    title: 'Closing call Siti Rahayu',        due: '23 Jun, 15:00',    lead: 'CV Berkah Utama',    done: true  },
];

const TYPE_ICON   = { call: Phone, email: Mail, meeting: Calendar };
const TYPE_COLOR  = { call: '#3B82F6', email: '#10B981', meeting: '#F59E0B' };
const TYPE_LABEL  = { call: 'Panggilan', email: 'Email', meeting: 'Meeting' };

export default function CrmActivitiesPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [items, setItems] = useState(ACTIVITIES);



  const toggle = (i: number) => setItems(a => a.map((x, j) => j === i ? { ...x, done: !x.done } : x));

  const pending = items.filter(a => !a.done).length;
  const done    = items.filter(a => a.done).length;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/activities">
      <div style={{ maxWidth: 760 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Aktivitas CRM</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Jadwal panggilan, email, dan meeting</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Aktivitas Baru
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Aktivitas', value: items.length, accent: '#6366F1' },
            { label: 'Tertunda',        value: pending,       accent: '#F59E0B' },
            { label: 'Selesai',         value: done,          accent: '#10B981' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Activity List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((a, i) => {
            const Icon  = TYPE_ICON[a.type as keyof typeof TYPE_ICON] ?? Calendar;
            const color = TYPE_COLOR[a.type as keyof typeof TYPE_COLOR] ?? '#94A3B8';
            const label = TYPE_LABEL[a.type as keyof typeof TYPE_LABEL] ?? a.type;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', opacity: a.done ? 0.55 : 1, transition: 'opacity .15s' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 3px', textDecoration: a.done ? 'line-through' : 'none' }}>{a.title}</p>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.lead}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '1A', padding: '2px 8px', borderRadius: 100 }}>{label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.due}</span>
                  </div>
                  <button onClick={() => toggle(i)}
                    style={{ width: 22, height: 22, borderRadius: 11, border: a.done ? 'none' : '2px solid var(--border)', background: a.done ? '#10B981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    {a.done && <CheckCircle size={16} style={{ color: '#fff' }} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

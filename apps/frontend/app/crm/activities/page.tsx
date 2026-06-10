'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { Calendar, Phone, Mail, CheckCircle, Clock, Plus } from 'lucide-react';

const ACTIVITIES = [
  { type: 'call',    title: 'Follow up Budi Santoso',        due: 'Hari ini, 10:00',  lead: 'PT Maju Sejahtera',   done: false },
  { type: 'email',   title: 'Kirim proposal ke Dewi Kusuma', due: 'Hari ini, 14:00',  lead: 'PT Global Mandiri',   done: false },
  { type: 'meeting', title: 'Demo produk - CV Berkah Utama', due: 'Besok, 09:00',     lead: 'CV Berkah Utama',     done: false },
  { type: 'call',    title: 'Check up Ahmad Fauzi',          due: '26 Mei, 11:00',    lead: 'UD Karya Bersama',    done: false },
  { type: 'email',   title: 'Follow up Hari Pratama',        due: '27 Mei, 10:00',    lead: 'CV Sentosa Jaya',     done: false },
  { type: 'call',    title: 'Closing call Siti Rahayu',      due: '23 Mei, 15:00',    lead: 'CV Berkah Utama',     done: true  },
];

const TYPE_ICON = { call: Phone, email: Mail, meeting: Calendar };
const TYPE_COLOR = { call: '#2196F3', email: '#4CAF50', meeting: '#FF9800' };

export default function CrmActivitiesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/activities">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Aktivitas CRM</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Jadwal panggilan, email, dan meeting</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: CRM_CONFIG.appColor }}>
            <Plus className="h-4 w-4" /> Aktivitas Baru
          </button>
        </div>
        <div className="space-y-3">
          {ACTIVITIES.map((a, i) => {
            const Icon = TYPE_ICON[a.type as keyof typeof TYPE_ICON] ?? Calendar;
            const color = TYPE_COLOR[a.type as keyof typeof TYPE_COLOR] ?? '#9CA3AF';
            return (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', opacity: a.done ? 0.55 : 1 }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: `${color}1A` }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#1E1B4B', textDecoration: a.done ? 'line-through' : 'none' }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{a.lead}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" style={{ color: '#9CA3AF' }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{a.due}</span>
                  </div>
                  {a.done
                    ? <CheckCircle className="h-5 w-5" style={{ color: '#4CAF50' }} />
                    : <button className="flex h-5 w-5 items-center justify-center rounded-full" style={{ border: '2px solid #EDE8F5' }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

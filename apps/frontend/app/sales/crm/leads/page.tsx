'use client';
import { useEffect, useState, useCallback } from 'react';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { Plus, Search, RefreshCw, Phone, Mail, Star } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  new:         { label: 'Baru',      color: '#3B82F6' },
  contacted:   { label: 'Dihubungi', color: '#8B5CF6' },
  qualified:   { label: 'Qualified', color: '#F59E0B' },
  proposal:    { label: 'Proposal',  color: '#22C55E' },
  unqualified: { label: 'Tidak Fit', color: '#EF4444' },
};

const DEMO: any[] = [
  { id: 'l1', name: 'Budi Santoso',   company: 'PT Bangunan Maju',  phone: '0812-3456-7890', email: 'budi@bangunanmaju.co.id', source: 'Website',   status: 'new',       score: 7 },
  { id: 'l2', name: 'Siti Rahayu',    company: 'CV Konstruksi Jaya', phone: '0823-4567-8901', email: 'siti@konstruksi.co.id',  source: 'Referral',  status: 'contacted', score: 8 },
  { id: 'l3', name: 'Ahmad Fauzi',    company: 'UD Sejahtera',       phone: '0834-5678-9012', email: 'ahmad@ud-sejahtera.com', source: 'Cold Call', status: 'qualified', score: 6 },
  { id: 'l4', name: 'Dewi Lestari',   company: 'PT Properti Unggul', phone: '0845-6789-0123', email: 'dewi@properti.co.id',    source: 'Event',     status: 'proposal',  score: 9 },
];

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#9CA3AF' };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18` }}>{cfg.label}</span>;
}

export default function LeadsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/crm/leads?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    !search || (r.name + (r.company ?? '') + (r.email ?? '')).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SalesLayout title="Leads CRM" subtitle="Kelola prospek dan lead baru">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>Leads</h2>
          <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>{rows.length} leads terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}><RefreshCw size={13} /></button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Lead Baru
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / perusahaan / email…"
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 13, boxSizing: 'border-box', color: C.textDark }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map(lead => (
            <div key={lead.id} style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 18, cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${C.primary}18`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${C.primary}30,${C.primary}15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {lead.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: C.textDark, margin: 0 }}>{lead.name}</p>
                    <p style={{ fontSize: 11.5, color: C.textMid, margin: 0 }}>{lead.company ?? '–'}</p>
                  </div>
                </div>
                <Badge status={lead.status} />
              </div>
              {lead.phone && <p style={{ fontSize: 12, color: C.textMid, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} />{lead.phone}</p>}
              {lead.email && <p style={{ fontSize: 12, color: C.textMid, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} />{lead.email}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11.5, color: C.textLight }}>Sumber: <strong>{lead.source}</strong></span>
                {lead.score != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={11} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textDark }}>{lead.score}/10</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: C.textLight }}>Tidak ada leads ditemukan</div>}
        </div>
      )}
    </SalesLayout>
  );
}

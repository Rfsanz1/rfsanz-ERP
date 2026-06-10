'use client';
import { useEffect, useState } from 'react';
import { SalesLayout } from '@/components/SalesLayout';
import api from '@/lib/api';
import { RefreshCw, TrendingUp } from 'lucide-react';

const C = { primary: '#7C3AED', border: '#EDE9FE', textDark: '#1E1B4B', textMid: '#6B7280', textLight: '#9CA3AF' };

const STAGES = [
  { key: 'lead',       label: 'Lead',        color: '#94A3B8' },
  { key: 'prospect',   label: 'Prospect',    color: '#3B82F6' },
  { key: 'negotiation',label: 'Negosiasi',   color: '#F59E0B' },
  { key: 'proposal',   label: 'Proposal',    color: '#8B5CF6' },
  { key: 'closing',    label: 'Closing',     color: '#22C55E' },
  { key: 'won',        label: 'Won',         color: '#16A34A' },
  { key: 'lost',       label: 'Lost',        color: '#EF4444' },
];

const DEMO_PIPELINE = [
  { id: 'opp1', name: 'Proyek Gedung A', customerName: 'PT Maju Sejahtera',   value: 150000000, stage: 'negotiation', probability: 60 },
  { id: 'opp2', name: 'Renovasi Kantor B', customerName: 'CV Berkah Jaya',    value: 75000000,  stage: 'proposal',    probability: 80 },
  { id: 'opp3', name: 'Pembangunan Villa', customerName: 'PT Karya Abadi',    value: 200000000, stage: 'prospect',    probability: 30 },
  { id: 'opp4', name: 'Supply Material Q1', customerName: 'Toko Bangunan',   value: 50000000,  stage: 'closing',     probability: 90 },
  { id: 'opp5', name: 'Kontrak Tahunan', customerName: 'UD Subur Makmur',     value: 300000000, stage: 'lead',        probability: 20 },
  { id: 'opp6', name: 'Proyek Perumahan',  customerName: 'PT Properti Jaya', value: 450000000, stage: 'won',         probability: 100 },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/crm/pipeline').then(r => setDeals(r.data?.data ?? r.data ?? [])).catch(() => setDeals(DEMO_PIPELINE)).finally(() => setLoading(false));
  }, []);

  const formatRp = (v: number) => v >= 1e9 ? `Rp ${(v / 1e9).toFixed(1)} M` : v >= 1e6 ? `Rp ${(v / 1e6).toFixed(0)} Jt` : `Rp ${v.toLocaleString('id-ID')}`;

  const stagesWithDeals = STAGES.map(s => ({
    ...s,
    deals: deals.filter(d => d.stage === s.key),
    total: deals.filter(d => d.stage === s.key).reduce((sum, d) => sum + (d.value ?? 0), 0),
  }));

  return (
    <SalesLayout title="Pipeline CRM" subtitle="Pantau alur peluang penjualan">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark, margin: '0 0 4px' }}>Pipeline CRM</h2>
          <p style={{ fontSize: 13, color: C.textLight, margin: 0 }}>Total {deals.length} peluang aktif · Nilai: {formatRp(deals.reduce((s, d) => s + (d.value ?? 0), 0))}</p>
        </div>
        <button onClick={() => setLoading(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {stagesWithDeals.map(stage => (
          <div key={stage.key} style={{ minWidth: 220, maxWidth: 260, flex: '0 0 220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px 12px 0 0', backgroundColor: `${stage.color}18`, border: `1.5px solid ${stage.color}30`, borderBottom: 'none' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: stage.color, margin: '0 0 2px', textTransform: 'uppercase' }}>{stage.label}</p>
                <p style={{ fontSize: 11, color: C.textLight, margin: 0 }}>{stage.deals.length} deal</p>
              </div>
              <div style={{ backgroundColor: stage.color, color: '#fff', borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{stage.deals.length}</div>
            </div>

            <div style={{ backgroundColor: '#fff', border: `1.5px solid ${stage.color}30`, borderTop: 'none', borderRadius: '0 0 12px 12px', minHeight: 100, padding: 8 }}>
              {loading ? (
                <p style={{ textAlign: 'center', color: C.textLight, fontSize: 12, padding: 16 }}>…</p>
              ) : stage.deals.length === 0 ? (
                <p style={{ textAlign: 'center', color: C.textLight, fontSize: 12, padding: 16 }}>Tidak ada deal</p>
              ) : (
                stage.deals.map(deal => (
                  <div key={deal.id} style={{ backgroundColor: '#FAFAFA', border: `1px solid #F3F4F6`, borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = stage.color)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#F3F4F6')}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: C.textDark, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.name}</p>
                    <p style={{ fontSize: 11, color: C.textMid, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.customerName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: stage.color }}>{formatRp(deal.value ?? 0)}</span>
                      {deal.probability != null && <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: `${stage.color}15`, color: stage.color, padding: '1px 6px', borderRadius: 100 }}>{deal.probability}%</span>}
                    </div>
                  </div>
                ))
              )}
              {stage.total > 0 && (
                <div style={{ padding: '6px 8px', borderTop: `1px solid ${stage.color}20`, marginTop: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: stage.color, margin: 0 }}>{formatRp(stage.total)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SalesLayout>
  );
}

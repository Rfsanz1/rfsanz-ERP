'use client';
import { useEffect, useState, useCallback } from 'react';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { Clock, Search, RefreshCw, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Package } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const TYPE_CFG: Record<string, { icon: typeof ArrowDownRight; label: string; color: string }> = {
  inbound:  { icon: ArrowDownRight, label: 'Masuk',    color: '#22C55E' },
  outbound: { icon: ArrowUpRight,   label: 'Keluar',   color: '#EF4444' },
  transfer: { icon: ArrowLeftRight, label: 'Transfer', color: '#3B82F6' },
  adjustment:{ icon: Package,       label: 'Adjust',   color: '#F59E0B' },
};

const DEMO: any[] = [
  { id: 'h1', type: 'inbound',    productName: 'Semen Gresik 40kg',   qty: 100, unit: 'Sak', reference: 'PO-2024-001', warehouse: 'Gudang Utama',   createdAt: '2024-01-15T10:30' },
  { id: 'h2', type: 'outbound',   productName: 'Besi Beton 10mm',     qty: 20,  unit: 'Btg', reference: 'SO-2024-002', warehouse: 'Gudang Utama',   createdAt: '2024-01-14T14:00' },
  { id: 'h3', type: 'transfer',   productName: 'Cat Tembok 5L',       qty: 10,  unit: 'Kal', reference: 'TRF-2024-001', warehouse: 'Gudang Utama',  createdAt: '2024-01-13T09:15' },
  { id: 'h4', type: 'adjustment', productName: 'Triplek 18mm',        qty: 5,   unit: 'Lbr', reference: 'OPN-2024-001', warehouse: 'Gudang Utama',  createdAt: '2024-01-12T16:45' },
  { id: 'h5', type: 'inbound',    productName: 'Pipa PVC 2.5 inch',   qty: 50,  unit: 'Btg', reference: 'PO-2024-002', warehouse: 'Gudang Selatan', createdAt: '2024-01-11T11:00' },
];

export default function HistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/movements?limit=50');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r =>
    (!typeFilter || r.type === typeFilter) &&
    (!search || (r.productName + (r.reference ?? '')).toLowerCase().includes(search.toLowerCase()))
  );
  const formatDate = (v: string) => v ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';

  return (
    <GudangLayout title="Riwayat Mutasi" subtitle="Semua pergerakan stok">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>Riwayat Mutasi</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: 0 }}>{rows.length} mutasi tercatat</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 18px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk / referensi…"
            style={{ width: '100%', height: 48, padding: '0 14px 0 42px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, boxSizing: 'border-box', color: C.dark, backgroundColor: '#fff' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ height: 48, padding: '0 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, cursor: 'pointer', color: C.textMid, backgroundColor: '#fff' }}>
          <option value="">Semua Tipe</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
        : filtered.map(r => {
          const cfg = TYPE_CFG[r.type] ?? TYPE_CFG.adjustment;
          return (
            <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 12, border: `1.5px solid ${C.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <cfg.icon size={16} style={{ color: cfg.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.dark }}>{r.productName}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}15` }}>{cfg.label}</span>
                </div>
                <p style={{ fontSize: 12, color: C.textMid, margin: 0 }}>{r.reference} · {r.warehouse}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: r.type === 'outbound' ? '#EF4444' : '#22C55E', margin: '0 0 2px' }}>
                  {r.type === 'outbound' ? '−' : '+'}{r.qty} {r.unit}
                </p>
                <p style={{ fontSize: 11, color: C.textLight, margin: 0 }}>{formatDate(r.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: C.textLight }}>Tidak ada riwayat</div>}
      </div>
    </GudangLayout>
  );
}

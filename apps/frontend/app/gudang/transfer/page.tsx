'use client';
import { useEffect, useState, useCallback } from 'react';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { ArrowLeftRight, Plus, RefreshCw, Search } from 'lucide-react';
import { GudangSkeletonCards } from '@/components/ui/Skeletons';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Menunggu',  color: '#F59E0B' },
  approved:  { label: 'Disetujui', color: '#3B82F6' },
  completed: { label: 'Selesai',   color: '#22C55E' },
  cancelled: { label: 'Batal',     color: '#EF4444' },
};

const DEMO: any[] = [
  { id: 'tr1', transferNumber: 'TRF-2024-001', fromWarehouse: 'Gudang Utama',          toWarehouse: 'Gudang Cabang Selatan', itemCount: 3, status: 'pending',   createdAt: '2024-01-15' },
  { id: 'tr2', transferNumber: 'TRF-2024-002', fromWarehouse: 'Gudang Cabang Selatan', toWarehouse: 'Gudang Utama',          itemCount: 5, status: 'approved',  createdAt: '2024-01-14' },
  { id: 'tr3', transferNumber: 'TRF-2024-003', fromWarehouse: 'Gudang Utama',          toWarehouse: 'Gudang Cabang Timur',   itemCount: 2, status: 'completed', createdAt: '2024-01-13' },
];

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: '#9CA3AF' };
  return <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18` }}>{cfg.label}</span>;
}

export default function TransferPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/transfers?limit=30');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r => !search || (r.transferNumber + (r.fromWarehouse ?? '') + (r.toWarehouse ?? '')).toLowerCase().includes(search.toLowerCase()));
  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <GudangLayout title="Transfer Stok" subtitle="Perpindahan barang antar gudang">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>Transfer Stok</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: 0 }}>{rows.length} transfer terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 14, cursor: 'pointer' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 20px', borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Transfer Baru
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.textLight }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari no. transfer / gudang…"
          style={{ width: '100%', height: 48, padding: '0 14px 0 42px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, boxSizing: 'border-box', color: C.dark, backgroundColor: '#fff' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? <GudangSkeletonCards count={5} border={C.border} accent={C.primary} />
        : filtered.map(r => (
          <div key={r.id} style={{ backgroundColor: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${C.primary}15`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowLeftRight size={18} style={{ color: C.primary }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{r.transferNumber}</span>
                <Badge status={r.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12.5, color: C.textMid }}>{r.fromWarehouse}</span>
                <ArrowLeftRight size={12} style={{ color: C.textLight }} />
                <span style={{ fontSize: 12.5, color: C.textMid }}>{r.toWarehouse}</span>
              </div>
              <p style={{ fontSize: 12, color: C.textLight, margin: '2px 0 0' }}>{r.itemCount} item · {formatDate(r.createdAt)}</p>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 48, color: C.textLight }}>Tidak ada transfer</div>}
      </div>
    </GudangLayout>
  );
}

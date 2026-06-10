'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { ClipboardCheck, RefreshCw, Plus, Calendar, User } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  scheduled:   { label: 'Terjadwal',    color: '#3B82F6' },
  in_progress: { label: 'Sedang Jalan', color: '#F59E0B' },
  completed:   { label: 'Selesai',      color: '#22C55E' },
  cancelled:   { label: 'Dibatalkan',   color: '#EF4444' },
};

const DEMO: any[] = [
  { id: 'op1', opnameNumber: 'OPN-2024-001', warehouseName: 'Gudang Utama',          scheduledDate: '2024-01-20', status: 'scheduled',   itemCount: 250, assignedTo: 'Tim A', createdAt: '2024-01-10' },
  { id: 'op2', opnameNumber: 'OPN-2024-002', warehouseName: 'Gudang Cabang Selatan', scheduledDate: '2024-01-18', status: 'in_progress', itemCount: 120, assignedTo: 'Tim B', createdAt: '2024-01-09' },
  { id: 'op3', opnameNumber: 'OPN-2023-012', warehouseName: 'Gudang Utama',          scheduledDate: '2023-12-30', status: 'completed',   itemCount: 248, assignedTo: 'Tim A', createdAt: '2023-12-20' },
];

export default function StockOpnamePage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState('');
  const [newDate, setNewDate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/stock-opname?limit=20');
      const data = res.data?.data ?? res.data?.items ?? res.data;
      setRows(Array.isArray(data) ? data : DEMO);
    } catch { setRows(DEMO); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newWarehouse || !newDate) { alert('Pilih gudang dan tanggal.'); return; }
    setCreating(true);
    try {
      const res = await api.post('/inventory/stock-opname', { warehouseName: newWarehouse, scheduledDate: newDate });
      const id = res.data?.id ?? res.data?.data?.id ?? 'demo';
      router.push(`/gudang/stock-opname/${id}`);
    } catch {
      router.push('/gudang/stock-opname/demo');
    } finally { setCreating(false); setShowForm(false); }
  };

  const formatDate = (v: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '–';

  return (
    <GudangLayout title="Stock Opname" subtitle="Verifikasi stok fisik">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>Stock Opname</h2>
          <p style={{ fontSize: 14, color: C.textLight, margin: 0 }}>Jadwal dan riwayat penghitungan stok fisik</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 14, cursor: 'pointer' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 20px', borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Opname Baru
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `2px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: '0 0 16px' }}>Jadwalkan Opname Baru</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select value={newWarehouse} onChange={e => setNewWarehouse(e.target.value)}
              style={{ flex: 1, minWidth: 200, height: 48, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, backgroundColor: '#fff', color: C.dark }}>
              <option value="">Pilih Gudang…</option>
              {['Gudang Utama', 'Gudang Cabang Selatan', 'Gudang Cabang Timur'].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              style={{ flex: 1, minWidth: 160, height: 48, padding: '0 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, outline: 'none', fontSize: 14, color: C.dark }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreate} disabled={creating}
                style={{ height: 48, padding: '0 20px', borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontSize: 14, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Membuat…' : 'Buat'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ height: 48, padding: '0 16px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 14, cursor: 'pointer' }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div>
        : rows.map(r => {
          const cfg = STATUS_CFG[r.status] ?? { label: r.status, color: '#9CA3AF' };
          return (
            <div key={r.id} onClick={() => router.push(`/gudang/stock-opname/${r.id}`)}
              style={{ backgroundColor: '#fff', borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '18px 22px', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${C.primary}15`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ClipboardCheck size={16} style={{ color: C.primary }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: C.dark, margin: 0 }}>{r.opnameNumber}</h3>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 10px', borderRadius: 100, color: cfg.color, backgroundColor: `${cfg.color}18` }}>{cfg.label}</span>
                </div>
                <p style={{ fontSize: 13.5, color: C.textMid, margin: '0 0 4px' }}>{r.warehouseName}</p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: C.textLight, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {formatDate(r.scheduledDate)}</span>
                  <span style={{ fontSize: 12, color: C.textLight, display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {r.assignedTo}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: C.primary, margin: '0 0 2px' }}>{r.itemCount}</p>
                <p style={{ fontSize: 11, color: C.textLight, margin: 0 }}>item</p>
              </div>
            </div>
          );
        })}
      </div>
    </GudangLayout>
  );
}

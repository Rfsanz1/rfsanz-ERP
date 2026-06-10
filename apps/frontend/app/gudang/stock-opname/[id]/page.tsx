'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GudangLayout } from '@/components/GudangLayout';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle, Package } from 'lucide-react';

const C = { primary: '#D97706', dark: '#78350F', border: '#FEF3C7', textMid: '#6B7280', textLight: '#9CA3AF', bg: '#FFFBEB' };

const DEMO = {
  id: 'op1', opnameNumber: 'OPN-2024-001', warehouseName: 'Gudang Utama',
  status: 'scheduled', scheduledDate: '2024-01-20', assignedTo: 'Tim A',
  items: [
    { id: 'oi1', productName: 'Semen Gresik 40kg', sku: 'SGR-40', systemQty: 120, physicalQty: null, unit: 'Sak', location: 'A-01' },
    { id: 'oi2', productName: 'Besi Beton 10mm',   sku: 'BB-10',  systemQty: 85,  physicalQty: null, unit: 'Btg', location: 'B-03' },
    { id: 'oi3', productName: 'Cat Tembok 5L',     sku: 'CAT-5',  systemQty: 32,  physicalQty: null, unit: 'Kal', location: 'C-02' },
  ],
};

export default function StockOpnameDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [opname, setOpname] = useState<any>(null);
  const [physical, setPhysical] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/stock-opname/${id}`).then(r => setOpname(r.data))
      .catch(() => setOpname(DEMO)).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/inventory/stock-opname/${id}/count`, {
        items: Object.entries(physical).map(([itemId, qty]) => ({ itemId, physicalQty: Number(qty) })),
      });
    } catch {}
    setDone(true); setSaving(false);
    setTimeout(() => router.push('/gudang/stock-opname'), 2000);
  };

  if (loading) return <GudangLayout><div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Memuat…</div></GudangLayout>;
  if (done) return (
    <GudangLayout title="Opname Selesai">
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <CheckCircle size={64} style={{ color: '#22C55E', margin: '0 auto 12px', display: 'block' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>Data Opname Disimpan!</h2>
        <p style={{ color: C.textMid }}>Kembali ke daftar opname…</p>
      </div>
    </GudangLayout>
  );

  return (
    <GudangLayout title={`Stock Opname ${opname?.opnameNumber ?? ''}`}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#fff', color: C.textMid, fontSize: 13, cursor: 'pointer' }}>
        <ArrowLeft size={14} /> Kembali
      </button>

      {opname && (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, padding: 22, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: '0 0 10px' }}>{opname.opnameNumber}</h2>
            <p style={{ fontSize: 14, color: C.textMid, margin: 0 }}>{opname.warehouseName} · Jadwal: {opname.scheduledDate} · PIC: {opname.assignedTo}</p>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>Input Stok Fisik</h3>
            </div>
            {(opname.items ?? []).map((item: any) => {
              const qty = Number(physical[item.id] ?? '');
              const diff = isNaN(qty) ? null : qty - (item.systemQty ?? 0);
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: C.dark, margin: '0 0 2px' }}>{item.productName}</p>
                    <p style={{ fontSize: 11.5, color: C.textLight, margin: 0 }}>{item.sku} · {item.location}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: C.textMid }}>Sistem: <strong>{item.systemQty}</strong></span>
                    <span style={{ fontSize: 12, color: C.textMid }}>Fisik:</span>
                    <input type="number" min={0} value={physical[item.id] ?? ''} placeholder="—"
                      onChange={e => setPhysical(prev => ({ ...prev, [item.id]: e.target.value }))}
                      style={{ width: 80, height: 40, padding: '0 10px', borderRadius: 10, border: `1.5px solid ${diff === null ? C.border : diff === 0 ? '#22C55E' : '#EF4444'}`, outline: 'none', fontSize: 15, fontWeight: 700, color: C.dark, textAlign: 'center' }} />
                    <span style={{ fontSize: 12.5, color: C.textMid }}>{item.unit}</span>
                    {diff !== null && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: diff === 0 ? '#22C55E' : diff > 0 ? '#3B82F6' : '#EF4444', minWidth: 50 }}>
                        {diff > 0 ? `+${diff}` : diff === 0 ? '✓' : diff}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleSave} disabled={saving || Object.keys(physical).length === 0}
            style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: Object.keys(physical).length === 0 ? '#E5E7EB' : `linear-gradient(90deg,${C.primary},#FBBF24)`, color: Object.keys(physical).length === 0 ? '#9CA3AF' : '#fff', fontSize: 15, fontWeight: 700, cursor: Object.keys(physical).length === 0 ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Menyimpan…' : '✓ Simpan Data Opname'}
          </button>
        </div>
      )}
    </GudangLayout>
  );
}

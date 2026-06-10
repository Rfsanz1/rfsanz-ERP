'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SERVICE_CONFIG, SERVICE_NAV } from '../../../lib/nav-configs';
import { DollarSign, Plus, Search, X, Check, Send } from 'lucide-react';

const C = SERVICE_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Draft',      color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  sent:     { label: 'Terkirim',   color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  approved: { label: 'Disetujui', color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  rejected: { label: 'Ditolak',   color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

const SAMPLE = [
  { id: 1, number: 'EST-0001', wo: 'WO-0001', customer: 'Budi Santoso', device: 'Mesin Cuci LG', parts_cost: 250000, labor_cost: 100000, total: 350000, status: 'approved', date: '2025-06-20' },
  { id: 2, number: 'EST-0002', wo: 'WO-0003', customer: 'Hendra W.', device: 'Kulkas Samsung', parts_cost: 150000, labor_cost: 100000, total: 250000, status: 'sent', date: '2025-06-23' },
  { id: 3, number: 'EST-0003', wo: 'WO-0004', customer: 'Dewi K.', device: 'TV LED 55"', parts_cost: 650000, labor_cost: 150000, total: 800000, status: 'draft', date: '2025-06-24' },
];

export default function ServiceEstimatesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer: '', device: '', wo: '', diagnosis: '', parts: [{ name: '', qty: 1, price: 0 }], labor_cost: '' });

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  const partsCost = form.parts.reduce((s, p) => s + p.qty * p.price, 0);
  const total = partsCost + +form.labor_cost;

  return (
    <AppShell {...SERVICE_CONFIG} navItems={SERVICE_NAV} activeHref="/service/estimates">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Estimasi Biaya Servis</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Buat dan kirim estimasi biaya perbaikan ke pelanggan</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Estimasi
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Estimasi', value: items.length, color: C },
            { label: 'Terkirim', value: items.filter(i => i.status === 'sent').length, color: '#2196F3' },
            { label: 'Disetujui', value: items.filter(i => i.status === 'approved').length, color: '#4CAF50' },
            { label: 'Total Nilai', value: fmt(items.reduce((s, i) => s + i.total, 0)), color: '#1E1B4B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['No. Estimasi', 'WO Ref', 'Pelanggan', 'Perangkat', 'Biaya Parts', 'Biaya Jasa', 'Total', 'Tanggal', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const s = STATUS_MAP[item.status];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: C }}>{item.number}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.wo}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.customer}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.device}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.parts_cost)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.labor_cost)}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: C }}>{fmt(item.total)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {item.status === 'draft' && <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Kirim ke pelanggan"><Send className="h-3.5 w-3.5" style={{ color: '#2196F3' }} /></button>}
                          {item.status === 'sent' && <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Setujui"><Check className="h-3.5 w-3.5" style={{ color: '#4CAF50' }} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-y-auto" style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat Estimasi Biaya</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'customer', label: 'Pelanggan *', placeholder: 'Nama pelanggan...' },
                  { key: 'device', label: 'Perangkat', placeholder: 'Merek dan tipe...' },
                  { key: 'wo', label: 'Work Order Ref', placeholder: 'WO-XXXX' },
                  { key: 'diagnosis', label: 'Diagnosa / Masalah', placeholder: 'Hasil diagnosa teknisi...' },
                  { key: 'labor_cost', label: 'Biaya Jasa (Rp)', placeholder: '0', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                {total > 0 && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: `${C}08`, border: `1px solid ${C}30` }}>
                    <div className="flex justify-between text-xs"><span style={{ color: '#6B7280' }}>Biaya Parts</span><span style={{ color: '#1E1B4B' }}>{fmt(partsCost)}</span></div>
                    <div className="flex justify-between text-xs mt-1"><span style={{ color: '#6B7280' }}>Biaya Jasa</span><span style={{ color: '#1E1B4B' }}>{fmt(+form.labor_cost)}</span></div>
                    <div className="flex justify-between font-bold text-sm pt-2 mt-1" style={{ borderTop: '1px solid #EDE8F5', color: C }}><span>Total Estimasi</span><span>{fmt(total)}</span></div>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <DollarSign className="h-4 w-4" /> Simpan Estimasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

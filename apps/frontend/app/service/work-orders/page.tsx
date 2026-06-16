'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SERVICE_CONFIG, SERVICE_NAV } from '../../../lib/nav-configs';
import { ClipboardList, Plus, Search, X, RefreshCw, Wrench, MessageSquare, Clock } from 'lucide-react';

const C = SERVICE_CONFIG.appColor;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: 'Draft',         color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  confirmed:  { label: 'Terkonfirmasi', color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  in_progress:{ label: 'Dikerjakan',    color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  done:       { label: 'Selesai',       color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  cancelled:  { label: 'Dibatalkan',    color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
};

const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 1, number: 'WO-0001', customer: 'Budi Santoso', device: 'Mesin Cuci LG', problem: 'Tidak mau berputar', technician: 'Ahmad', received: '2025-06-20', est_done: '2025-06-22', est_cost: 350000, status: 'in_progress', warranty: true },
  { id: 2, number: 'WO-0002', customer: 'Siti Rahayu', device: 'AC Split 1.5PK', problem: 'Tidak dingin, freon habis', technician: 'Budi', received: '2025-06-21', est_done: '2025-06-21', est_cost: 450000, status: 'done', warranty: false },
  { id: 3, number: 'WO-0003', customer: 'Hendra W.', device: 'Kulkas Samsung 2 Pintu', problem: 'Suhu tidak stabil', technician: 'Agus', received: '2025-06-23', est_done: '2025-06-25', est_cost: 250000, status: 'confirmed', warranty: true },
  { id: 4, number: 'WO-0004', customer: 'Dewi K.', device: 'TV LED 55"', problem: 'Layar gelap, ada suara', technician: '-', received: '2025-06-24', est_done: '2025-06-27', est_cost: 800000, status: 'draft', warranty: false },
];

export default function WorkOrdersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer: '', device: '', problem: '', technician: '', est_done: '', est_cost: '', notes: '' });



  const filtered = items.filter(i =>
    (i.customer.toLowerCase().includes(search.toLowerCase()) || i.device.toLowerCase().includes(search.toLowerCase())) &&
    (status === '' || i.status === status)
  );

  const save = () => {
    if (!form.customer || !form.device) return;
    setItems(it => [...it, { id: it.length + 1, number: `WO-${String(it.length + 1).padStart(4, '0')}`, ...form, received: new Date().toISOString().split('T')[0], est_cost: +form.est_cost, status: 'draft', warranty: false }]);
    setShowForm(false);
    setForm({ customer: '', device: '', problem: '', technician: '', est_done: '', est_cost: '', notes: '' });
  };

  return (
    <AppShell {...SERVICE_CONFIG} navItems={SERVICE_NAV} activeHref="/service/work-orders">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Work Order Servis</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola pekerjaan servis dan reparasi perangkat</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Work Order
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total WO', value: items.length, color: C },
            { label: 'Dikerjakan', value: items.filter(i => i.status === 'in_progress').length, color: '#FF9800' },
            { label: 'Selesai', value: items.filter(i => i.status === 'done').length, color: '#4CAF50' },
            { label: 'Menunggu', value: items.filter(i => i.status === 'draft' || i.status === 'confirmed').length, color: '#2196F3' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari pelanggan atau perangkat..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                  {['No. WO', 'Pelanggan', 'Perangkat', 'Masalah', 'Teknisi', 'Masuk', 'Est. Selesai', 'Est. Biaya', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: C }}>{item.number}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.customer}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.device}</td>
                      <td className="px-4 py-3 text-xs max-w-[150px] truncate" style={{ color: '#6B7280' }}>{item.problem}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{item.technician || '-'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.received).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.est_done ? new Date(item.est_done).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.est_cost)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Kirim notifikasi WA">
                            <MessageSquare className="h-3.5 w-3.5" style={{ color: '#4CAF50' }} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Update status">
                            <RefreshCw className="h-3.5 w-3.5" style={{ color: '#2196F3' }} />
                          </button>
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
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat Work Order Baru</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'customer', label: 'Nama Pelanggan *', placeholder: 'Nama pelanggan...' },
                  { key: 'device', label: 'Perangkat / Produk *', placeholder: 'Merek dan tipe perangkat...' },
                  { key: 'problem', label: 'Keluhan / Masalah', placeholder: 'Deskripsikan masalah...' },
                  { key: 'technician', label: 'Teknisi', placeholder: 'Nama teknisi...' },
                  { key: 'est_cost', label: 'Estimasi Biaya (Rp)', placeholder: '0', type: 'number' },
                  { key: 'est_done', label: 'Estimasi Selesai', type: 'date' },
                  { key: 'notes', label: 'Catatan Tambahan', placeholder: 'Catatan internal...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder ?? ''} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Wrench className="h-4 w-4" /> Simpan Work Order
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

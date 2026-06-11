'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { Hash, Plus, Search, X, AlertTriangle } from 'lucide-react';

const C = INVENTORY_CONFIG.appColor;

const SAMPLE = [
  { id: 1, lot: 'LOT-2025-001', serial: null, product: 'Bahan Baku PP Grade A', qty: 250, uom: 'kg', expiry: '2026-03-15', received: '2025-01-15', location: 'Gudang Utama / Rak A1', status: 'available' },
  { id: 2, lot: 'LOT-2025-002', serial: null, product: 'Bahan Baku Resin', qty: 100, uom: 'kg', expiry: '2025-09-30', received: '2025-02-10', location: 'Gudang Utama / Rak B3', status: 'expiring' },
  { id: 3, lot: null, serial: 'SN-COMP-001', product: 'Kompresor Industri 5HP', qty: 1, uom: 'unit', expiry: null, received: '2024-06-01', location: 'Gudang Mesin', status: 'available' },
  { id: 4, lot: null, serial: 'SN-COMP-002', product: 'Kompresor Industri 5HP', qty: 1, uom: 'unit', expiry: null, received: '2024-06-01', location: 'Produksi / Area A', status: 'in_use' },
  { id: 5, lot: 'LOT-2025-003', serial: null, product: 'Kemasan Karton 20L', qty: 500, uom: 'pcs', expiry: '2027-01-01', received: '2025-03-20', location: 'Gudang Kemasan', status: 'available' },
  { id: 6, lot: 'LOT-2024-009', serial: null, product: 'Label Produk', qty: 800, uom: 'lembar', expiry: '2025-07-01', received: '2024-12-01', location: 'Gudang Kemasan / Laci C2', status: 'expiring' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Tersedia',    color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  expiring:  { label: 'Akan Habis', color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  expired:   { label: 'Kadaluarsa', color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
  in_use:    { label: 'Digunakan',  color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
};

export default function LotsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product: '', type: 'lot', number: '', qty: '', uom: '', expiry: '', location: '' });

  if (!token) return null;

  const filtered = items.filter(i =>
    (i.lot?.toLowerCase().includes(search.toLowerCase()) || i.serial?.toLowerCase().includes(search.toLowerCase()) || i.product.toLowerCase().includes(search.toLowerCase())) &&
    (type === '' || (type === 'lot' ? !!i.lot : !!i.serial))
  );

  const expiringCount = items.filter(i => i.status === 'expiring').length;

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/lots">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Lot Number & Serial Number</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Lacak lot produksi, serial number, dan tanggal kadaluarsa</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Lot/SN
          </button>
        </div>

        {expiringCount > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(255,152,0,.08)', border: '1.5px solid rgba(255,152,0,.3)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#FF9800' }} />
            <p className="text-sm" style={{ color: '#E65100' }}>
              <span className="font-bold">{expiringCount} lot</span> akan segera kadaluarsa. Segera gunakan atau lakukan disposal.
            </p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Lot/SN', value: items.length, color: C },
            { label: 'Tersedia', value: items.filter(i => i.status === 'available').length, color: '#4CAF50' },
            { label: 'Akan Kadaluarsa', value: expiringCount, color: '#FF9800' },
            { label: 'Digunakan', value: items.filter(i => i.status === 'in_use').length, color: '#2196F3' },
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
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari lot, serial, atau produk..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={type} onChange={e => setType(e.target.value)}>
              <option value="">Semua Tipe</option>
              <option value="lot">Lot Number</option>
              <option value="serial">Serial Number</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Lot / Serial Number', 'Tipe', 'Produk', 'Qty', 'Tanggal Terima', 'Kadaluarsa', 'Lokasi', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold" style={{ color: C }}>{item.lot ?? item.serial}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: item.lot ? 'rgba(245,124,0,.1)' : 'rgba(33,150,243,.1)', color: item.lot ? '#F57C00' : '#2196F3' }}>
                          {item.lot ? 'Lot' : 'Serial'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.product}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: '#1E1B4B' }}>{item.qty} {item.uom}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.received).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        {item.expiry ? (
                          <div className="flex items-center gap-1">
                            {item.status === 'expiring' && <AlertTriangle className="h-3 w-3 flex-shrink-0" style={{ color: '#FF9800' }} />}
                            <span className="text-xs" style={{ color: item.status === 'expiring' ? '#FF9800' : '#6B7280' }}>
                              {new Date(item.expiry).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        ) : <span className="text-xs" style={{ color: '#9CA3AF' }}>-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.location}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
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
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Lot / Serial Number</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tipe</label>
                  <div className="flex gap-3">
                    {['lot', 'serial'].map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition" style={{ backgroundColor: form.type === t ? C : 'transparent', color: form.type === t ? '#FFFFFF' : '#6B7280', border: `1.5px solid ${form.type === t ? C : '#EDE8F5'}` }}>
                        {t === 'lot' ? 'Lot Number' : 'Serial Number'}
                      </button>
                    ))}
                  </div>
                </div>
                {[
                  { key: 'number', label: form.type === 'lot' ? 'Nomor Lot *' : 'Serial Number *', placeholder: form.type === 'lot' ? 'LOT-2025-XXX' : 'SN-XXXXX' },
                  { key: 'product', label: 'Produk *', placeholder: 'Nama produk...' },
                  { key: 'qty', label: 'Quantity', placeholder: '0', type: 'number' },
                  { key: 'uom', label: 'Satuan', placeholder: 'kg, pcs, unit...' },
                  { key: 'location', label: 'Lokasi', placeholder: 'Gudang / Rak...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                {form.type === 'lot' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tanggal Kadaluarsa</label>
                    <input type="date" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Hash className="h-4 w-4" /> Simpan
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

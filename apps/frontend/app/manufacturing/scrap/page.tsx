'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { MANUFACTURING_CONFIG, MANUFACTURING_NAV } from '../../../lib/nav-configs';
import { AlertTriangle, Plus, Search, X } from 'lucide-react';

const C = MANUFACTURING_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 1, date: '2025-06-25', product: 'Produk Jadi A', lot: 'LOT-2025-010', qty: 5, uom: 'pcs', reason: 'Cacat produksi - permukaan tidak rata', cost: 250000, mo: 'MO-0045', location: 'Gudang Produksi', operator: 'Ahmad' },
  { id: 2, date: '2025-06-24', product: 'Bahan Baku PP Grade A', lot: 'LOT-2025-008', qty: 20, uom: 'kg', reason: 'Kontaminasi bahan baku', cost: 400000, mo: '-', location: 'Gudang Bahan Baku', operator: 'Budi' },
  { id: 3, date: '2025-06-23', product: 'Produk Jadi B', lot: null, qty: 3, uom: 'pcs', reason: 'Kerusakan saat packing', cost: 450000, mo: 'MO-0043', location: 'Area Packing', operator: 'Siti' },
];

export default function ScrapPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', product: '', lot: '', qty: '', uom: '', reason: '', mo: '', location: '', operator: '' });



  const totalCost = items.reduce((s, i) => s + i.cost, 0);

  const save = () => {
    if (!form.product || !form.qty) return;
    setItems(it => [...it, { id: it.length + 1, ...form, qty: +form.qty, cost: 0 }]);
    setShowForm(false);
    setForm({ date: '', product: '', lot: '', qty: '', uom: '', reason: '', mo: '', location: '', operator: '' });
  };

  return (
    <AppShell {...MANUFACTURING_CONFIG} navItems={MANUFACTURING_NAV} activeHref="/manufacturing/scrap">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Scrap Management</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Catat dan kelola barang hasil reject dan scrap produksi</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Input Scrap
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Scrap', value: items.length, color: C },
            { label: 'Scrap Bulan Ini', value: items.length, color: '#FF9800' },
            { label: 'Total Kerugian', value: fmt(totalCost), color: '#EA5455' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Tanggal', 'Produk', 'Lot', 'Qty', 'Alasan Scrap', 'Work Order', 'Lokasi', 'Operator', 'Est. Kerugian'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.product}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#6B7280' }}>{item.lot ?? '-'}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: '#EA5455' }}>{item.qty} {item.uom}</td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: '#6B7280' }}>{item.reason}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: C }}>{item.mo}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.location}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#1E1B4B' }}>{item.operator}</td>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#EA5455' }}>{fmt(item.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-y-auto" style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Input Scrap</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'date', label: 'Tanggal *', type: 'date' },
                    { key: 'product', label: 'Produk *', placeholder: 'Nama produk...' },
                    { key: 'lot', label: 'Lot Number', placeholder: 'LOT-XXX (opsional)' },
                    { key: 'qty', label: 'Qty Scrap *', placeholder: '0', type: 'number' },
                    { key: 'uom', label: 'Satuan', placeholder: 'pcs, kg...' },
                    { key: 'mo', label: 'Work Order Ref', placeholder: 'MO-XXXX' },
                    { key: 'location', label: 'Lokasi', placeholder: 'Gudang / Area...' },
                    { key: 'operator', label: 'Operator / PIC', placeholder: 'Nama operator...' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                      <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder ?? ''} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Alasan Scrap *</label>
                  <textarea className="w-full rounded-lg px-4 py-2.5 text-sm resize-none" rows={3} style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Deskripsikan alasan scrap..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <AlertTriangle className="h-4 w-4" /> Simpan Scrap
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

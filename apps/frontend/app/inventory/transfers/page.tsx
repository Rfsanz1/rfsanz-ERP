'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { ArrowLeftRight, Plus, Search, X, Check, RefreshCw } from 'lucide-react';

const C = INVENTORY_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID');

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Draft',      color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  ready:    { label: 'Siap',       color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  done:     { label: 'Selesai',    color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  cancelled:{ label: 'Dibatalkan', color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

const SAMPLE = [
  { id: 1, number: 'TRF-0001', from: 'Gudang Utama', to: 'Area Produksi', date: '2025-06-25', items: 3, total_qty: 150, unit: 'kg', pic: 'Ahmad', status: 'done', notes: 'Transfer untuk produksi batch A45' },
  { id: 2, number: 'TRF-0002', from: 'Gudang Kemasan', to: 'Area Packing', date: '2025-06-25', items: 2, total_qty: 500, unit: 'pcs', pic: 'Budi', status: 'ready', notes: 'Transfer kemasan untuk jadwal produksi' },
  { id: 3, number: 'TRF-0003', from: 'Gudang Utama', to: 'Gudang Cabang Jakarta', date: '2025-06-24', items: 5, total_qty: 80, unit: 'unit', pic: 'Siti', status: 'draft', notes: 'Transfer stok ke cabang' },
];

export default function TransfersPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ from: '', to: '', date: '', notes: '', lines: [{ product: '', qty: 1, uom: 'pcs' }] });

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const filtered = items.filter(i =>
    (i.from.toLowerCase().includes(search.toLowerCase()) || i.to.toLowerCase().includes(search.toLowerCase())) &&
    (status === '' || i.status === status)
  );

  const validate = (id: number) => setItems(it => it.map(i => i.id === id ? { ...i, status: 'done' } : i));

  const save = () => {
    if (!form.from || !form.to) return;
    setItems(it => [...it, { id: it.length + 1, number: `TRF-${String(it.length + 1).padStart(4, '0')}`, from: form.from, to: form.to, date: form.date || new Date().toISOString().split('T')[0], items: form.lines.length, total_qty: form.lines.reduce((s, l) => s + l.qty, 0), unit: 'pcs', pic: '-', status: 'draft', notes: form.notes }]);
    setShowForm(false);
    setForm({ from: '', to: '', date: '', notes: '', lines: [{ product: '', qty: 1, uom: 'pcs' }] });
  };

  const LOCATIONS = ['Gudang Utama', 'Gudang Kemasan', 'Area Produksi', 'Area Packing', 'Gudang Jadi', 'Gudang Cabang Jakarta', 'Gudang Cabang Surabaya'];

  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/transfers">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Transfer Stok</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Pindahkan stok antar gudang atau area produksi</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Transfer
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Transfer', value: items.length, color: C },
            { label: 'Draft', value: items.filter(i => i.status === 'draft').length, color: '#9E9E9E' },
            { label: 'Siap Transfer', value: items.filter(i => i.status === 'ready').length, color: '#2196F3' },
            { label: 'Selesai', value: items.filter(i => i.status === 'done').length, color: '#4CAF50' },
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
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari lokasi asal atau tujuan..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['No. Transfer', 'Dari', 'Ke', 'Tanggal', 'Jml Item', 'Total Qty', 'PIC', 'Catatan', 'Status', 'Aksi'].map(h => (
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
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.from}</td>
                      <td className="px-4 py-3" style={{ color: '#1E1B4B' }}>
                        <div className="flex items-center gap-1.5">
                          <ArrowLeftRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C }} />
                          {item.to}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-center text-xs" style={{ color: '#1E1B4B' }}>{item.items}</td>
                      <td className="px-4 py-3 font-bold text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.total_qty)} {item.unit}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B7280' }}>{item.pic}</td>
                      <td className="px-4 py-3 text-xs max-w-[150px] truncate" style={{ color: '#9CA3AF' }}>{item.notes}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'ready' && (
                          <button onClick={() => validate(item.id)} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#388E3C' }}>
                            <Check className="h-3.5 w-3.5" /> Validasi
                          </button>
                        )}
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
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat Transfer Stok</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Dari Gudang *</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))}>
                      <option value="">Pilih gudang asal...</option>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Ke Gudang *</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}>
                      <option value="">Pilih gudang tujuan...</option>
                      {LOCATIONS.filter(l => l !== form.from).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tanggal Transfer</label>
                  <input type="date" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Catatan</label>
                  <textarea className="w-full rounded-lg px-4 py-2.5 text-sm resize-none" rows={2} style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Keterangan transfer..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Item Transfer</label>
                    <button onClick={() => setForm(f => ({ ...f, lines: [...f.lines, { product: '', qty: 1, uom: 'pcs' }] }))} className="text-xs font-semibold" style={{ color: C }}>+ Tambah Baris</button>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
                    <table className="w-full text-xs">
                      <thead style={{ backgroundColor: '#F5F3FF' }}>
                        <tr>
                          {['Produk', 'Qty', 'Satuan'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.lines.map((line, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #EDE8F5' }}>
                            <td className="px-3 py-2">
                              <input className="w-full rounded px-2 py-1.5 text-xs" style={{ border: '1px solid #EDE8F5', outline: 'none' }} placeholder="Nama produk..." value={line.product} onChange={e => { const l = [...form.lines]; l[i].product = e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" className="w-16 rounded px-2 py-1.5 text-xs" style={{ border: '1px solid #EDE8F5', outline: 'none' }} value={line.qty} onChange={e => { const l = [...form.lines]; l[i].qty = +e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                            <td className="px-3 py-2">
                              <input className="w-16 rounded px-2 py-1.5 text-xs" style={{ border: '1px solid #EDE8F5', outline: 'none' }} value={line.uom} onChange={e => { const l = [...form.lines]; l[i].uom = e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <ArrowLeftRight className="h-4 w-4" /> Simpan Transfer
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

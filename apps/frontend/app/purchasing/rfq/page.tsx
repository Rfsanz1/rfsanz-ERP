'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { FileText, Plus, Search, RefreshCw, X, Send, Check, Trash2 } from 'lucide-react';

const C = PURCHASING_CONFIG.appColor;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',      color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  sent:      { label: 'Terkirim',   color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  received:  { label: 'Diterima',   color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  confirmed: { label: 'Dikonfirmasi', color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  cancelled: { label: 'Dibatalkan', color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 1, number: 'RFQ-0001', supplier: 'PT. Supplier Utama', date: '2025-06-15', deadline: '2025-06-22', items: 3, total: 45000000, status: 'sent' },
  { id: 2, number: 'RFQ-0002', supplier: 'CV. Bahan Baku Jaya', date: '2025-06-18', deadline: '2025-06-25', items: 5, total: 78000000, status: 'draft' },
  { id: 3, number: 'RFQ-0003', supplier: 'Distributor Nasional', date: '2025-06-20', deadline: '2025-06-27', items: 2, total: 125000000, status: 'received' },
  { id: 4, number: 'RFQ-0004', supplier: 'PT. Logistik Prima', date: '2025-06-10', deadline: '2025-06-17', items: 4, total: 32000000, status: 'confirmed' },
];

export default function RFQPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier: '', deadline: '', notes: '',
    lines: [{ product: '', qty: 1, uom: 'pcs', description: '' }],
  });

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const filtered = items.filter(i =>
    i.supplier.toLowerCase().includes(search.toLowerCase()) &&
    (status === '' || i.status === status)
  );

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { product: '', qty: 1, uom: 'pcs', description: '' }] }));

  const save = async () => {
    const newRFQ = { id: items.length + 1, number: `RFQ-${String(items.length + 1).padStart(4, '0')}`, supplier: form.supplier, date: new Date().toISOString().split('T')[0], deadline: form.deadline, items: form.lines.length, total: 0, status: 'draft' };
    setItems(it => [newRFQ, ...it]);
    setShowForm(false);
    setForm({ supplier: '', deadline: '', notes: '', lines: [{ product: '', qty: 1, uom: 'pcs', description: '' }] });
  };

  return (
    <AppShell {...PURCHASING_CONFIG} navItems={PURCHASING_NAV} activeHref="/purchasing/rfq">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Request for Quotation (RFQ)</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Permintaan penawaran harga ke supplier</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat RFQ
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total RFQ', value: items.length, color: C },
            { label: 'Draft', value: items.filter(i => i.status === 'draft').length, color: '#9E9E9E' },
            { label: 'Terkirim', value: items.filter(i => i.status === 'sent').length, color: '#2196F3' },
            { label: 'Dikonfirmasi', value: items.filter(i => i.status === 'confirmed').length, color: '#4CAF50' },
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
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari supplier..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  {['No. RFQ', 'Supplier', 'Tanggal', 'Deadline', 'Jml Item', 'Total', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-xs" style={{ color: C }}>{item.number}</td>
                      <td className="px-6 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.supplier}</td>
                      <td className="px-6 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.deadline).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-3 text-center" style={{ color: '#1E1B4B' }}>{item.items}</td>
                      <td className="px-6 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{item.total > 0 ? fmt(item.total) : '-'}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          {item.status === 'draft' && <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Kirim ke supplier"><Send className="h-3.5 w-3.5" style={{ color: '#2196F3' }} /></button>}
                          {item.status === 'received' && <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Konfirmasi jadi PO"><Check className="h-3.5 w-3.5" style={{ color: '#4CAF50' }} /></button>}
                          <button className="p-1.5 rounded-lg hover:bg-gray-100" title="Hapus"><Trash2 className="h-3.5 w-3.5" style={{ color: '#EA5455' }} /></button>
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
            <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 overflow-y-auto" style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat RFQ Baru</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Supplier *</label>
                    <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Nama supplier..." value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Deadline Penawaran</label>
                    <input type="date" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Item yang Diminta</label>
                    <button onClick={addLine} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C }}>
                      <Plus className="h-3.5 w-3.5" /> Tambah Item
                    </button>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #EDE8F5' }}>
                    <table className="w-full text-xs">
                      <thead style={{ backgroundColor: '#F5F3FF' }}>
                        <tr>
                          {['Produk / Material', 'Qty', 'Satuan', 'Deskripsi'].map(h => (
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
                            <td className="px-3 py-2">
                              <input className="w-full rounded px-2 py-1.5 text-xs" style={{ border: '1px solid #EDE8F5', outline: 'none' }} placeholder="Keterangan..." value={line.description} onChange={e => { const l = [...form.lines]; l[i].description = e.target.value; setForm(f => ({ ...f, lines: l })); }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Catatan untuk Supplier</label>
                  <textarea className="w-full rounded-lg px-4 py-2.5 text-sm resize-none" rows={3} style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Syarat, spesifikasi, atau catatan khusus..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <FileText className="h-4 w-4" /> Simpan Draft RFQ
                  </button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#2196F3' }}>
                    <Send className="h-4 w-4" /> Kirim ke Supplier
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

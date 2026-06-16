'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVOICE_CONFIG, INVOICE_NAV } from '../../../lib/nav-configs';
import { DollarSign, Plus, Search, X, Check } from 'lucide-react';

const C = INVOICE_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Draft',    color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  paid:     { label: 'Lunas',   color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  pending:  { label: 'Menunggu', color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  deducted: { label: 'Dikurangi', color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
};

const SAMPLE = [
  { id: 1, number: 'DP-0001', so: 'SO-0089', customer: 'PT. Maju Jaya', total_order: 50000000, dp_pct: 30, dp_amount: 15000000, paid_amount: 15000000, remaining: 35000000, due_date: '2025-06-28', status: 'paid' },
  { id: 2, number: 'DP-0002', so: 'SO-0092', customer: 'CV. Berkah Abadi', total_order: 80000000, dp_pct: 50, dp_amount: 40000000, paid_amount: 0, remaining: 80000000, due_date: '2025-06-30', status: 'pending' },
  { id: 3, number: 'DP-0003', so: 'SO-0094', customer: 'PT. Karya Mandiri', total_order: 125000000, dp_pct: 25, dp_amount: 31250000, paid_amount: 31250000, remaining: 93750000, due_date: '2025-07-05', status: 'deducted' },
];

export default function DownPaymentPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer: '', so: '', total_order: '', dp_pct: '30', due_date: '', notes: '' });



  const filtered = items.filter(i => i.customer.toLowerCase().includes(search.toLowerCase()) || i.so.toLowerCase().includes(search.toLowerCase()));
  const totalDP = items.reduce((s, i) => s + i.dp_amount, 0);
  const totalPaid = items.reduce((s, i) => s + i.paid_amount, 0);

  const dp_amount = form.total_order && form.dp_pct ? Math.round(+form.total_order * +form.dp_pct / 100) : 0;

  return (
    <AppShell {...INVOICE_CONFIG} navItems={INVOICE_NAV} activeHref="/invoice/down-payment">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Down Payment (DP)</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola uang muka penjualan dan pengurangan dari invoice akhir</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Invoice DP
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total DP', value: items.length, color: C },
            { label: 'Total Nilai DP', value: fmt(totalDP), color: '#2196F3' },
            { label: 'Sudah Dibayar', value: fmt(totalPaid), color: '#4CAF50' },
            { label: 'Belum Bayar', value: fmt(totalDP - totalPaid), color: '#FF9800' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#B0AAB9' }} />
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari pelanggan atau SO..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['No. DP', 'Sales Order', 'Pelanggan', 'Total Order', 'DP %', 'Nilai DP', 'Dibayar', 'Sisa Tagihan', 'Jatuh Tempo', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-semibold text-xs" style={{ color: C }}>{item.number}</td>
                      <td className="px-3 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{item.so}</td>
                      <td className="px-3 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.customer}</td>
                      <td className="px-3 py-3 text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.total_order)}</td>
                      <td className="px-3 py-3 font-bold text-sm text-center" style={{ color: C }}>{item.dp_pct}%</td>
                      <td className="px-3 py-3 font-semibold text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.dp_amount)}</td>
                      <td className="px-3 py-3 font-semibold text-xs" style={{ color: '#4CAF50' }}>{fmt(item.paid_amount)}</td>
                      <td className="px-3 py-3 font-semibold text-xs" style={{ color: '#1E1B4B' }}>{fmt(item.remaining)}</td>
                      <td className="px-3 py-3 text-xs" style={{ color: '#6B7280' }}>{new Date(item.due_date).toLocaleDateString('id-ID')}</td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-3 py-3">
                        {item.status === 'pending' && <button className="text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(76,175,80,.1)', color: '#388E3C' }}>Input Bayar</button>}
                        {item.status === 'paid' && <button className="text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(33,150,243,.1)', color: '#1976D2' }}>Kurangi Invoice</button>}
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
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat Invoice Down Payment</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'customer', label: 'Pelanggan *', placeholder: 'Nama pelanggan...' },
                  { key: 'so', label: 'Sales Order Referensi', placeholder: 'SO-XXXX' },
                  { key: 'total_order', label: 'Total Nilai Order (Rp)', placeholder: '0', type: 'number' },
                  { key: 'due_date', label: 'Jatuh Tempo', type: 'date' },
                  { key: 'notes', label: 'Catatan', placeholder: 'Keterangan tambahan...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder ?? ''} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Persentase DP (%)</label>
                  <div className="flex gap-2">
                    {['10', '20', '30', '50'].map(pct => (
                      <button key={pct} onClick={() => setForm(f => ({ ...f, dp_pct: pct }))} className="flex-1 py-2 rounded-lg text-sm font-semibold transition" style={{ backgroundColor: form.dp_pct === pct ? C : '#F5F3FF', color: form.dp_pct === pct ? '#FFFFFF' : '#6B7280', border: `1.5px solid ${form.dp_pct === pct ? C : '#EDE8F5'}` }}>
                        {pct}%
                      </button>
                    ))}
                    <input type="number" className="flex-1 py-2 rounded-lg text-sm text-center" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Other" value={form.dp_pct} onChange={e => setForm(f => ({ ...f, dp_pct: e.target.value }))} />
                  </div>
                </div>
                {dp_amount > 0 && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: `${C}08`, border: `1px solid ${C}30` }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Nilai Down Payment:</p>
                    <p className="font-bold text-lg" style={{ color: C }}>{fmt(dp_amount)}</p>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <DollarSign className="h-4 w-4" /> Buat Invoice DP
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

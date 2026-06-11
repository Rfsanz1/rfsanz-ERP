'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVOICE_CONFIG, INVOICE_NAV } from '../../../lib/nav-configs';
import { RefreshCw, Plus, Search, X, Pause, Play, Trash2 } from 'lucide-react';

const C = INVOICE_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE = [
  { id: 1, customer: 'PT. Maju Jaya', amount: 5000000, interval: 'monthly', next_date: '2025-07-01', total_sent: 6, status: 'active' },
  { id: 2, customer: 'CV. Berkah Abadi', amount: 2500000, interval: 'weekly', next_date: '2025-06-28', total_sent: 24, status: 'active' },
  { id: 3, customer: 'Toko Sejahtera', amount: 15000000, interval: 'quarterly', next_date: '2025-09-01', total_sent: 2, status: 'paused' },
];

const INTERVALS: Record<string, string> = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', quarterly: 'Triwulan', yearly: 'Tahunan' };

export default function RecurringInvoicePage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer: '', amount: '', interval: 'monthly', start_date: '', end_date: '', description: '' });

  if (!token) return null;

  const toggleStatus = (id: number) => setItems(it => it.map(i => i.id === id ? { ...i, status: i.status === 'active' ? 'paused' : 'active' } : i));

  return (
    <AppShell {...INVOICE_CONFIG} navItems={INVOICE_NAV} activeHref="/invoice/recurring">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Recurring Invoice</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Invoice otomatis berulang untuk pelanggan reguler</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Recurring
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Recurring', value: items.length, color: C },
            { label: 'Aktif', value: items.filter(i => i.status === 'active').length, color: '#4CAF50' },
            { label: 'Total Bulanan', value: fmt(items.filter(i => i.interval === 'monthly' && i.status === 'active').reduce((s, i) => s + i.amount, 0)), color: '#2196F3' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Pelanggan', 'Jumlah', 'Interval', 'Invoice Berikutnya', 'Total Terkirim', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold" style={{ color: '#1E1B4B' }}>{item.customer}</td>
                    <td className="px-6 py-4 font-bold" style={{ color: C }}>{fmt(item.amount)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(25,118,210,.1)', color: '#1976D2' }}>{INTERVALS[item.interval]}</span>
                    </td>
                    <td className="px-6 py-4" style={{ color: '#6B7280' }}>{new Date(item.next_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-center font-semibold" style={{ color: '#1E1B4B' }}>{item.total_sent}x</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{
                        backgroundColor: item.status === 'active' ? 'rgba(76,175,80,.1)' : 'rgba(158,158,158,.1)',
                        color: item.status === 'active' ? '#4CAF50' : '#9E9E9E',
                      }}>{item.status === 'active' ? 'Aktif' : 'Dijeda'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => toggleStatus(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                          {item.status === 'active' ? <Pause className="h-3.5 w-3.5" style={{ color: '#FF9800' }} /> : <Play className="h-3.5 w-3.5" style={{ color: '#4CAF50' }} />}
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100"><Trash2 className="h-3.5 w-3.5" style={{ color: '#EA5455' }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat Recurring Invoice</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'customer', label: 'Pelanggan *', placeholder: 'Nama pelanggan...' },
                  { key: 'amount', label: 'Jumlah per Invoice (Rp)', placeholder: '0', type: 'number' },
                  { key: 'start_date', label: 'Tanggal Mulai', type: 'date' },
                  { key: 'end_date', label: 'Tanggal Selesai (Opsional)', type: 'date' },
                  { key: 'description', label: 'Keterangan', placeholder: 'Biaya berlangganan...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder ?? ''} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Interval</label>
                  <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
                    {Object.entries(INTERVALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <RefreshCw className="h-4 w-4" /> Aktifkan Recurring
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

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../lib/store/useAuthStore';
import AppShell from '../../../../components/layout/AppShell';
import { PAYROLL_CONFIG, PAYROLL_NAV } from '../../../../lib/nav-configs';
import { Layers, Plus, Save, X, Trash2 } from 'lucide-react';

const C = PAYROLL_CONFIG.appColor;

const TYPES = [
  { key: 'allowance', label: 'Tunjangan', color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  { key: 'deduction', label: 'Potongan', color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
  { key: 'basic', label: 'Gaji Pokok', color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  { key: 'benefit', label: 'Benefit', color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
];

const CALC_TYPES = ['Nominal Tetap', 'Persentase Gaji Pokok', 'Berdasarkan Kehadiran', 'Rumus Custom'];

const SAMPLE = [
  { id: 1, name: 'Gaji Pokok', type: 'basic', calc: 'Nominal Tetap', amount: 0, taxable: true, bpjs: true, active: true },
  { id: 2, name: 'Tunjangan Makan', type: 'allowance', calc: 'Nominal Tetap', amount: 750000, taxable: false, bpjs: false, active: true },
  { id: 3, name: 'Tunjangan Transport', type: 'allowance', calc: 'Nominal Tetap', amount: 500000, taxable: false, bpjs: false, active: true },
  { id: 4, name: 'Tunjangan Jabatan', type: 'allowance', calc: 'Persentase Gaji Pokok', amount: 10, taxable: true, bpjs: true, active: true },
  { id: 5, name: 'BPJS Kesehatan (1%)', type: 'deduction', calc: 'Persentase Gaji Pokok', amount: 1, taxable: false, bpjs: false, active: true },
  { id: 6, name: 'JHT Karyawan (2%)', type: 'deduction', calc: 'Persentase Gaji Pokok', amount: 2, taxable: false, bpjs: false, active: true },
  { id: 7, name: 'PPh21', type: 'deduction', calc: 'Rumus Custom', amount: 0, taxable: false, bpjs: false, active: true },
  { id: 8, name: 'Uang Lembur', type: 'allowance', calc: 'Berdasarkan Kehadiran', amount: 0, taxable: true, bpjs: false, active: true },
];

export default function PayrollComponentsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'allowance', calc: 'Nominal Tetap', amount: '', taxable: true, bpjs: false });

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const save = () => {
    if (!form.name) return;
    setItems(it => [...it, { id: it.length + 1, ...form, amount: +form.amount, active: true }]);
    setShowForm(false);
    setForm({ name: '', type: 'allowance', calc: 'Nominal Tetap', amount: '', taxable: true, bpjs: false });
  };

  const remove = (id: number) => setItems(it => it.filter(i => i.id !== id));

  return (
    <AppShell {...PAYROLL_CONFIG} navItems={PAYROLL_NAV} activeHref="/hr/payrolls/components">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Komponen Gaji</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Atur tunjangan, potongan, dan struktur penggajian</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Komponen
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {TYPES.map(t => {
            const count = items.filter(i => i.type === t.key).length;
            return (
              <div key={t.key} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: t.color, backgroundColor: t.bg }}>{t.label}</span>
                <p className="text-2xl font-bold mt-2" style={{ color: t.color }}>{count}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>komponen</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Daftar Komponen Gaji</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Nama Komponen', 'Tipe', 'Metode Hitung', 'Nilai', 'Kena Pajak', 'BPJS', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const t = TYPES.find(t => t.key === item.type) ?? TYPES[0];
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{item.name}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: t.color, backgroundColor: t.bg }}>{t.label}</span>
                      </td>
                      <td className="px-6 py-3 text-xs" style={{ color: '#6B7280' }}>{item.calc}</td>
                      <td className="px-6 py-3 font-semibold" style={{ color: C }}>
                        {item.amount === 0 ? 'Dinamis' : item.calc.includes('Persentase') ? `${item.amount}%` : item.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold`} style={{ backgroundColor: item.taxable ? 'rgba(33,150,243,.1)' : 'rgba(158,158,158,.1)', color: item.taxable ? '#2196F3' : '#9E9E9E' }}>
                          {item.taxable ? 'Ya' : 'Tidak'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold`} style={{ backgroundColor: item.bpjs ? 'rgba(194,24,91,.1)' : 'rgba(158,158,158,.1)', color: item.bpjs ? '#C2185B' : '#9E9E9E' }}>
                          {item.bpjs ? 'Ya' : 'Tidak'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs font-semibold" style={{ color: C }}>Edit</button>
                          <button onClick={() => remove(item.id)}><Trash2 className="h-3.5 w-3.5" style={{ color: '#EA5455' }} /></button>
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
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Komponen Gaji</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Nama Komponen *</label>
                  <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Tunjangan Makan..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tipe</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Metode Hitung</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.calc} onChange={e => setForm(f => ({ ...f, calc: e.target.value }))}>
                      {CALC_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Nilai (Rp atau %)</label>
                  <input type="number" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.taxable} onChange={e => setForm(f => ({ ...f, taxable: e.target.checked }))} className="rounded" style={{ accentColor: C }} />
                    <span className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Kena Pajak</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.bpjs} onChange={e => setForm(f => ({ ...f, bpjs: e.target.checked }))} className="rounded" style={{ accentColor: C }} />
                    <span className="text-xs font-semibold" style={{ color: '#1E1B4B' }}>Dasar BPJS</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Save className="h-4 w-4" /> Simpan
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

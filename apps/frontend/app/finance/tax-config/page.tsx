'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Percent, Plus, Save, RefreshCw, X, Check } from 'lucide-react';

const C = ACCOUNTING_CONFIG.appColor;

const SAMPLE_TAXES = [
  { id: 1, name: 'PPN 11%', type: 'sale', rate: 11, account: '2.1.3.001', active: true, scope: 'Penjualan' },
  { id: 2, name: 'PPN Masukan 11%', type: 'purchase', rate: 11, account: '1.1.5.001', active: true, scope: 'Pembelian' },
  { id: 3, name: 'PPh 23 - 2%', type: 'purchase', rate: 2, account: '2.1.4.001', active: true, scope: 'Jasa / Sewa' },
  { id: 4, name: 'PPh 21 - Karyawan', type: 'payroll', rate: 0, account: '2.1.4.002', active: true, scope: 'Penggajian' },
  { id: 5, name: 'PPh 4(2) - 10%', type: 'purchase', rate: 10, account: '2.1.4.003', active: false, scope: 'Sewa Tanah/Bangunan' },
];

export default function TaxConfigPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [taxes, setTaxes] = useState(SAMPLE_TAXES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'sale', rate: '', account: '', scope: '' });
  const [msg, setMsg] = useState('');



  const save = () => {
    if (!form.name) return;
    setTaxes(t => [...t, { id: t.length + 1, name: form.name, type: form.type, rate: +form.rate, account: form.account, active: true, scope: form.scope }]);
    setShowForm(false);
    setForm({ name: '', type: 'sale', rate: '', account: '', scope: '' });
    setMsg('Pajak berhasil ditambahkan!');
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleActive = (id: number) => setTaxes(t => t.map(tx => tx.id === id ? { ...tx, active: !tx.active } : tx));

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/tax-config">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Konfigurasi Pajak</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola tarif dan aturan pajak PPN, PPh, dan lainnya</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Pajak
          </button>
        </div>

        {msg && <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ backgroundColor: 'rgba(76,175,80,.1)', border: '1px solid rgba(76,175,80,.3)', color: '#388E3C' }}><Check className="h-4 w-4" />{msg}</div>}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Pajak', value: taxes.length },
            { label: 'Aktif', value: taxes.filter(t => t.active).length },
            { label: 'Tidak Aktif', value: taxes.filter(t => !t.active).length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: C }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Daftar Pajak</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                  {['Nama Pajak', 'Tipe', 'Tarif (%)', 'Akun', 'Scope', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taxes.map(tax => (
                  <tr key={tax.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold" style={{ color: '#1E1B4B' }}>{tax.name}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{
                        backgroundColor: tax.type === 'sale' ? 'rgba(33,150,243,.1)' : tax.type === 'purchase' ? 'rgba(255,152,0,.1)' : 'rgba(156,39,176,.1)',
                        color: tax.type === 'sale' ? '#2196F3' : tax.type === 'purchase' ? '#FF9800' : '#9C27B0',
                      }}>
                        {tax.type === 'sale' ? 'Penjualan' : tax.type === 'purchase' ? 'Pembelian' : 'Payroll'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-bold" style={{ color: C }}>{tax.rate > 0 ? `${tax.rate}%` : 'Progresif'}</td>
                    <td className="px-6 py-3 font-mono text-xs" style={{ color: '#6B7280' }}>{tax.account}</td>
                    <td className="px-6 py-3 text-xs" style={{ color: '#6B7280' }}>{tax.scope}</td>
                    <td className="px-6 py-3">
                      <button onClick={() => toggleActive(tax.id)} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{ backgroundColor: tax.active ? C : '#D1D5DB' }}>
                        <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" style={{ transform: tax.active ? 'translateX(18px)' : 'translateX(2px)' }} />
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <button className="text-xs font-semibold" style={{ color: C }}>Edit</button>
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
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Pajak Baru</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'name', label: 'Nama Pajak *', placeholder: 'Contoh: PPN 11%' },
                  { key: 'rate', label: 'Tarif (%)', placeholder: '11', type: 'number' },
                  { key: 'account', label: 'Kode Akun', placeholder: '2.1.3.001' },
                  { key: 'scope', label: 'Scope / Keterangan', placeholder: 'Penjualan Barang...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Tipe Pajak</label>
                  <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="sale">Penjualan</option>
                    <option value="purchase">Pembelian</option>
                    <option value="payroll">Payroll</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Save className="h-4 w-4" /> Simpan Pajak
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

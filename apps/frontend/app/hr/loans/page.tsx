'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { HR_CONFIG, HR_NAV } from '../../../lib/nav-configs';
import { DollarSign, Plus, Search, X, Check, Clock } from 'lucide-react';

const C = HR_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Menunggu',  color: '#FF9800', bg: 'rgba(255,152,0,.1)' },
  approved: { label: 'Disetujui', color: '#4CAF50', bg: 'rgba(76,175,80,.1)' },
  active:   { label: 'Berjalan',  color: '#2196F3', bg: 'rgba(33,150,243,.1)' },
  paid_off: { label: 'Lunas',     color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  rejected: { label: 'Ditolak',   color: '#EA5455', bg: 'rgba(234,84,85,.1)' },
};

const SAMPLE = [
  { id: 1, employee: 'Ahmad Fauzi', amount: 10000000, tenor: 12, installment: 833333, paid: 5, remaining: 7, total_remaining: 5833331, purpose: 'Biaya pendidikan anak', date: '2025-01-15', status: 'active' },
  { id: 2, employee: 'Siti Rahayu', amount: 5000000, tenor: 6, installment: 833333, paid: 6, remaining: 0, total_remaining: 0, purpose: 'Kebutuhan mendesak', date: '2024-12-01', status: 'paid_off' },
  { id: 3, employee: 'Budi Hartono', amount: 20000000, tenor: 24, installment: 833333, paid: 0, remaining: 24, total_remaining: 20000000, purpose: 'Renovasi rumah', date: '2025-06-20', status: 'approved' },
  { id: 4, employee: 'Rina Wati', amount: 3000000, tenor: 3, installment: 1000000, paid: 0, remaining: 3, total_remaining: 3000000, purpose: 'Biaya keluarga', date: '2025-06-22', status: 'pending' },
];

export default function LoansPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee: '', amount: '', tenor: '', purpose: '', date: '' });

  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;

  const filtered = items.filter(i => i.employee.toLowerCase().includes(search.toLowerCase()));
  const totalOutstanding = items.filter(i => i.status === 'active').reduce((s, i) => s + i.total_remaining, 0);
  const activeLoans = items.filter(i => i.status === 'active').length;

  const save = () => {
    if (!form.employee || !form.amount) return;
    const installment = Math.ceil(+form.amount / +form.tenor);
    setItems(it => [...it, { id: it.length + 1, ...form, amount: +form.amount, tenor: +form.tenor, installment, paid: 0, remaining: +form.tenor, total_remaining: +form.amount, status: 'pending' }]);
    setShowForm(false);
    setForm({ employee: '', amount: '', tenor: '', purpose: '', date: '' });
  };

  return (
    <AppShell {...HR_CONFIG} navItems={HR_NAV} activeHref="/hr/loans">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pinjaman Karyawan</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola pinjaman dan cicilan karyawan yang dipotong dari gaji</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Ajukan Pinjaman
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Pinjaman', value: items.length, color: C },
            { label: 'Aktif Berjalan', value: activeLoans, color: '#2196F3' },
            { label: 'Outstanding', value: fmt(totalOutstanding), color: '#EA5455' },
            { label: 'Menunggu Approval', value: items.filter(i => i.status === 'pending').length, color: '#FF9800' },
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
              <input className="w-full rounded-lg pl-9 pr-4 py-2 text-sm" style={{ border: '1px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Cari karyawan..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                  {['Karyawan', 'Total Pinjaman', 'Tenor', 'Cicilan/Bln', 'Sudah Bayar', 'Sisa', 'Outstanding', 'Tujuan', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const s = STATUS_MAP[item.status];
                  const progress = item.tenor > 0 ? Math.round(item.paid / item.tenor * 100) : 100;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium" style={{ color: '#1E1B4B' }}>{item.employee}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: '#1E1B4B' }}>{fmt(item.amount)}</td>
                      <td className="px-4 py-3 text-xs text-center" style={{ color: '#6B7280' }}>{item.tenor} bln</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: C }}>{fmt(item.installment)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: '#4CAF50' }} />
                          </div>
                          <span className="text-xs" style={{ color: '#6B7280' }}>{item.paid}x</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-center" style={{ color: '#1E1B4B' }}>{item.remaining}x</td>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: item.total_remaining > 0 ? '#EA5455' : '#4CAF50' }}>{fmt(item.total_remaining)}</td>
                      <td className="px-4 py-3 text-xs max-w-[120px] truncate" style={{ color: '#6B7280' }}>{item.purpose}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button className="p-1.5 rounded-lg hover:bg-gray-100"><Check className="h-3.5 w-3.5" style={{ color: '#4CAF50' }} /></button>
                            <button className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-3.5 w-3.5" style={{ color: '#EA5455' }} /></button>
                          </div>
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
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Ajukan Pinjaman Karyawan</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'employee', label: 'Nama Karyawan *', placeholder: 'Cari karyawan...' },
                  { key: 'amount', label: 'Jumlah Pinjaman (Rp) *', placeholder: '0', type: 'number' },
                  { key: 'tenor', label: 'Tenor (Bulan)', placeholder: '12', type: 'number' },
                  { key: 'date', label: 'Tanggal Pengajuan', type: 'date' },
                  { key: 'purpose', label: 'Tujuan / Keperluan', placeholder: 'Kebutuhan biaya...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type={f.type ?? 'text'} className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={(f as any).placeholder ?? ''} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                  </div>
                ))}
                {form.amount && form.tenor && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: `${C}08`, border: `1px solid ${C}30` }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Cicilan per bulan:</p>
                    <p className="font-bold" style={{ color: C }}>{fmt(Math.ceil(+form.amount / +form.tenor))}/bulan</p>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <DollarSign className="h-4 w-4" /> Ajukan Pinjaman
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

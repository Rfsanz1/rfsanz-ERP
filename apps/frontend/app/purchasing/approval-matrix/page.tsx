'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { GitBranch, Plus, X, Save, Trash2 } from 'lucide-react';

const C = PURCHASING_CONFIG.appColor;
const fmt = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SAMPLE_MATRIX = [
  { id: 1, name: 'Pembelian Rutin', min_amount: 0, max_amount: 5000000, approver_1: 'Manajer Gudang', approver_2: null, approver_3: null, active: true },
  { id: 2, name: 'Pembelian Menengah', min_amount: 5000001, max_amount: 50000000, approver_1: 'Manajer Gudang', approver_2: 'Manajer Keuangan', approver_3: null, active: true },
  { id: 3, name: 'Pembelian Besar', min_amount: 50000001, max_amount: 200000000, approver_1: 'Manajer Gudang', approver_2: 'Manajer Keuangan', approver_3: 'Direktur Operasional', active: true },
  { id: 4, name: 'Pembelian Strategis', min_amount: 200000001, max_amount: 999999999999, approver_1: 'Manajer Keuangan', approver_2: 'Direktur Operasional', approver_3: 'Direktur Utama', active: true },
];

const APPROVERS = ['Supervisor Gudang', 'Manajer Gudang', 'Manajer Keuangan', 'Manajer Operasional', 'Direktur Operasional', 'Direktur Utama', 'Dewan Direksi'];

export default function ApprovalMatrixPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [matrix, setMatrix] = useState<Array<{ id: number; name: string; min_amount: number; max_amount: number; approver_1: string; approver_2: string | null; approver_3: string | null; active: boolean }>>(SAMPLE_MATRIX);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', min_amount: '', max_amount: '', approver_1: '', approver_2: '', approver_3: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);
  if (!token) return null;

  const save = () => {
    if (!form.name || !form.approver_1) return;
    setMatrix(m => [...m, { id: m.length + 1, ...form, min_amount: +form.min_amount, max_amount: +form.max_amount, approver_2: form.approver_2 || null, approver_3: form.approver_3 || null, active: true }]);
    setShowForm(false);
    setForm({ name: '', min_amount: '', max_amount: '', approver_1: '', approver_2: '', approver_3: '' });
    setMsg('Approval matrix berhasil disimpan!');
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleActive = (id: number) => setMatrix(m => m.map(r => r.id === id ? { ...r, active: !r.active } : r));

  return (
    <AppShell {...PURCHASING_CONFIG} navItems={PURCHASING_NAV} activeHref="/purchasing/approval-matrix">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Approval Matrix Pembelian</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Atur rantai persetujuan purchase order berdasarkan nominal</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Level
          </button>
        </div>

        {msg && <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(76,175,80,.1)', border: '1px solid rgba(76,175,80,.3)', color: '#388E3C' }}>{msg}</div>}

        <div className="space-y-4">
          {matrix.map(level => (
            <div key={level.id} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)', opacity: level.active ? 1 : 0.6 }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold" style={{ color: '#1E1B4B' }}>{level.name}</h3>
                  <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
                    {fmt(level.min_amount)} — {level.max_amount > 999999999 ? '∞ (tidak terbatas)' : fmt(level.max_amount)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleActive(level.id)} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{ backgroundColor: level.active ? C : '#D1D5DB' }}>
                    <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform" style={{ transform: level.active ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {[level.approver_1, level.approver_2, level.approver_3].filter(Boolean).map((approver, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && (
                      <div className="flex items-center">
                        <div className="h-px w-6" style={{ backgroundColor: '#EDE8F5' }} />
                        <div className="h-2 w-2 border-t-2 border-r-2 transform rotate-45" style={{ borderColor: '#EDE8F5' }} />
                      </div>
                    )}
                    <div className="rounded-xl p-3 text-center min-w-[120px]" style={{ backgroundColor: `${C}08`, border: `1.5px solid ${C}30` }}>
                      <p className="text-xs font-bold" style={{ color: C }}>Level {i + 1}</p>
                      <p className="text-xs mt-1 font-semibold" style={{ color: '#1E1B4B' }}>{approver}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Level Approval</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Nama Level *</label>
                  <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Pembelian Besar..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'min_amount', label: 'Nilai Minimum (Rp)', placeholder: '0' },
                    { key: 'max_amount', label: 'Nilai Maksimum (Rp)', placeholder: '50000000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                      <input type="number" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                    </div>
                  ))}
                </div>
                {['approver_1', 'approver_2', 'approver_3'].map((key, i) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Approver Level {i + 1} {i === 0 ? '*' : '(Opsional)'}</label>
                    <select className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                      <option value="">— Tidak ada —</option>
                      {APPROVERS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                ))}
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

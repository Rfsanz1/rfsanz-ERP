'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Target, Plus, Search, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { api } from '../../../lib/api';

const C = ACCOUNTING_CONFIG.appColor;
const fmt = (v: number) => Number(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',   color: '#9E9E9E', bg: 'rgba(158,158,158,.1)' },
  ACTIVE:   { label: 'Aktif',   color: '#4CAF50', bg: 'rgba(76,175,80,.1)'   },
  CLOSED:   { label: 'Tutup',   color: '#2196F3', bg: 'rgba(33,150,243,.1)'  },
  EXCEEDED: { label: 'Melebihi',color: '#f44336', bg: 'rgba(244,67,54,.1)'  },
};

export default function BudgetPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', periodeAwal: '', periodeAkhir: '', departemen: '', notes: '' });

  useEffect(() => { if (!token) router.push('/login'); }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/finance/budgets', { params: { limit: 100 } });
      const list = data.data ?? data ?? [];
      setBudgets(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch { setBudgets([]); }
    finally { setLoading(false); }
  }, []);

  const loadLines = useCallback(async (id: string) => {
    try {
      const { data } = await api.get(`/finance/budgets/${id}`);
      setLines(data.lines ?? data.budgetLines ?? []);
    } catch { setLines([]); }
  }, []);

  useEffect(() => { if (token) load(); }, [load, token]);
  useEffect(() => { if (selected?.id) loadLines(selected.id); }, [selected, loadLines]);
  if (!token) return null;

  const totalBudget = budgets.reduce((s, b) => s + Number(b.totalAmount ?? b.total_budget ?? 0), 0);
  const totalUsed   = budgets.reduce((s, b) => s + Number(b.usedAmount   ?? b.used       ?? 0), 0);

  const submitBudget = async () => {
    setSubmitting(true);
    try {
      await api.post('/finance/budgets', form);
      setMsg({ type: 'success', text: 'Budget berhasil dibuat' });
      setShowForm(false);
      load();
    } catch (e: any) { setMsg({ type: 'error', text: e?.response?.data?.message || 'Gagal membuat budget' }); }
    finally { setSubmitting(false); }
  };

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV}>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Budget Management</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola anggaran per departemen dan periode</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Buat Budget
          </button>
        </div>

        {msg && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ background: msg.type === 'success' ? 'rgba(76,175,80,.1)' : 'rgba(244,67,54,.1)', border: `1px solid ${msg.type === 'success' ? '#4CAF50' : '#f44336'}`, color: msg.type === 'success' ? '#2e7d32' : '#c62828' }}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Anggaran', value: fmt(totalBudget),          color: C },
            { label: 'Terpakai',       value: fmt(totalUsed),            color: '#FF9800' },
            { label: 'Sisa Anggaran',  value: fmt(totalBudget - totalUsed), color: '#4CAF50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{s.label}</p>
              <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Memuat data budget...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Budget list */}
            <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>Daftar Budget</h3>
              </div>
              <div className="p-4 space-y-3">
                {budgets.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>Belum ada budget</p>
                ) : budgets.map(b => {
                  const total = Number(b.totalAmount ?? b.total_budget ?? 0);
                  const used  = Number(b.usedAmount  ?? b.used        ?? 0);
                  const pct   = total > 0 ? Math.round(used / total * 100) : 0;
                  const isWarning = pct >= 90;
                  const st = STATUS_MAP[b.status ?? 'ACTIVE'] ?? STATUS_MAP.ACTIVE;
                  return (
                    <div key={b.id} onClick={() => setSelected(b)} className="p-4 rounded-xl cursor-pointer transition-colors" style={{ border: `1.5px solid ${selected?.id === b.id ? C : '#EDE8F5'}`, backgroundColor: selected?.id === b.id ? 'rgba(56,142,60,.04)' : 'transparent' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>{b.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{b.departemen ?? b.department ?? '-'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isWarning && <AlertTriangle className="h-4 w-4" style={{ color: '#FF9800' }} />}
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs" style={{ color: '#6B7280' }}>
                          <span>{fmt(used)}</span>
                          <span className="font-semibold" style={{ color: isWarning ? '#FF9800' : C }}>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8F5' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isWarning ? '#FF9800' : C }} />
                        </div>
                        <p className="text-xs text-right" style={{ color: '#9CA3AF' }}>dari {fmt(total)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget lines */}
            <div className="bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h3 className="font-semibold text-sm" style={{ color: '#1E1B4B' }}>
                  {selected ? `Detail: ${selected.name}` : 'Detail Baris Anggaran'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                {lines.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>Pilih budget untuk melihat detailnya</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #EDE8F5' }}>
                        {['Akun', 'Nama', 'Anggaran', 'Realisasi', '%'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: '#9CA3AF' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line: any, i: number) => {
                        const budget = Number(line.amount ?? line.budget ?? 0);
                        const actual = Number(line.actualAmount ?? line.actual ?? 0);
                        const pct = budget > 0 ? Math.round(actual / budget * 100) : 0;
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #F5F3FF' }}>
                            <td className="px-4 py-2.5 font-mono" style={{ color: C }}>{line.account?.code ?? '-'}</td>
                            <td className="px-4 py-2.5" style={{ color: '#1E1B4B' }}>{line.account?.name ?? line.name ?? '-'}</td>
                            <td className="px-4 py-2.5" style={{ color: '#1E1B4B' }}>{fmt(budget)}</td>
                            <td className="px-4 py-2.5" style={{ color: pct > 95 ? '#EA5455' : '#1E1B4B' }}>{fmt(actual)}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-semibold" style={{ color: pct > 95 ? '#EA5455' : pct > 80 ? '#FF9800' : '#4CAF50' }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Buat Budget Baru</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'name',       label: 'Nama Budget *',  placeholder: 'Budget Q1 2025...' },
                  { key: 'departemen', label: 'Departemen',     placeholder: 'Operasional...' },
                  { key: 'notes',      label: 'Catatan',        placeholder: 'Opsional...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
                    <input type="text" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(f2 => ({ ...f2, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Periode Awal</label>
                    <input type="date" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.periodeAwal} onChange={e => setForm(f => ({ ...f, periodeAwal: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Periode Akhir</label>
                    <input type="date" className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} value={form.periodeAkhir} onChange={e => setForm(f => ({ ...f, periodeAkhir: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={submitBudget} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C, opacity: submitting ? .7 : 1 }}>
                    <Plus className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan Budget'}
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

'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { Plus, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { api } from '../../../lib/api';

const fmt = (v: number) => Number(v).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT:    { label: 'Draf',     color: '#94A3B8' },
  ACTIVE:   { label: 'Aktif',    color: '#10B981' },
  CLOSED:   { label: 'Tutup',    color: '#3B82F6' },
  EXCEEDED: { label: 'Melebihi', color: '#EF4444' },
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function BudgetPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [budgets, setBudgets]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<any>(null);
  const [lines, setLines]         = useState<any[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm]           = useState({ name: '', periodeAwal: '', periodeAkhir: '', departemen: '', notes: '' });


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


  const totalBudget = budgets.reduce((s, b) => s + Number(b.totalAmount ?? b.total_budget ?? 0), 0);
  const totalUsed   = budgets.reduce((s, b) => s + Number(b.usedAmount ?? b.used ?? 0), 0);

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
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/finance/budget">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Manajemen Anggaran</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola anggaran per departemen dan periode</p>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat Anggaran
          </button>
        </div>

        {/* Msg */}
        {msg && (
          <div className="flex items-center justify-between" style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: msg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: msg.type === 'success' ? '#065F46' : '#991B1B' }}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Anggaran', value: fmt(totalBudget),          accent: '#6366F1' },
            { label: 'Terpakai',       value: fmt(totalUsed),            accent: '#F59E0B' },
            { label: 'Sisa Anggaran',  value: fmt(Math.max(0, totalBudget - totalUsed)), accent: '#10B981' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: s.accent, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data anggaran…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Budget List */}
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Daftar Anggaran</p>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {budgets.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-muted)' }}>Belum ada anggaran</p>
                ) : budgets.map(b => {
                  const total = Number(b.totalAmount ?? b.total_budget ?? 0);
                  const used  = Number(b.usedAmount  ?? b.used        ?? 0);
                  const pct   = total > 0 ? Math.round(used / total * 100) : 0;
                  const warn  = pct >= 90;
                  const st    = STATUS_MAP[b.status ?? 'ACTIVE'] ?? STATUS_MAP.ACTIVE;
                  const isActive = selected?.id === b.id;
                  return (
                    <div key={b.id} onClick={() => setSelected(b)}
                      style={{ padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${isActive ? '#6366F1' : 'var(--border)'}`, transition: 'border-color .15s' }}>
                      <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{b.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{b.departemen ?? b.department ?? '–'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {warn && <AlertTriangle size={13} style={{ color: '#F59E0B' }} />}
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: st.color, background: st.color + '1A' }}>{st.label}</span>
                        </div>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                        <span>{fmt(used)}</span>
                        <span style={{ fontWeight: 700, color: warn ? '#F59E0B' : '#6366F1' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-sunken)', overflow: 'hidden', marginBottom: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: warn ? '#F59E0B' : '#6366F1', borderRadius: 3, transition: 'width .3s' }} />
                      </div>
                      <p style={{ fontSize: 10, textAlign: 'right', color: 'var(--text-muted)', margin: 0 }}>dari {fmt(total)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget Lines */}
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {selected ? `Detail: ${selected.name}` : 'Detail Baris Anggaran'}
                </p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {lines.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-muted)' }}>Pilih anggaran untuk melihat detailnya</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Akun','Nama','Anggaran','Realisasi','%'].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line: any, i: number) => {
                        const budget = Number(line.amount ?? line.budget ?? 0);
                        const actual = Number(line.actualAmount ?? line.actual ?? 0);
                        const pct    = budget > 0 ? Math.round(actual / budget * 100) : 0;
                        const color  = pct > 95 ? '#EF4444' : pct > 80 ? '#F59E0B' : '#10B981';
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#6366F1' }}>{line.account?.code ?? '–'}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontSize: 12 }}>{line.account?.name ?? line.name ?? '–'}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>{fmt(budget)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: pct > 95 ? '#EF4444' : 'var(--text-primary)' }}>{fmt(actual)}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color }}>{pct}%</span>
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

        {/* Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Buat Anggaran Baru</span>
                <button onClick={() => setShowForm(false)} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'name',       label: 'Nama Anggaran *', placeholder: 'Anggaran Q1 2025…' },
                  { key: 'departemen', label: 'Departemen',       placeholder: 'Operasional…' },
                  { key: 'notes',      label: 'Catatan',          placeholder: 'Opsional…' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
                    <input style={inputStyle} placeholder={f.placeholder} value={(form as any)[f.key]}
                      onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                      onFocus={el => { el.target.style.borderColor = '#6366F1'; }} onBlur={el => { el.target.style.borderColor = 'var(--border)'; }} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Periode Awal</label>
                    <input type="date" style={inputStyle} value={form.periodeAwal} onChange={e => setForm(f => ({ ...f, periodeAwal: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Periode Akhir</label>
                    <input type="date" style={inputStyle} value={form.periodeAkhir} onChange={e => setForm(f => ({ ...f, periodeAkhir: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-3" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                  <button onClick={submitBudget} disabled={submitting}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                    <Plus size={13} /> {submitting ? 'Menyimpan…' : 'Simpan Anggaran'}
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

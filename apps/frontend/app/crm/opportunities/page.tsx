'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { TrendingUp, Plus, Search, RefreshCw, X } from 'lucide-react';

const STAGES = ['Prospek', 'Kualifikasi', 'Penawaran', 'Negosiasi', 'Menang', 'Kalah'];

const STAGE_COLORS: Record<string, string> = {
  'Prospek':     '#F59E0B',
  'Kualifikasi': '#3B82F6',
  'Penawaran':   '#8B5CF6',
  'Negosiasi':   '#EF4444',
  'Menang':      '#10B981',
  'Kalah':       '#94A3B8',
};

const fmtRp = (v: number) => v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

export default function OpportunitiesPage() {
  const { token } = useAuthStore();
  const router    = useRouter();
  const [items, setItems]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [stage, setStage]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', customer: '', stage: 'Prospek', probability: 20,
    expected_revenue: '', deadline: '', salesperson: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!token) router.push('/dashboard'); }, [token]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/crm/leads', { params: { search, page: 1, limit: 50 } });
      setItems(r.data.data ?? r.data ?? []);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [search, stage, token]);

  const save = async () => {
    setSaving(true);
    try { await api.post('/crm/leads', form); setShowForm(false); load(); }
    catch {} finally { setSaving(false); }
  };

  const totalRevenue = items.reduce((s, i) => s + Number(i.expectedRevenue ?? 0), 0);
  const won          = items.filter(i => i.stage === 'Menang').length;
  const winRate      = items.length > 0 ? Math.round(won / items.length * 100) : 0;

  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/opportunities">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Opportunity</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola peluang penjualan dan pipeline CRM</p>
          </div>
          <button onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Opportunity
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',          value: items.length, accent: '#6366F1' },
            { label: 'Ekspektasi',     value: fmtRp(totalRevenue), accent: '#10B981', small: true },
            { label: 'Menang',         value: won,          accent: '#10B981' },
            { label: 'Win Rate',       value: `${winRate}%`, accent: '#F59E0B' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
              <p style={{ fontSize: s.small ? 14 : 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari opportunity…"
                style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
            <select value={stage} onChange={e => setStage(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
              <option value="">Semua Stage</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={load} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Opportunity','Pelanggan','Stage','Prob.','Ekspektasi Pendapatan','Deadline','Salesperson'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada opportunity</td></tr>
                  ) : items.map(item => {
                    const sc = STAGE_COLORS[item.stage] ?? '#94A3B8';
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{item.name ?? item.title ?? '–'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{item.customerName ?? item.customer ?? '–'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: sc, background: sc + '1A', border: `1px solid ${sc}30` }}>{item.stage ?? 'Prospek'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-2">
                            <div style={{ height: 5, width: 56, borderRadius: 3, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${item.probability ?? 20}%`, background: '#6366F1', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.probability ?? 20}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{fmtRp(Number(item.expectedRevenue ?? 0))}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{item.deadline ? new Date(item.deadline).toLocaleDateString('id-ID') : '–'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{item.salesperson ?? '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Tambah Opportunity</span>
                <button onClick={() => setShowForm(false)} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'name',             label: 'Nama Opportunity *',       placeholder: 'Proyek / deal…' },
                  { key: 'customer',         label: 'Pelanggan',                placeholder: 'Nama perusahaan…' },
                  { key: 'salesperson',      label: 'Salesperson',              placeholder: 'Nama sales…' },
                  { key: 'expected_revenue', label: 'Ekspektasi Pendapatan (Rp)', placeholder: '0', type: 'number' },
                  { key: 'deadline',         label: 'Deadline',                 placeholder: '', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type ?? 'text'} style={inputStyle} placeholder={f.placeholder} value={(form as any)[f.key]}
                      onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                      onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Stage</label>
                    <select style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Probabilitas (%)</label>
                    <input type="number" min={0} max={100} style={inputStyle} value={form.probability}
                      onChange={e => setForm(f => ({ ...f, probability: +e.target.value }))}
                      onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Catatan</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Catatan opportunity…" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                  <button onClick={save} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.75 : 1 }}>
                    {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                    {saving ? 'Menyimpan…' : 'Simpan'}
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

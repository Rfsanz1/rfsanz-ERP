'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import {
  TrendingUp, Plus, Search, RefreshCw, X, List, LayoutGrid,
  Edit2, Trash2, ChevronRight, Building2, User, Calendar, DollarSign,
} from 'lucide-react';

const STAGES = ['Prospek', 'Kualifikasi', 'Penawaran', 'Negosiasi', 'Menang', 'Kalah'];

const STAGE_META: Record<string, { color: string; prob: number }> = {
  Prospek:     { color: '#F59E0B', prob: 10 },
  Kualifikasi: { color: '#3B82F6', prob: 30 },
  Penawaran:   { color: '#8B5CF6', prob: 50 },
  Negosiasi:   { color: '#EF4444', prob: 75 },
  Menang:      { color: '#10B981', prob: 100 },
  Kalah:       { color: '#94A3B8', prob: 0 },
};

const DEMO: any[] = [
  { id: 'd1', name: 'Proyek ERP PT Maju Bersama', customerName: 'PT Maju Bersama', stage: 'Negosiasi', probability: 75, expectedRevenue: 185000000, deadline: '2025-08-15', salesperson: 'Budi Santoso', notes: 'Demo sudah dilakukan, menunggu persetujuan direksi.' },
  { id: 'd2', name: 'Sistem Inventory CV Raya', customerName: 'CV Raya Mandiri', stage: 'Penawaran', probability: 50, expectedRevenue: 95000000, deadline: '2025-07-30', salesperson: 'Sari Dewi', notes: 'Proposal telah dikirim.' },
  { id: 'd3', name: 'Implementasi CRM PT Global', customerName: 'PT Global Teknologi', stage: 'Kualifikasi', probability: 30, expectedRevenue: 240000000, deadline: '2025-09-01', salesperson: 'Andi Wijaya', notes: 'Meeting pertama sudah terjadwal.' },
  { id: 'd4', name: 'Upgrade Software PT Nusa', customerName: 'PT Nusa Digital', stage: 'Prospek', probability: 10, expectedRevenue: 60000000, deadline: '2025-10-01', salesperson: 'Budi Santoso', notes: 'Cold outreach via email.' },
  { id: 'd5', name: 'Modul HR CV Sejahtera', customerName: 'CV Sejahtera Abadi', stage: 'Menang', probability: 100, expectedRevenue: 75000000, deadline: '2025-06-30', salesperson: 'Sari Dewi', notes: 'Kontrak sudah ditandatangani.' },
  { id: 'd6', name: 'Sistem POS Toko Berkah', customerName: 'Toko Berkah Jaya', stage: 'Kalah', probability: 0, expectedRevenue: 40000000, deadline: '2025-05-31', salesperson: 'Andi Wijaya', notes: 'Kalah dari kompetitor karena harga.' },
  { id: 'd7', name: 'Platform B2B PT Karya', customerName: 'PT Karya Inovasi', stage: 'Prospek', probability: 15, expectedRevenue: 320000000, deadline: '2025-11-01', salesperson: 'Budi Santoso', notes: 'Referral dari pelanggan lama.' },
  { id: 'd8', name: 'Modul Akuntansi UD Makmur', customerName: 'UD Makmur Sejati', stage: 'Kualifikasi', probability: 35, expectedRevenue: 55000000, deadline: '2025-08-20', salesperson: 'Sari Dewi', notes: 'Sudah demo online.' },
];

const fmtRp = (v: number) =>
  v >= 1_000_000_000
    ? `Rp ${(v / 1_000_000_000).toFixed(1)}M`
    : v >= 1_000_000
    ? `Rp ${(v / 1_000_000).toFixed(0)}jt`
    : v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const fmtRpFull = (v: number) =>
  v.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

const EMPTY_FORM = {
  name: '', customer: '', stage: 'Prospek', probability: 10,
  expected_revenue: '', deadline: '', salesperson: '', notes: '',
};

export default function OpportunitiesPage() {
  const { token } = useAuthStore();
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/crm/leads', { params: { page: 1, limit: 100 } });
      const data = r.data.data ?? r.data ?? [];
      setItems(data.length > 0 ? data : DEMO);
    } catch {
      setItems(DEMO);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name ?? item.title ?? '',
      customer: item.customerName ?? item.customer ?? '',
      stage: item.stage ?? 'Prospek',
      probability: item.probability ?? 10,
      expected_revenue: String(item.expectedRevenue ?? item.expected_revenue ?? ''),
      deadline: item.deadline ? item.deadline.split('T')[0] : '',
      salesperson: item.salesperson ?? '',
      notes: item.notes ?? '',
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/crm/leads/${editItem.id}`, form);
      } else {
        await api.post('/crm/leads', form);
      }
      setShowForm(false);
      load();
    } catch {
      if (editItem) {
        setItems(prev => prev.map(i => i.id === editItem.id ? {
          ...i,
          name: form.name, customerName: form.customer, stage: form.stage,
          probability: form.probability, expectedRevenue: Number(form.expected_revenue),
          deadline: form.deadline, salesperson: form.salesperson, notes: form.notes,
        } : i));
      } else {
        setItems(prev => [{
          id: 'new-' + Date.now(), name: form.name, customerName: form.customer,
          stage: form.stage, probability: form.probability,
          expectedRevenue: Number(form.expected_revenue), deadline: form.deadline,
          salesperson: form.salesperson, notes: form.notes,
        }, ...prev]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (id: string) => {
    try { await api.delete(`/crm/leads/${id}`); } catch {}
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleteId(null);
  };

  const moveStage = (id: string, direction: 'prev' | 'next') => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const idx = STAGES.indexOf(i.stage ?? 'Prospek');
      const next = direction === 'next' ? Math.min(idx + 1, STAGES.length - 1) : Math.max(idx - 1, 0);
      return { ...i, stage: STAGES[next], probability: STAGE_META[STAGES[next]].prob };
    }));
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || (i.name ?? '').toLowerCase().includes(q) || (i.customerName ?? '').toLowerCase().includes(q) || (i.salesperson ?? '').toLowerCase().includes(q);
    const matchStage  = !stageFilter || i.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const totalRevenue = items.reduce((s, i) => s + Number(i.expectedRevenue ?? 0), 0);
  const won          = items.filter(i => i.stage === 'Menang').length;
  const winRate      = items.length > 0 ? Math.round(won / items.length * 100) : 0;
  const activeDeals  = items.filter(i => i.stage !== 'Menang' && i.stage !== 'Kalah').length;

  if (!token) return null;

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/crm/opportunities">
      <div style={{ maxWidth: 1280 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Opportunity
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Kelola pipeline penjualan dan peluang bisnis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {(['kanban', 'list'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  style={{ padding: '7px 14px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                    background: viewMode === m ? '#6366F1' : 'var(--surface-sunken)',
                    color: viewMode === m ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                  {m === 'kanban' ? <LayoutGrid size={13} /> : <List size={13} />}
                  {m === 'kanban' ? 'Kanban' : 'List'}
                </button>
              ))}
            </div>
            <button onClick={openAdd}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Tambah
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Deal',    value: items.length,   accent: '#6366F1', icon: <TrendingUp size={16} /> },
            { label: 'Aktif',         value: activeDeals,    accent: '#3B82F6', icon: <TrendingUp size={16} /> },
            { label: 'Menang',        value: won,            accent: '#10B981', icon: <TrendingUp size={16} /> },
            { label: 'Win Rate',      value: `${winRate}%`,  accent: '#F59E0B', icon: <TrendingUp size={16} /> },
          ].map(s => (
            <div key={s.label}
              style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue summary */}
        <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total Potensi Pendapatan</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>{fmtRpFull(totalRevenue)}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {STAGES.slice(0, 4).map(s => {
              const count = items.filter(i => i.stage === s).length;
              return (
                <div key={s} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', margin: '0 0 2px' }}>{s}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 16px' }}
          className="flex items-center gap-3 flex-wrap">
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari opportunity, pelanggan…"
              style={{ ...inputStyle, paddingLeft: 32 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['', ...STAGES].map(s => (
              <button key={s || 'all'} onClick={() => setStageFilter(s)}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${stageFilter === s ? (STAGE_META[s]?.color ?? '#6366F1') : 'var(--border)'}`,
                  background: stageFilter === s ? (STAGE_META[s]?.color ?? '#6366F1') + '18' : 'var(--surface-sunken)',
                  color: stageFilter === s ? (STAGE_META[s]?.color ?? '#6366F1') : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                {s || 'Semua'}
              </button>
            ))}
          </div>
          <button onClick={load} title="Refresh"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</div>
        ) : viewMode === 'kanban' ? (
          <KanbanView items={filtered} onEdit={openEdit} onDelete={setDeleteId} onMove={moveStage} />
        ) : (
          <ListView items={filtered} onEdit={openEdit} onDelete={setDeleteId} />
        )}

      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                {editItem ? 'Edit Opportunity' : 'Tambah Opportunity'}
              </span>
              <button onClick={() => setShowForm(false)} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                { key: 'name',             label: 'Nama Opportunity *', placeholder: 'Nama proyek / deal…' },
                { key: 'customer',         label: 'Pelanggan',          placeholder: 'Nama perusahaan…' },
                { key: 'salesperson',      label: 'Salesperson',        placeholder: 'Nama sales…' },
                { key: 'expected_revenue', label: 'Ekspektasi Pendapatan (Rp)', placeholder: '0', type: 'number' },
                { key: 'deadline',         label: 'Deadline', type: 'date' },
              ] as any[]).map((f: any) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type ?? 'text'} style={inputStyle} placeholder={f.placeholder ?? ''} value={(form as any)[f.key]}
                    onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#6366F1'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Stage</label>
                  <select style={inputStyle} value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value, probability: STAGE_META[e.target.value]?.prob ?? f.probability }))}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Probabilitas (%)</label>
                  <input type="number" min={0} max={100} style={inputStyle} value={form.probability}
                    onChange={e => setForm(f => ({ ...f, probability: +e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#6366F1'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Catatan</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Catatan tentang opportunity ini…" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Batal
                </button>
                <button onClick={save} disabled={saving || !form.name.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: (!form.name.trim() || saving) ? 0.65 : 1 }}>
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 380, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,.2)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', margin: '0 0 8px' }}>Hapus Opportunity?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>Data opportunity ini akan dihapus permanen dan tidak bisa dikembalikan.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={() => doDelete(deleteId)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function KanbanView({ items, onEdit, onDelete, onMove }: {
  items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void; onMove: (id: string, dir: 'prev' | 'next') => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
      {STAGES.map((stage, si) => {
        const col   = items.filter(i => i.stage === stage);
        const color = STAGE_META[stage].color;
        const total = col.reduce((s, i) => s + Number(i.expectedRevenue ?? 0), 0);
        return (
          <div key={stage} style={{ minWidth: 230, flex: '0 0 230px' }}>
            {/* Column header */}
            <div style={{ borderRadius: '10px 10px 0 0', padding: '10px 14px', background: color + '18', borderBottom: `2px solid ${color}` }}
              className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{stage}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, background: color + '25', color, padding: '1px 7px', borderRadius: 10 }}>{col.length}</span>
            </div>
            {/* Cards */}
            <div style={{ background: 'var(--surface-sunken)', borderRadius: '0 0 10px 10px', border: '1px solid var(--border)', borderTop: 'none', minHeight: 80, padding: '8px 8px 12px' }}
              className="space-y-2">
              {total > 0 && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 4px 0', margin: 0, textAlign: 'center', fontWeight: 600 }}>
                  {total >= 1_000_000 ? `Rp ${(total / 1_000_000).toFixed(0)}jt` : fmtRpFull(total)}
                </p>
              )}
              {col.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>Kosong</p>
              )}
              {col.map(item => (
                <KanbanCard key={item.id} item={item} color={color} stageIdx={si} stagesLen={STAGES.length}
                  onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ item, color, stageIdx, stagesLen, onEdit, onDelete, onMove }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'var(--surface)', borderRadius: 10, border: `1px solid ${hovered ? color + '60' : 'var(--border)'}`, padding: '10px 12px', cursor: 'pointer', transition: 'all .15s', boxShadow: hovered ? `0 2px 12px ${color}20` : 'var(--shadow-sm)' }}>
      <div className="flex items-start justify-between gap-2">
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4, flex: 1 }}>{item.name}</p>
        {hovered && (
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); onEdit(item); }}
              style={{ padding: 3, borderRadius: 5, border: 'none', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Edit2 size={10} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(item.id); }}
              style={{ padding: 3, borderRadius: 5, border: 'none', background: '#FEE2E2', color: '#EF4444', cursor: 'pointer' }}>
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1" style={{ marginTop: 5 }}>
        <Building2 size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.customerName ?? '–'}</span>
      </div>
      {item.salesperson && (
        <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
          <User size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.salesperson}</span>
        </div>
      )}
      {item.deadline && (
        <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
          <Calendar size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
        </div>
      )}
      <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
            {item.expectedRevenue ? (item.expectedRevenue >= 1_000_000 ? `Rp ${(item.expectedRevenue / 1_000_000).toFixed(0)}jt` : fmtRpFull(item.expectedRevenue)) : '–'}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '18', padding: '1px 6px', borderRadius: 6 }}>{item.probability ?? 0}%</span>
        </div>
        <div style={{ marginTop: 5, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${item.probability ?? 0}%`, background: color, borderRadius: 2, transition: 'width .3s' }} />
        </div>
      </div>
      {/* Move buttons */}
      <div className="flex items-center gap-2" style={{ marginTop: 7 }}>
        <button disabled={stageIdx === 0} onClick={e => { e.stopPropagation(); onMove(item.id, 'prev'); }}
          style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, cursor: stageIdx === 0 ? 'not-allowed' : 'pointer', opacity: stageIdx === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          ← Mundur
        </button>
        <button disabled={stageIdx === stagesLen - 1} onClick={e => { e.stopPropagation(); onMove(item.id, 'next'); }}
          style={{ flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', background: stageIdx < stagesLen - 1 ? color + '20' : 'var(--surface-sunken)', color: stageIdx < stagesLen - 1 ? color : 'var(--text-muted)', fontSize: 10, fontWeight: 600, cursor: stageIdx === stagesLen - 1 ? 'not-allowed' : 'pointer', opacity: stageIdx === stagesLen - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          Maju →
        </button>
      </div>
    </div>
  );
}

function ListView({ items, onEdit, onDelete }: { items: any[]; onEdit: (i: any) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      {items.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Tidak ada data yang cocok</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Opportunity', 'Pelanggan', 'Stage', 'Prob.', 'Ekspektasi', 'Deadline', 'Salesperson', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const sc = STAGE_META[item.stage]?.color ?? '#94A3B8';
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name ?? '–'}</div>
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>{item.customerName ?? '–'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: sc, background: sc + '1A', border: `1px solid ${sc}30`, whiteSpace: 'nowrap' }}>{item.stage ?? 'Prospek'}</span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ height: 5, width: 48, borderRadius: 3, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.probability ?? 0}%`, background: sc, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 24 }}>{item.probability ?? 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {item.expectedRevenue ? (item.expectedRevenue >= 1_000_000 ? `Rp ${(Number(item.expectedRevenue) / 1_000_000).toFixed(0)}jt` : fmtRpFull(Number(item.expectedRevenue))) : '–'}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {item.deadline ? new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>{item.salesperson ?? '–'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(item)}
                          style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => onDelete(item.id)}
                          style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

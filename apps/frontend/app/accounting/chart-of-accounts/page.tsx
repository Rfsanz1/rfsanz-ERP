'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import { Layers, Plus, Search, RefreshCw, ChevronRight, ChevronDown, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  ASSET:     '#3B82F6',
  LIABILITY: '#EF4444',
  EQUITY:    '#8B5CF6',
  REVENUE:   '#10B981',
  EXPENSE:   '#F59E0B',
};
const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Aset', LIABILITY: 'Liabilitas', EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan', EXPENSE: 'Beban',
};
const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

function AccountRow({ acc, depth, onEdit, onDelete }: any) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = acc.children?.length > 0;
  const tc = TYPE_COLORS[acc.type] ?? '#94A3B8';
  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <td style={{ padding: '10px 16px' }}>
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => setOpen(!open)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', width: 16 }}>
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : <span style={{ width: 16, display: 'inline-block', color: 'var(--text-muted)', fontSize: 11, textAlign: 'center' }}>–</span>}
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{acc.code}</span>
          </div>
        </td>
        <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{acc.name}</td>
        <td style={{ padding: '10px 16px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: tc, background: tc + '1A', border: `1px solid ${tc}30` }}>
            {TYPE_LABELS[acc.type] ?? acc.type}
          </span>
        </td>
        <td style={{ padding: '10px 16px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            color: acc.normalBalance === 'DEBIT' ? '#3B82F6' : '#8B5CF6',
            background: acc.normalBalance === 'DEBIT' ? 'rgba(59,130,246,.10)' : 'rgba(139,92,246,.10)' }}>
            {acc.normalBalance}
          </span>
        </td>
        <td style={{ padding: '10px 16px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            color: acc.isActive ? '#10B981' : '#94A3B8',
            background: acc.isActive ? 'rgba(16,185,129,.10)' : 'rgba(148,163,184,.10)' }}>
            {acc.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td style={{ padding: '10px 16px' }}>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(acc)} title="Edit" style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: '#6366F1', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.10)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <Edit2 size={12} />
            </button>
            <button onClick={() => onDelete(acc)} title="Nonaktifkan" style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
              <Trash2 size={12} />
            </button>
          </div>
        </td>
      </tr>
      {open && hasChildren && acc.children.map((child: any) => (
        <AccountRow key={child.id} acc={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

function ChartOfAccountsPageContent() {
  const searchParams = useSearchParams();
  const [tree, setTree]           = useState<any[]>([]);
  const [flat, setFlat]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc]     = useState<any>(null);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ code: '', name: '', type: 'ASSET', parentId: '', description: '', isActive: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get('/finance/accounts/tree'),
        api.get('/finance/accounts', { params: { isActive: 'true' } }),
      ]);
      setTree(treeRes.data);
      setFlat(flatRes.data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditAcc(null);
    setForm({ code: '', name: '', type: typeFilter || 'ASSET', parentId: '', description: '', isActive: true });
    setError(''); setShowModal(true);
  };
  const openEdit   = (acc: any) => {
    setEditAcc(acc);
    setForm({ code: acc.code, name: acc.name, type: acc.type, parentId: acc.parentId || '', description: acc.description || '', isActive: acc.isActive });
    setError(''); setShowModal(true);
  };
  const handleDelete = async (acc: any) => {
    if (!confirm(`Nonaktifkan akun ${acc.code} - ${acc.name}?`)) return;
    try { await api.delete(`/finance/accounts/${acc.id}`); load(); }
    catch (e: any) { alert(e?.response?.data?.message || 'Gagal menghapus akun'); }
  };
  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editAcc) await api.put(`/finance/accounts/${editAcc.id}`, form);
      else         await api.post('/finance/accounts', form);
      setShowModal(false); load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const filterTree = (nodes: any[]): any[] => {
    if (!search && !typeFilter) return nodes;
    return nodes.reduce((acc: any[], node: any) => {
      const filteredChildren = filterTree(node.children || []);
      const match = (!search || node.code.toLowerCase().includes(search.toLowerCase()) || node.name.toLowerCase().includes(search.toLowerCase()))
        && (!typeFilter || node.type === typeFilter);
      if (match || filteredChildren.length > 0) acc.push({ ...node, children: filteredChildren });
      return acc;
    }, []);
  };
  const displayTree = filterTree(tree);

  const stats = {
    total: flat.length,
    byType: ACCOUNT_TYPES.reduce((a, t) => ({ ...a, [t]: flat.filter(f => f.type === t).length }), {} as Record<string, number>),
  };

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/accounting/chart-of-accounts">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <Layers size={20} style={{ color: '#6366F1' }} /> Bagan Akun
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola akun untuk sistem pencatatan double-entry</p>
          </div>
          <button onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah Akun
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[{ label: 'Total Akun', val: stats.total, key: '', accent: 'var(--text-primary)' },
            ...ACCOUNT_TYPES.map(t => ({ label: TYPE_LABELS[t], val: stats.byType[t] || 0, key: t, accent: TYPE_COLORS[t] }))
          ].map(s => (
            <button key={s.key} onClick={() => setTypeFilter(s.key)}
              style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: `1px solid ${typeFilter === s.key ? '#6366F1' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.val}</p>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode atau nama akun…"
                style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
              <option value="">Semua Tipe</option>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Kode','Nama Akun','Tipe','Saldo Normal','Status',''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</td></tr>
                ) : displayTree.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada akun</td></tr>
                ) : displayTree.map(acc => (
                  <AccountRow key={acc.id} acc={acc} depth={0} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{editAcc ? 'Edit Akun' : 'Tambah Akun Baru'}</span>
              <button onClick={() => setShowModal(false)} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div className="flex items-center gap-2" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#991B1B' }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Kode Akun *</label>
                  <input style={inputStyle} placeholder="mis. 1101" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Tipe *</label>
                  <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Nama Akun *</label>
                <input style={inputStyle} placeholder="mis. Kas" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Akun Induk</label>
                <select style={inputStyle} value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <option value="">— Tidak ada (akun induk) —</option>
                  {flat.filter(a => a.id !== editAcc?.id).map(a => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Deskripsi</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} placeholder="Opsional…" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Akun Aktif</span>
              </label>
              <div className="flex justify-end gap-3" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button onClick={handleSave} disabled={saving || !form.code || !form.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (saving || !form.code || !form.name) ? 0.6 : 1 }}>
                  <Check size={13} /> {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Memuat data akun…</div>}>
      <ChartOfAccountsPageContent />
    </Suspense>
  );
}

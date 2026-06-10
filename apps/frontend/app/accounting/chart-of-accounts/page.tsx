'use client';

export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import {
  Layers, Plus, Search, RefreshCw, ChevronRight, ChevronDown,
  Edit2, Trash2, X, Check, AlertCircle,
} from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LIABILITY: 'bg-red-500/10 text-red-400 border-red-500/20',
  EQUITY: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REVENUE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  EXPENSE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};
const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Aset', LIABILITY: 'Liabilitas', EQUITY: 'Ekuitas',
  REVENUE: 'Pendapatan', EXPENSE: 'Beban',
};
const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

function AccountRow({ acc, depth, onEdit, onDelete, allAccounts }: any) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = acc.children?.length > 0;
  return (
    <>
      <tr className="hover:bg-slate-800/40 transition group border-b border-slate-800/50">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => setOpen(!open)} className="text-slate-500 hover:text-slate-300 w-4 shrink-0">
                {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : <span className="w-4 shrink-0 text-slate-700">─</span>}
            <span className="font-mono text-xs text-slate-300">{acc.code}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-sm text-white">{acc.name}</td>
        <td className="px-4 py-2.5">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${TYPE_COLORS[acc.type] || 'bg-slate-800 text-slate-400'}`}>
            {TYPE_LABELS[acc.type] || acc.type}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${acc.normalBalance === 'DEBIT' ? 'bg-blue-900/30 text-blue-400' : 'bg-violet-900/30 text-violet-400'}`}>
            {acc.normalBalance}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${acc.isActive ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            {acc.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => onEdit(acc)} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"><Edit2 className="h-3.5 w-3.5" /></button>
            <button onClick={() => onDelete(acc)} className="p-1 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </td>
      </tr>
      {open && hasChildren && acc.children.map((child: any) => (
        <AccountRow key={child.id} acc={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} allAccounts={allAccounts} />
      ))}
    </>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ChartOfAccountsPageContent() {
  const searchParams = useSearchParams();
  const [tree, setTree] = useState<any[]>([]);
  const [flat, setFlat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [showModal, setShowModal] = useState(false);
  const [editAcc, setEditAcc] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', parentId: '', description: '', isActive: true });

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
  const openEdit = (acc: any) => {
    setEditAcc(acc);
    setForm({ code: acc.code, name: acc.name, type: acc.type, parentId: acc.parentId || '', description: acc.description || '', isActive: acc.isActive });
    setError(''); setShowModal(true);
  };
  const handleDelete = async (acc: any) => {
    if (!confirm(`Nonaktifkan akun ${acc.code} - ${acc.name}?`)) return;
    try { await api.delete(`/finance/accounts/${acc.id}`); load(); } catch (e: any) {
      alert(e?.response?.data?.message || 'Gagal menghapus akun');
    }
  };
  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editAcc) await api.put(`/finance/accounts/${editAcc.id}`, form);
      else await api.post('/finance/accounts', form);
      setShowModal(false); load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  // Filter tree view
  const filterTree = (nodes: any[]): any[] => {
    if (!search && !typeFilter) return nodes;
    return nodes.reduce((acc: any[], node: any) => {
      const filteredChildren = filterTree(node.children || []);
      const match = (!search || node.code.toLowerCase().includes(search.toLowerCase()) || node.name.toLowerCase().includes(search.toLowerCase()))
        && (!typeFilter || node.type === typeFilter);
      if (match || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };
  const displayTree = filterTree(tree);

  const stats = {
    total: flat.length,
    byType: ACCOUNT_TYPES.reduce((a, t) => ({ ...a, [t]: flat.filter(f => f.type === t).length }), {} as Record<string, number>),
  };

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-emerald-400" /> Bagan Akun (Chart of Accounts)
            </h1>
            <p className="text-slate-400 mt-0.5 text-sm">Kelola akun untuk sistem double-entry accounting</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition">
            <Plus className="h-4 w-4" /> Tambah Akun
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          {[{ label: 'Total Akun', val: stats.total, color: 'text-white' },
            ...ACCOUNT_TYPES.map(t => ({ label: TYPE_LABELS[t], val: stats.byType[t] || 0, color: TYPE_COLORS[t].split(' ')[1] }))
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-slate-900 border border-slate-800 p-3 cursor-pointer hover:border-slate-600 transition"
              onClick={() => setTypeFilter(s.label === 'Total Akun' ? '' : ACCOUNT_TYPES.find(t => TYPE_LABELS[t] === s.label) || '')}>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-slate-800 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" placeholder="Cari kode atau nama akun..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">Semua Tipe</option>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-left px-4 py-3">Kode</th>
                <th className="text-left px-4 py-3">Nama Akun</th>
                <th className="text-left px-4 py-3">Tipe</th>
                <th className="text-left px-4 py-3">Saldo Normal</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-16 text-center text-slate-500">Memuat...</td></tr>
                ) : displayTree.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-slate-500">Belum ada akun</td></tr>
                ) : displayTree.map(acc => (
                  <AccountRow key={acc.id} acc={acc} depth={0} onEdit={openEdit} onDelete={handleDelete} allAccounts={flat} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editAcc ? 'Edit Akun' : 'Tambah Akun Baru'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {error && <div className="flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-800/40 p-3 text-sm text-red-400"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Kode Akun *</label>
                <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="mis. 1101" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipe *</label>
                <select className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nama Akun *</label>
              <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="mis. Kas" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Akun Induk</label>
              <select className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                <option value="">— Tidak ada (akun induk) —</option>
                {flat.filter(a => a.id !== editAcc?.id).map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Deskripsi</label>
              <textarea className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none" rows={2} placeholder="Opsional..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
              <label htmlFor="isActive" className="text-sm text-slate-400">Akun Aktif</label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.code || !form.name} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white disabled:opacity-50 transition">
                <Check className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ModernLayout>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Memuat data akun…</div>}>
      <ChartOfAccountsPageContent />
    </Suspense>
  );
}

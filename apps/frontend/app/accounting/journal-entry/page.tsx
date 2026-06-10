'use client';

export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { ModernLayout } from '../../../components/layout/ModernLayout';
import { api } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen, Plus, Search, RefreshCw, X, Check, AlertCircle,
  ChevronDown, Trash2, RotateCcw, SendHorizonal, Ban,
} from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30',
  POSTED: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30',
  CANCELLED: 'bg-slate-800 text-slate-500 border-slate-700',
};

function Modal({ title, children, onClose, wide }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className={`bg-slate-900 rounded-2xl border border-slate-700 w-full mx-4 shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function JournalEntryPageContent() {
  const searchParams = useSearchParams();
  const [journals, setJournals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(searchParams.get('action') === 'new');
  const [viewJournal, setViewJournal] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const emptyLine = { accountId: '', debit: '', kredit: '', deskripsi: '' };
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    deskripsi: '', referensi: '',
    lines: [{ ...emptyLine }, { ...emptyLine }],
  });

  const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalKredit = form.lines.reduce((s, l) => s + Number(l.kredit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01 && totalDebit > 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jRes, aRes] = await Promise.all([
        api.get('/finance/journals', { params: { search, status: statusFilter, page, limit: 20 } }),
        api.get('/finance/accounts', { params: { isActive: 'true' } }),
      ]);
      setJournals(jRes.data.data ?? []);
      setTotal(jRes.data.total ?? 0);
      setAccounts(aRes.data ?? []);
    } catch { } finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { ...emptyLine }] }));
  const removeLine = (i: number) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i: number, field: string, val: string) =>
    setForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.post('/finance/journals', {
        ...form,
        lines: form.lines.map(l => ({
          accountId: l.accountId, debit: Number(l.debit || 0),
          kredit: Number(l.kredit || 0), deskripsi: l.deskripsi,
        })),
      });
      setShowCreate(false);
      setForm({ tanggal: new Date().toISOString().split('T')[0], deskripsi: '', referensi: '', lines: [{ ...emptyLine }, { ...emptyLine }] });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal menyimpan jurnal');
    } finally { setSaving(false); }
  };

  const handlePost = async (id: string) => {
    try { await api.post(`/finance/journals/${id}/post`); load(); setViewJournal(null); }
    catch (e: any) { alert(e?.response?.data?.message || 'Gagal memposting jurnal'); }
  };
  const handleCancel = async (id: string) => {
    if (!confirm('Batalkan jurnal ini?')) return;
    try { await api.post(`/finance/journals/${id}/cancel`); load(); setViewJournal(null); }
    catch (e: any) { alert(e?.response?.data?.message || 'Gagal membatalkan jurnal'); }
  };
  const handleReverse = async (id: string) => {
    if (!confirm('Buat jurnal pembalik otomatis?')) return;
    try { await api.post(`/finance/journals/${id}/reverse`); load(); setViewJournal(null); }
    catch (e: any) { alert(e?.response?.data?.message || 'Gagal membalik jurnal'); }
  };

  const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-400" /> Jurnal Akuntansi
            </h1>
            <p className="text-slate-400 mt-0.5 text-sm">Buat dan kelola jurnal double-entry dengan validasi otomatis</p>
          </div>
          <button onClick={() => { setError(''); setShowCreate(true); }} className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition">
            <Plus className="h-4 w-4" /> Buat Jurnal
          </button>
        </div>

        {/* List */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-slate-800 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input className="w-full rounded-xl bg-slate-800 border border-slate-700 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none" placeholder="Cari nomor atau deskripsi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button onClick={load} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"><RefreshCw className="h-4 w-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-left px-4 py-3">Nomor</th>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Deskripsi</th>
                <th className="text-right px-4 py-3">Total Debit</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? <tr><td colSpan={6} className="py-16 text-center text-slate-500">Memuat...</td></tr>
                  : journals.length === 0 ? <tr><td colSpan={6} className="py-16 text-center text-slate-500">Belum ada jurnal</td></tr>
                    : journals.map(j => (
                      <tr key={j.id} className="hover:bg-slate-800/40 transition cursor-pointer" onClick={() => setViewJournal(j)}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{j.nomor}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(j.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3 text-white">{j.deskripsi || '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {fmt(j.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_STYLE[j.status] || ''}`}>{j.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                            {j.status === 'DRAFT' && <>
                              <button onClick={() => handlePost(j.id)} className="p-1 rounded hover:bg-emerald-900/40 text-slate-400 hover:text-emerald-400" title="Post"><SendHorizonal className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleCancel(j.id)} className="p-1 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400" title="Batalkan"><Ban className="h-3.5 w-3.5" /></button>
                            </>}
                            {j.status === 'POSTED' && <button onClick={() => handleReverse(j.id)} className="p-1 rounded hover:bg-violet-900/40 text-slate-400 hover:text-violet-400" title="Balik"><RotateCcw className="h-3.5 w-3.5" /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-sm text-slate-500">
            <span>Total: {total} jurnal</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40">←</button>
              <span className="px-3 py-1 text-white">Hal {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={journals.length < 20} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40">→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Buat Jurnal Baru" onClose={() => setShowCreate(false)} wide>
          <div className="space-y-5">
            {error && <div className="flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-800/40 p-3 text-sm text-red-400"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tanggal *</label>
                <input type="date" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Deskripsi *</label>
                <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="mis. Pembayaran sewa bulan Januari" value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Referensi</label>
                <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="No. Invoice/SO/dll" value={form.referensi} onChange={e => setForm(f => ({ ...f, referensi: e.target.value }))} />
              </div>
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-400">Baris Jurnal</label>
                <button onClick={addLine} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                  <Plus className="h-3 w-3" /> Tambah Baris
                </button>
              </div>
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-800 text-xs text-slate-500 uppercase">
                    <th className="text-left px-3 py-2">Akun</th>
                    <th className="text-left px-3 py-2">Deskripsi</th>
                    <th className="text-right px-3 py-2 w-36">Debit (Rp)</th>
                    <th className="text-right px-3 py-2 w-36">Kredit (Rp)</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {form.lines.map((line, i) => (
                      <tr key={i} className="bg-slate-900">
                        <td className="px-3 py-2">
                          <select className="w-full bg-transparent text-white text-sm focus:outline-none" value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}>
                            <option value="">— Pilih Akun —</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-slate-600" placeholder="Keterangan..." value={line.deskripsi} onChange={e => updateLine(i, 'deskripsi', e.target.value)} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" className="w-full bg-transparent text-white text-sm text-right focus:outline-none placeholder-slate-600" placeholder="0" value={line.debit} onChange={e => { updateLine(i, 'debit', e.target.value); if (Number(e.target.value) > 0) updateLine(i, 'kredit', ''); }} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" className="w-full bg-transparent text-white text-sm text-right focus:outline-none placeholder-slate-600" placeholder="0" value={line.kredit} onChange={e => { updateLine(i, 'kredit', e.target.value); if (Number(e.target.value) > 0) updateLine(i, 'debit', ''); }} />
                        </td>
                        <td className="px-2 py-2">
                          {form.lines.length > 2 && <button onClick={() => removeLine(i)} className="p-1 text-slate-600 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800/60 border-t border-slate-700">
                      <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-white">{fmt(totalDebit)}</td>
                      <td className="px-3 py-2 text-right font-bold text-white">{fmt(totalKredit)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Balance indicator */}
              <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isBalanced ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/30' : 'bg-red-900/20 text-red-400 border border-red-800/30'}`}>
                {isBalanced
                  ? <><Check className="h-3.5 w-3.5" /> Seimbang — Total Debit = Total Kredit = {fmt(totalDebit)}</>
                  : <><AlertCircle className="h-3.5 w-3.5" /> Tidak seimbang — Selisih: {fmt(Math.abs(totalDebit - totalKredit))}</>
                }
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition">Batal</button>
              <button onClick={handleSave} disabled={saving || !isBalanced || !form.deskripsi}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm text-white disabled:opacity-50 transition">
                <Check className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan sebagai Draft'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {viewJournal && (
        <Modal title={`Detail Jurnal: ${viewJournal.nomor}`} onClose={() => setViewJournal(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-slate-500">Tanggal</p><p className="text-white mt-0.5">{new Date(viewJournal.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p></div>
              <div><p className="text-xs text-slate-500">Status</p><span className={`inline-flex mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_STYLE[viewJournal.status] || ''}`}>{viewJournal.status}</span></div>
              <div><p className="text-xs text-slate-500">Referensi</p><p className="text-white mt-0.5">{viewJournal.referensi || '—'}</p></div>
            </div>
            <p className="text-sm text-slate-300">{viewJournal.deskripsi}</p>
            <table className="w-full text-sm border border-slate-700 rounded-xl overflow-hidden">
              <thead><tr className="bg-slate-800 text-xs text-slate-500 uppercase">
                <th className="text-left px-3 py-2">Akun</th>
                <th className="text-left px-3 py-2">Keterangan</th>
                <th className="text-right px-3 py-2">Debit</th>
                <th className="text-right px-3 py-2">Kredit</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {viewJournal.lines?.map((l: any) => (
                  <tr key={l.id} className="bg-slate-900">
                    <td className="px-3 py-2 text-slate-300">{l.account?.code} — {l.account?.name}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{l.deskripsi || '—'}</td>
                    <td className="px-3 py-2 text-right text-white">{Number(l.debit) > 0 ? fmt(Number(l.debit)) : '—'}</td>
                    <td className="px-3 py-2 text-right text-white">{Number(l.kredit) > 0 ? fmt(Number(l.kredit)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 justify-end pt-2">
              {viewJournal.status === 'DRAFT' && <>
                <button onClick={() => handlePost(viewJournal.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white"><SendHorizonal className="h-3.5 w-3.5" /> Post</button>
                <button onClick={() => handleCancel(viewJournal.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-xs text-white"><Ban className="h-3.5 w-3.5" /> Batalkan</button>
              </>}
              {viewJournal.status === 'POSTED' && <button onClick={() => handleReverse(viewJournal.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-xs text-white"><RotateCcw className="h-3.5 w-3.5" /> Buat Pembalik</button>}
            </div>
          </div>
        </Modal>
      )}
    </ModernLayout>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Memuat jurnal…</div>}>
      <JournalEntryPageContent />
    </Suspense>
  );
}

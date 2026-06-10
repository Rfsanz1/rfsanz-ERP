'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState, useCallback } from 'react';
import AppShell from '../../../components/layout/AppShell';
import { ACCOUNTING_CONFIG, ACCOUNTING_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Plus, Search, RefreshCw, X, Check, AlertCircle, Trash2, RotateCcw, SendHorizonal, Ban } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = { DRAFT: '#F59E0B', POSTED: '#10B981', CANCELLED: '#94A3B8' };
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Draf', POSTED: 'Diposting', CANCELLED: 'Dibatalkan' };

const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};
const inputCls: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};

function Modal({ title, children, onClose, wide }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '32px 16px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: wide ? 800 : 520, boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={15} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function JournalEntryPageContent() {
  const searchParams = useSearchParams();
  const [journals, setJournals]         = useState<any[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [accounts, setAccounts]         = useState<any[]>([]);
  const [showCreate, setShowCreate]     = useState(searchParams.get('action') === 'new');
  const [viewJournal, setViewJournal]   = useState<any>(null);
  const [error, setError]               = useState('');
  const [saving, setSaving]             = useState(false);

  const emptyLine = { accountId: '', debit: '', kredit: '', deskripsi: '' };
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    deskripsi: '', referensi: '',
    lines: [{ ...emptyLine }, { ...emptyLine }],
  });

  const totalDebit  = form.lines.reduce((s, l) => s + Number(l.debit  || 0), 0);
  const totalKredit = form.lines.reduce((s, l) => s + Number(l.kredit || 0), 0);
  const isBalanced  = Math.abs(totalDebit - totalKredit) < 0.01 && totalDebit > 0;

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

  const addLine    = () => setForm(f => ({ ...f, lines: [...f.lines, { ...emptyLine }] }));
  const removeLine = (i: number) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i: number, field: string, val: string) =>
    setForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.post('/finance/journals', {
        ...form,
        lines: form.lines.map(l => ({ accountId: l.accountId, debit: Number(l.debit || 0), kredit: Number(l.kredit || 0), deskripsi: l.deskripsi })),
      });
      setShowCreate(false);
      setForm({ tanggal: new Date().toISOString().split('T')[0], deskripsi: '', referensi: '', lines: [{ ...emptyLine }, { ...emptyLine }] });
      load();
    } catch (e: any) { setError(e?.response?.data?.message || 'Gagal menyimpan jurnal'); }
    finally { setSaving(false); }
  };

  const handlePost    = async (id: string) => { try { await api.post(`/finance/journals/${id}/post`);    load(); setViewJournal(null); } catch (e: any) { alert(e?.response?.data?.message || 'Gagal'); } };
  const handleCancel  = async (id: string) => { if (!confirm('Batalkan jurnal ini?')) return; try { await api.post(`/finance/journals/${id}/cancel`);  load(); setViewJournal(null); } catch (e: any) { alert(e?.response?.data?.message || 'Gagal'); } };
  const handleReverse = async (id: string) => { if (!confirm('Buat jurnal pembalik?')) return; try { await api.post(`/finance/journals/${id}/reverse`); load(); setViewJournal(null); } catch (e: any) { alert(e?.response?.data?.message || 'Gagal'); } };

  const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 0 });

  return (
    <AppShell {...ACCOUNTING_CONFIG} navItems={ACCOUNTING_NAV} activeHref="/accounting/journal-entry">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="flex items-center gap-2" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              <BookOpen size={20} style={{ color: '#6366F1' }} /> Jurnal Akuntansi
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Buat dan kelola jurnal double-entry dengan validasi otomatis</p>
          </div>
          <button onClick={() => { setError(''); setShowCreate(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Buat Jurnal
          </button>
        </div>

        {/* List */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nomor atau deskripsi…"
                style={{ ...inputCls, paddingLeft: 34 }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ ...inputCls, width: 'auto' }}>
              <option value="">Semua Status</option>
              <option value="DRAFT">Draf</option>
              <option value="POSTED">Diposting</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
            <button onClick={load} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nomor','Tanggal','Deskripsi','Total Debit','Status',''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat…</td></tr>
                ) : journals.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada jurnal</td></tr>
                ) : journals.map(j => {
                  const sc = STATUS_COLORS[j.status] ?? '#94A3B8';
                  return (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .12s' }}
                      onClick={() => setViewJournal(j)}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#6366F1' }}>{j.nomor}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(j.tanggal).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: 13 }}>{j.deskripsi || '—'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                        {fmt(j.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: sc, background: sc + '1A', border: `1px solid ${sc}30` }}>
                          {STATUS_LABELS[j.status] ?? j.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {j.status === 'DRAFT' && <>
                            <button onClick={() => handlePost(j.id)} title="Posting" style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: '#10B981', cursor: 'pointer' }}><SendHorizonal size={12} /></button>
                            <button onClick={() => handleCancel(j.id)} title="Batalkan" style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}><Ban size={12} /></button>
                          </>}
                          {j.status === 'POSTED' && <button onClick={() => handleReverse(j.id)} title="Balik" style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: '#8B5CF6', cursor: 'pointer' }}><RotateCcw size={12} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total} jurnal</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page===1?0.4:1 }}>←</button>
              <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={journals.length<20}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: journals.length<20?0.4:1 }}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Buat Jurnal Baru" onClose={() => setShowCreate(false)} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div className="flex items-center gap-2" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#991B1B' }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {[
                { k: 'tanggal',   l: 'Tanggal *',   t: 'date',  p: '' },
                { k: 'deskripsi', l: 'Deskripsi *',  t: 'text',  p: 'mis. Pembayaran sewa Januari' },
                { k: 'referensi', l: 'Referensi',    t: 'text',  p: 'No. Invoice/SO/dll' },
              ].map(f => (
                <div key={f.k}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{f.l}</label>
                  <input type={f.t} style={inputCls} placeholder={f.p} value={(form as any)[f.k]}
                    onChange={e => setForm(fv => ({ ...fv, [f.k]: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                </div>
              ))}
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Baris Jurnal</label>
                <button onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#6366F1', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <Plus size={12} /> Tambah Baris
                </button>
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                      {['Akun','Deskripsi','Debit (Rp)','Kredit (Rp)',''].map(h => (
                        <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textAlign: h === 'Debit (Rp)' || h === 'Kredit (Rp)' ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((line, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                        <td style={{ padding: '5px 8px', minWidth: 160 }}>
                          <select style={{ ...inputCls, padding: '6px 8px', fontSize: 12 }} value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}>
                            <option value="">— Pilih Akun —</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '5px 8px' }}>
                          <input style={{ ...inputCls, padding: '6px 8px', fontSize: 12 }} placeholder="Keterangan…" value={line.deskripsi} onChange={e => updateLine(i, 'deskripsi', e.target.value)} />
                        </td>
                        <td style={{ padding: '5px 8px', width: 120 }}>
                          <input type="number" min="0" style={{ ...inputCls, padding: '6px 8px', fontSize: 12, textAlign: 'right', width: 110 }} placeholder="0" value={line.debit}
                            onChange={e => { updateLine(i, 'debit', e.target.value); if (Number(e.target.value) > 0) updateLine(i, 'kredit', ''); }} />
                        </td>
                        <td style={{ padding: '5px 8px', width: 120 }}>
                          <input type="number" min="0" style={{ ...inputCls, padding: '6px 8px', fontSize: 12, textAlign: 'right', width: 110 }} placeholder="0" value={line.kredit}
                            onChange={e => { updateLine(i, 'kredit', e.target.value); if (Number(e.target.value) > 0) updateLine(i, 'debit', ''); }} />
                        </td>
                        <td style={{ padding: '5px 8px', width: 32 }}>
                          {form.lines.length > 2 && (
                            <button onClick={() => removeLine(i)} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
                      <td colSpan={2} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#3B82F6', fontSize: 13 }}>{fmt(totalDebit)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#8B5CF6', fontSize: 13 }}>{fmt(totalKredit)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                background: isBalanced ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isBalanced ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: isBalanced ? '#065F46' : '#991B1B' }}>
                {isBalanced
                  ? <><Check size={12} /> Seimbang — Total Debit = Total Kredit = {fmt(totalDebit)}</>
                  : <><AlertCircle size={12} /> Tidak seimbang — Selisih: {fmt(Math.abs(totalDebit - totalKredit))}</>
                }
              </div>
            </div>

            <div className="flex justify-end gap-3" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSave} disabled={saving || !isBalanced || !form.deskripsi}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (saving || !isBalanced || !form.deskripsi) ? 0.6 : 1 }}>
                <Check size={13} /> {saving ? 'Menyimpan…' : 'Simpan sebagai Draf'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {viewJournal && (
        <Modal title={`Detail Jurnal: ${viewJournal.nomor}`} onClose={() => setViewJournal(null)} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px' }}>Tanggal</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{new Date(viewJournal.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px' }}>Status</p>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: STATUS_COLORS[viewJournal.status] ?? '#94A3B8', background: (STATUS_COLORS[viewJournal.status] ?? '#94A3B8') + '1A' }}>
                  {STATUS_LABELS[viewJournal.status] ?? viewJournal.status}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 3px' }}>Referensi</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{viewJournal.referensi || '—'}</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{viewJournal.deskripsi}</p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                    {['Akun','Keterangan','Debit','Kredit'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textAlign: h === 'Debit' || h === 'Kredit' ? 'right' as const : 'left' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewJournal.lines?.map((l: any) => (
                    <tr key={l.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '9px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{l.account?.code} — {l.account?.name}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{l.deskripsi || '—'}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: '#3B82F6', fontSize: 13, fontWeight: Number(l.debit) > 0 ? 600 : 400 }}>{Number(l.debit) > 0 ? fmt(Number(l.debit)) : '—'}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: '#8B5CF6', fontSize: 13, fontWeight: Number(l.kredit) > 0 ? 600 : 400 }}>{Number(l.kredit) > 0 ? fmt(Number(l.kredit)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              {viewJournal.status === 'DRAFT' && <>
                <button onClick={() => handlePost(viewJournal.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, border: 'none', background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><SendHorizonal size={13} /> Posting</button>
                <button onClick={() => handleCancel(viewJournal.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Ban size={13} /> Batalkan</button>
              </>}
              {viewJournal.status === 'POSTED' && <button onClick={() => handleReverse(viewJournal.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, border: 'none', background: '#8B5CF6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><RotateCcw size={13} /> Buat Pembalik</button>}
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Memuat jurnal…</div>}>
      <JournalEntryPageContent />
    </Suspense>
  );
}

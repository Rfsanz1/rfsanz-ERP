'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import {
  Users, Plus, Search, RefreshCw, X, Loader2,
  CheckCircle2, AlertCircle, Unlink2,
} from 'lucide-react';
import Link from 'next/link';

const SUB_NAV = [
  { label: 'Semua Pelanggan', href: '/customers' },
  { label: 'Poin Loyalitas',  href: '/customers/loyalty' },
  { label: 'Log WhatsApp',    href: '/customers/whatsapp-log' },
];

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

interface KledoContact {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  credit_limit?: number;
  is_customer?: number;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}
const EMPTY_FORM: FormData = { name: '', email: '', phone: '', address: '' };

export default function CustomersPage() {
  const { token } = useAuthStore();

  // ── Data state ──────────────────────────────────────────────────────────
  const [contacts, setContacts]   = useState<KledoContact[]>([]);
  const [total, setTotal]         = useState(0);
  const [lastPage, setLastPage]   = useState(1);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [klConnected, setKlConnected] = useState<boolean | null>(null);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Name autocomplete inside modal ───────────────────────────────────────
  const [suggest, setSuggest]     = useState<KledoContact[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load contacts from Kledo ─────────────────────────────────────────────
  const load = useCallback(async (pg = page, q = search) => {
    setLoading(true);
    try {
      const res = await api.get('/kledo/contacts', {
        params: { page: pg, per_page: 20, search: q || undefined, type: 'customer' },
      });
      const d = res.data?.data;
      setContacts(d?.data ?? []);
      setTotal(d?.total ?? 0);
      setLastPage(d?.last_page ?? 1);
      setKlConnected(true);
    } catch {
      setKlConnected(false);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { if (token) load(page, search); }, [page, search, token]);


  // ── Autocomplete when typing name in modal ───────────────────────────────
  const searchSuggest = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggest([]); setSuggestOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await api.get('/kledo/contacts', { params: { search: q, type: 'customer', per_page: 8 } });
        const items: KledoContact[] = res.data?.data?.data ?? [];
        setSuggest(items);
        setSuggestOpen(true);
      } catch { setSuggest([]); }
      finally { setSuggestLoading(false); }
    }, 300);
  }, []);

  const pickSuggest = (c: KledoContact) => {
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '' });
    setSuggest([]); setSuggestOpen(false);
  };

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openModal = () => {
    setForm(EMPTY_FORM); setSaveResult(null);
    setSuggest([]); setSuggestOpen(false);
    setShowModal(true);
  };
  const closeModal = () => { if (saving) return; setShowModal(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setSaveResult(null);
    try {
      await api.post('/kledo/contacts', {
        name:    form.name.trim(),
        email:   form.email.trim()   || null,
        phone:   form.phone.trim()   || null,
        address: form.address.trim() || null,
      });
      setSaveResult({ ok: true, msg: 'Kontak berhasil ditambahkan ke Kledo!' });
      load(1, search);
      setTimeout(() => { setShowModal(false); setSaveResult(null); }, 1300);
    } catch (err: any) {
      setSaveResult({ ok: false, msg: err?.response?.data?.message ?? 'Gagal menyimpan ke Kledo.' });
    } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 13px', borderRadius: 10,
    border: '1px solid var(--border)', outline: 'none', fontSize: 13,
    background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
  };

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Data Pelanggan
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Kontak pelanggan langsung dari Kledo
              {klConnected === true && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.10)', padding: '2px 8px', borderRadius: 100 }}>
                  ● Kledo terhubung
                </span>
              )}
              {klConnected === false && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.10)', padding: '2px 8px', borderRadius: 100 }}>
                  ✕ Kledo tidak terhubung
                </span>
              )}
            </p>
          </div>
          <button
            onClick={openModal}
            disabled={klConnected === false}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: klConnected === false ? '#94A3B8' : '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: klConnected === false ? 'not-allowed' : 'pointer' }}
          >
            <Plus size={14} /> Tambah Pelanggan
          </button>
        </div>

        {/* Sub nav */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {SUB_NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
              background: n.href === '/customers' ? 'var(--surface)' : 'transparent',
              color: n.href === '/customers' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: n.href === '/customers' ? 'var(--shadow-xs)' : 'none',
            }}>{n.label}</Link>
          ))}
        </div>

        {/* Stats */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#6366F1', margin: 0, letterSpacing: '-0.02em' }}>{total}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Total Pelanggan di Kledo</p>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nama pelanggan Kledo…"
              />
            </div>
            <button
              onClick={() => load(page, search)}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Not connected banner */}
          {klConnected === false && (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <Unlink2 size={36} style={{ color: '#94A3B8', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Kledo Belum Terhubung</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Tambahkan <strong>KLEDO_TOKEN</strong> di Secrets untuk menampilkan data pelanggan dari Kledo.
              </p>
            </div>
          )}

          {klConnected !== false && (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Nama', 'Email', 'Telepon', 'Alamat', 'ID Kledo'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                          <Loader2 size={24} style={{ color: '#6366F1', margin: '0 auto', display: 'block', animation: 'spin .7s linear infinite' }} />
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '10px 0 0' }}>Memuat kontak dari Kledo…</p>
                        </td>
                      </tr>
                    ) : contacts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                          <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            {search ? `Tidak ada kontak dengan nama "${search}"` : 'Belum ada kontak pelanggan di Kledo'}
                          </p>
                        </td>
                      </tr>
                    ) : contacts.map(c => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '13px 16px' }}>
                          <div className="flex items-center gap-2.5">
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6366F11A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#6366F1', flexShrink: 0 }}>
                              {c.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.email || '–'}</td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.phone || '–'}</td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 200 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '–'}</span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: '#6366F1', background: 'rgba(99,102,241,0.10)' }}>
                            #{c.id}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                <span>Total: {total} kontak Kledo</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}
                  >←</button>
                  <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page} / {lastPage}</span>
                  <button
                    onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                    disabled={page >= lastPage}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page >= lastPage ? 0.4 : 1 }}
                  >→</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MODAL TAMBAH KONTAK KLEDO ─── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Tambah Pelanggan</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Kontak baru langsung disimpan ke Kledo</p>
              </div>
              <button onClick={closeModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 8, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
              <div className="space-y-4">

                {/* Nama dengan autocomplete */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Nama <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      autoFocus
                      value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value })); searchSuggest(e.target.value); }}
                      onBlur={() => setTimeout(() => setSuggestOpen(false), 180)}
                      style={{ ...inputStyle, paddingRight: 36 }}
                      placeholder="Nama pelanggan"
                      required
                    />
                    {suggestLoading && (
                      <Loader2 size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6366F1', animation: 'spin .7s linear infinite' }} />
                    )}

                    {suggestOpen && suggest.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                        <div style={{ padding: '5px 12px 3px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)' }}>
                          Kontak Kledo
                        </div>
                        {suggest.map(c => (
                          <button key={c.id} type="button" onMouseDown={() => pickSuggest(c)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                              {[c.phone, c.email].filter(Boolean).join(' · ') || '–'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Telepon</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} placeholder="08xxxxxxxxxx" type="tel" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="email@contoh.com" type="email" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Alamat</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputStyle} placeholder="Jl. Contoh No. 1" />
                </div>

                {saveResult && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, background: saveResult.ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)', color: saveResult.ok ? '#10B981' : '#EF4444' }}>
                    {saveResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    {saveResult.msg}
                  </div>
                )}

                <div className="flex gap-3 justify-end" style={{ paddingTop: 4 }}>
                  <button type="button" onClick={closeModal} disabled={saving}
                    style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                    Batal
                  </button>
                  <button type="submit" disabled={saving || !form.name.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.name.trim() ? 0.6 : 1 }}>
                    {saving ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Menyimpan…</> : 'Simpan ke Kledo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}

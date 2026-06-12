'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import AppShell from '../../components/layout/AppShell';
import { CRM_CONFIG, CRM_NAV } from '../../lib/nav-configs';
import { api } from '../../lib/api';
import { Users, Plus, Search, RefreshCw, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const SUB_NAV = [
  { label: 'Semua Pelanggan', href: '/customers' },
  { label: 'Poin Loyalitas',  href: '/customers/loyalty' },
  { label: 'Log WhatsApp',    href: '/customers/whatsapp-log' },
];

const card: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: 16,
  border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

interface KledoContact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  kledoId: string;
}

const EMPTY_FORM: FormData = { name: '', email: '', phone: '', address: '', city: '', kledoId: '' };

export default function CustomersPage() {
  const { token } = useAuthStore();
  const [data, setData]       = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);

  // Modal state
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Kledo autocomplete state
  const [klSearch, setKlSearch]         = useState('');
  const [klSuggestions, setKlSuggestions] = useState<KledoContact[]>([]);
  const [klLoading, setKlLoading]       = useState(false);
  const [klOpen, setKlOpen]             = useState(false);
  const [klError, setKlError]           = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        api.get('/customers', { params: { search, page, limit: 20 } }),
        api.get('/customers/summary'),
      ]);
      setData(r.data.data ?? []);
      setTotal(r.data.total ?? 0);
      setSummary(s.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (token) load(); }, [search, page, token]);
  if (!token) return null;

  // Debounced Kledo contact search
  const searchKledo = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setKlSuggestions([]); setKlOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setKlLoading(true);
      setKlError(false);
      try {
        const res = await api.get('/kledo/contacts', { params: { search: q, type: 'customer', per_page: 8 } });
        const contacts: KledoContact[] = res.data?.data?.data ?? res.data?.data ?? [];
        setKlSuggestions(contacts);
        setKlOpen(true);
      } catch {
        setKlError(true);
        setKlSuggestions([]);
        setKlOpen(false);
      } finally {
        setKlLoading(false);
      }
    }, 350);
  }, []);

  const handleNameInput = (val: string) => {
    setKlSearch(val);
    setForm(f => ({ ...f, name: val, kledoId: '' }));
    searchKledo(val);
  };

  const selectKledoContact = (c: KledoContact) => {
    setForm(f => ({
      ...f,
      name: c.name,
      email: c.email || f.email,
      phone: c.phone || f.phone,
      address: c.address || f.address,
      kledoId: String(c.id),
    }));
    setKlSearch(c.name);
    setKlSuggestions([]);
    setKlOpen(false);
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setKlSearch('');
    setKlSuggestions([]);
    setKlOpen(false);
    setSaveResult(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setKlSuggestions([]);
    setKlOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveResult(null);
    try {
      await api.post('/customers', {
        name:    form.name.trim(),
        email:   form.email.trim() || null,
        phone:   form.phone.trim() || null,
        address: form.address.trim() || null,
        city:    form.city.trim() || null,
        kledoId: form.kledoId || null,
        active:  true,
      });
      setSaveResult({ ok: true, msg: 'Pelanggan berhasil ditambahkan!' });
      load();
      setTimeout(() => { setShowModal(false); setSaveResult(null); }, 1200);
    } catch (err: any) {
      setSaveResult({ ok: false, msg: err?.response?.data?.message ?? 'Gagal menyimpan pelanggan.' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 13px', borderRadius: 10,
    border: '1px solid var(--border)', outline: 'none', fontSize: 13,
    background: 'var(--surface-sunken)', color: 'var(--text-primary)',
    boxSizing: 'border-box',
  };

  return (
    <AppShell {...CRM_CONFIG} navItems={CRM_NAV} activeHref="/customers">
      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Data Pelanggan</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Manajemen data pelanggan &amp; riwayat transaksi</p>
          </div>
          <button
            onClick={openModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> Tambah Pelanggan
          </button>
        </div>

        {/* Sub nav tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {SUB_NAV.map(n => (
            <Link key={n.href} href={n.href}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                background: n.href === '/customers' ? 'var(--surface)' : 'transparent',
                color: n.href === '/customers' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: n.href === '/customers' ? 'var(--shadow-xs)' : 'none',
              }}
            >{n.label}</Link>
          ))}
        </div>

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Pelanggan', value: summary.total,    accent: '#6366F1' },
              { label: 'Pelanggan Aktif', value: summary.active,   accent: '#10B981' },
              { label: 'Tidak Aktif',     value: summary.inactive, accent: '#94A3B8' },
            ].map(s => (
              <div key={s.label} style={card}>
                <p style={{ fontSize: 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value ?? 0}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '5px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                placeholder="Cari nama pelanggan…" />
            </div>
            <button onClick={load}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nama', 'Email', 'Telepon', 'Kota', 'Status'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Memuat data…</td></tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                      <Users size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Belum ada pelanggan terdaftar</p>
                    </td>
                  </tr>
                ) : data.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div className="flex items-center gap-2.5">
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6366F11A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#6366F1', flexShrink: 0 }}>
                          {c.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                          {c.kledoId && (
                            <span style={{ display: 'block', fontSize: 10, color: '#6366F1', fontWeight: 600 }}>Kledo #{c.kledoId}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.email || '–'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.phone || '–'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{c.city || '–'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: c.active ? '#10B981' : '#94A3B8', background: c.active ? 'rgba(16,185,129,0.10)' : 'rgba(148,163,184,0.12)' }}>
                        {c.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Total: {total} pelanggan</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
              <span style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>Hal {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={data.length < 20}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', cursor: 'pointer', opacity: data.length < 20 ? 0.4 : 1 }}>→</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL TAMBAH PELANGGAN ─── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            {/* Modal header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Tambah Pelanggan</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Ketik nama untuk mengambil kontak dari Kledo
                </p>
              </div>
              <button onClick={closeModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 8, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
              <div className="space-y-4">

                {/* Nama — dengan Kledo autocomplete */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Nama Pelanggan <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <div style={{ position: 'relative' }}>
                      <input
                        autoFocus
                        value={klSearch}
                        onChange={e => handleNameInput(e.target.value)}
                        onFocus={() => { if (klSuggestions.length > 0) setKlOpen(true); }}
                        onBlur={() => setTimeout(() => setKlOpen(false), 200)}
                        style={{ ...inputStyle, paddingRight: 36 }}
                        placeholder="Ketik nama untuk cari di Kledo…"
                        required
                      />
                      {klLoading && (
                        <Loader2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6366F1', animation: 'spin .7s linear infinite' }} />
                      )}
                      {form.kledoId && !klLoading && (
                        <CheckCircle2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#10B981' }} />
                      )}
                    </div>

                    {/* Dropdown suggestions */}
                    {klOpen && klSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        marginTop: 4, maxHeight: 240, overflowY: 'auto',
                      }}>
                        <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)' }}>
                          Kontak Kledo
                        </div>
                        {klSuggestions.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => selectKledoContact(c)}
                            style={{
                              display: 'block', width: '100%', textAlign: 'left',
                              padding: '10px 14px', border: 'none', background: 'none',
                              cursor: 'pointer', transition: 'background .1s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-hover)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                              {[c.phone, c.email].filter(Boolean).join(' · ') || 'Tidak ada detail'}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {klOpen && !klLoading && klSuggestions.length === 0 && klSearch.trim().length >= 2 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        marginTop: 4, padding: '12px 14px',
                        fontSize: 12, color: 'var(--text-muted)',
                      }}>
                        {klError
                          ? 'Kledo tidak terhubung — nama akan disimpan manual.'
                          : `Tidak ditemukan di Kledo. Nama "${klSearch}" akan disimpan baru.`}
                      </div>
                    )}

                    {form.kledoId && (
                      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                        <CheckCircle2 size={12} /> Kontak Kledo #{form.kledoId} terhubung
                      </div>
                    )}
                  </div>
                </div>

                {/* Telepon */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Telepon</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    style={inputStyle}
                    placeholder="08xxxxxxxxxx"
                    type="tel"
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={inputStyle}
                    placeholder="email@contoh.com"
                    type="email"
                  />
                </div>

                {/* Kota + Alamat side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Kota</label>
                    <input
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      style={inputStyle}
                      placeholder="Surabaya"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Alamat</label>
                    <input
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      style={inputStyle}
                      placeholder="Jl. Contoh No. 1"
                    />
                  </div>
                </div>

                {/* Save result */}
                {saveResult && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: saveResult.ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                    color: saveResult.ok ? '#10B981' : '#EF4444',
                  }}>
                    {saveResult.ok
                      ? <CheckCircle2 size={15} />
                      : <AlertCircle size={15} />}
                    {saveResult.msg}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end" style={{ paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.name.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.name.trim() ? 0.6 : 1 }}
                  >
                    {saving ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Menyimpan…</> : 'Simpan Pelanggan'}
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

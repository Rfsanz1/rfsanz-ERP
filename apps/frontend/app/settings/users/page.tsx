'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import {
  Users, Plus, Search, X, Shield, RefreshCw, Edit2,
  Trash2, Check, AlertCircle, Eye, EyeOff, UserCheck, UserX,
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  admin: '#6366F1', owner: '#D97706', 'super admin': '#DC2626',
  sales: '#0891B2', gudang: '#F57C00', driver: '#1D4ED8',
};
const roleColor = (r: string) => ROLE_COLORS[r?.toLowerCase()] ?? '#6366F1';

interface EUser { id: string; name: string | null; email: string; role: string; roleId: string; active: boolean; createdAt: string; }
interface Role { id: string; name: string; description?: string }

const initForm = { name: '', email: '', password: '', roleId: '' };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', outline: 'none', fontSize: 13,
  background: 'var(--surface-sunken)', color: 'var(--text-primary)', boxSizing: 'border-box',
};
const thStyle: React.CSSProperties = {
  padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em',
};

export default function UserManagementPage() {
  const { token }       = useAuthStore();
  const [users, setUsers]           = useState<EUser[]>([]);
  const [roles, setRoles]           = useState<Role[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<EUser | null>(null);
  const [form, setForm]             = useState(initForm);
  const [showPw, setShowPw]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EUser | null>(null);
  const [toast, setToast]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([api.get('/users'), api.get('/roles')]);
      setUsers(uRes.data);
      setRoles(rRes.data);
    } catch {
      showToast('error', 'Gagal memuat data. Pastikan Anda memiliki akses admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) loadData(); }, [token, loadData]);

  const openCreate = () => { setEditTarget(null); setForm({ ...initForm, roleId: roles[0]?.id ?? '' }); setShowPw(false); setShowForm(true); };
  const openEdit   = (u: EUser) => { setEditTarget(u); setForm({ name: u.name ?? '', email: u.email, password: '', roleId: u.roleId }); setShowPw(false); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditTarget(null); setForm(initForm); };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) { showToast('error', 'Nama dan email wajib diisi.'); return; }
    if (!editTarget && !form.password.trim())    { showToast('error', 'Password wajib diisi untuk user baru.'); return; }
    if (!form.roleId)                            { showToast('error', 'Pilih role terlebih dahulu.'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        const payload: any = { name: form.name, email: form.email, roleId: form.roleId };
        if (form.password) payload.password = form.password;
        const res = await api.put(`/users/${editTarget.id}`, payload);
        setUsers(us => us.map(u => u.id === editTarget.id ? res.data : u));
        showToast('success', 'User berhasil diperbarui!');
      } else {
        const res = await api.post('/users', { name: form.name, email: form.email, password: form.password, roleId: form.roleId });
        setUsers(us => [...us, res.data]);
        showToast('success', 'User baru berhasil ditambahkan!');
      }
      closeForm();
    } catch (e: any) { showToast('error', e?.response?.data?.message ?? 'Gagal menyimpan user.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u: EUser) => {
    try {
      const res = await api.patch(`/users/${u.id}/toggle-active`);
      setUsers(us => us.map(x => x.id === u.id ? res.data : x));
      showToast('success', res.data.active ? `${u.name} diaktifkan.` : `${u.name} dinonaktifkan.`);
    } catch { showToast('error', 'Gagal mengubah status user.'); }
  };

  const deleteUser = async (u: EUser) => {
    try {
      await api.delete(`/users/${u.id}`);
      setUsers(us => us.filter(x => x.id !== u.id));
      showToast('success', `User ${u.name} dihapus.`);
    } catch { showToast('error', 'Gagal menghapus user.'); }
    finally { setConfirmDelete(null); }
  };

  const filtered = users.filter(u =>
    ((u.name ?? '').toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === '' || u.roleId === roleFilter)
  );



  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/settings/users">

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${toast.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
          color: toast.type === 'success' ? '#065F46' : '#991B1B' }}>
          {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 1200 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Manajemen Pengguna</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Kelola akun pengguna, role, dan hak akses sistem ERP</p>
          </div>
          <button onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Tambah User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total User',    value: users.length,                         accent: '#6366F1', Icon: Users },
            { label: 'Aktif',         value: users.filter(u => u.active).length,   accent: '#10B981', Icon: UserCheck },
            { label: 'Tidak Aktif',   value: users.filter(u => !u.active).length,  accent: '#94A3B8', Icon: UserX },
            { label: 'Total Role',    value: roles.length,                         accent: '#F59E0B', Icon: Shield },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s.accent + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.Icon size={13} style={{ color: s.accent }} />
                </div>
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email…"
                style={{ ...inputStyle, paddingLeft: 34 }}
                onFocus={e => { e.target.style.borderColor = '#6366F1'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', outline: 'none', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-sunken)', cursor: 'pointer' }}>
              <option value="">Semua Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Segarkan
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <RefreshCw size={22} className="animate-spin mx-auto mb-3" style={{ color: '#6366F1' }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Memuat data pengguna…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Tidak ada pengguna ditemukan</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Coba ubah filter atau tambah user baru</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Pengguna','Email','Role','Status','Dibuat','Aksi'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const rc = roleColor(u.role);
                    const initial = ((u.name ?? u.email)[0] ?? 'U').toUpperCase();
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-3">
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: rc, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{initial}</div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.name ?? '—'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: rc, background: rc + '1A', border: `1px solid ${rc}30`, textTransform: 'capitalize' }}>{u.role}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => toggleActive(u)}
                            style={{ position: 'relative', display: 'inline-flex', width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: u.active ? '#10B981' : '#D1D5DB', transition: 'background .2s' }}
                            title={u.active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}>
                            <span style={{ position: 'absolute', top: 3, width: 14, height: 14, borderRadius: 7, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.18)', transition: 'left .2s', left: u.active ? 18 : 3 }} />
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(u)} title="Edit user"
                              style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: '#6366F1', cursor: 'pointer' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.10)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => setConfirmDelete(u)} title="Hapus user"
                              style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                              <Trash2 size={13} />
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
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={14} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  {editTarget ? 'Edit User' : 'Tambah User Baru'}
                </span>
              </div>
              <button onClick={closeForm} style={{ padding: 6, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Nama Lengkap <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="text" style={inputStyle} placeholder="Masukkan nama lengkap…" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Email <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="email" style={inputStyle} placeholder="user@gentongmas.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Password {!editTarget && <span style={{ color: '#EF4444' }}>*</span>}
                  {editTarget && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (kosongkan jika tidak diubah)</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 42 }}
                    placeholder={editTarget ? 'Password baru (opsional)…' : 'Min. 8 karakter…'}
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Role <span style={{ color: '#EF4444' }}>*</span></label>
                <select style={inputStyle} value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = '#6366F1'; }} onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}>
                  <option value="">Pilih role…</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={closeForm}
                style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={save} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.75 : 1 }}>
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                {saving ? 'Menyimpan…' : editTarget ? 'Simpan Perubahan' : 'Tambah User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 360, boxShadow: '0 24px 64px rgba(0,0,0,.18)', border: '1px solid var(--border)' }}>
            <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={20} style={{ color: '#EF4444' }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', margin: '0 0 6px' }}>Hapus User?</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                User <strong>{confirmDelete.name ?? confirmDelete.email}</strong> akan dihapus permanen dan tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex gap-3" style={{ padding: '0 24px 24px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-sunken)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={() => deleteUser(confirmDelete)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

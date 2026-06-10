'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../../lib/nav-configs';
import { api } from '../../../lib/api';
import {
  Users, Plus, Search, X, Shield, RefreshCw, Edit2,
  Trash2, Check, AlertCircle, Eye, EyeOff, UserCheck, UserX,
} from 'lucide-react';

const C = {
  primary: '#5B52D1',
  light: '#8B80F9',
  bg: '#F5F3FF',
  border: '#EDE9FE',
  dark: '#1E1B4B',
  mid: '#6B7280',
  muted: '#9CA3AF',
  white: '#FFFFFF',
  pill: 'rgba(91,82,209,0.08)',
  pillBorder: 'rgba(91,82,209,0.15)',
};

interface EUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  roleId: string;
  active: boolean;
  createdAt: string;
}

interface Role { id: string; name: string; description?: string }

const ROLE_COLORS: Record<string, string> = {
  admin: '#5B52D1',
  owner: '#D97706',
  'super admin': '#DC2626',
  sales: '#0891B2',
  gudang: '#F57C00',
  driver: '#1D4ED8',
};
const roleColor = (r: string) => ROLE_COLORS[r?.toLowerCase()] ?? C.primary;

const initForm = { name: '', email: '', password: '', roleId: '' };

export default function UserManagementPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [users, setUsers] = useState<EUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<EUser | null>(null);
  const [form, setForm] = useState(initForm);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EUser | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => { if (!token) router.push('/login'); }, [token]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsers(uRes.data);
      setRoles(rRes.data);
    } catch {
      showToast('error', 'Gagal memuat data. Pastikan Anda memiliki akses admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) loadData(); }, [token, loadData]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...initForm, roleId: roles[0]?.id ?? '' });
    setShowPw(false);
    setShowForm(true);
  };

  const openEdit = (u: EUser) => {
    setEditTarget(u);
    setForm({ name: u.name ?? '', email: u.email, password: '', roleId: u.roleId });
    setShowPw(false);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(initForm); };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('error', 'Nama dan email wajib diisi.'); return;
    }
    if (!editTarget && !form.password.trim()) {
      showToast('error', 'Password wajib diisi untuk user baru.'); return;
    }
    if (!form.roleId) {
      showToast('error', 'Pilih role terlebih dahulu.'); return;
    }
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
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Gagal menyimpan user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: EUser) => {
    try {
      const res = await api.patch(`/users/${u.id}/toggle-active`);
      setUsers(us => us.map(x => x.id === u.id ? res.data : x));
      showToast('success', res.data.active ? `${u.name} diaktifkan.` : `${u.name} dinonaktifkan.`);
    } catch {
      showToast('error', 'Gagal mengubah status user.');
    }
  };

  const deleteUser = async (u: EUser) => {
    try {
      await api.delete(`/users/${u.id}`);
      setUsers(us => us.filter(x => x.id !== u.id));
      showToast('success', `User ${u.name} dihapus.`);
    } catch {
      showToast('error', 'Gagal menghapus user.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = users.filter(u =>
    ((u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter === '' || u.roleId === roleFilter)
  );

  if (!token) return null;

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/settings/users">
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-medium shadow-lg"
            style={{
              backgroundColor: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1.5px solid ${toast.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
              color: toast.type === 'success' ? '#065F46' : '#991B1B',
            }}
          >
            {toast.type === 'success' ? <Check className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: C.dark }}>User Management</h1>
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>Kelola akun pengguna, role, dan hak akses sistem ERP</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.light})`, boxShadow: '0 4px 14px rgba(91,82,209,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(91,82,209,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,82,209,0.35)'; }}
          >
            <Plus className="h-4 w-4" />
            Tambah User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total User', value: users.length, color: C.primary, icon: Users },
            { label: 'Aktif', value: users.filter(u => u.active).length, color: '#059669', icon: UserCheck },
            { label: 'Tidak Aktif', value: users.filter(u => !u.active).length, color: '#9CA3AF', icon: UserX },
            { label: 'Total Role', value: roles.length, color: '#D97706', icon: Shield },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-5"
              style={{ backgroundColor: C.white, border: `1.5px solid ${C.border}`, boxShadow: '0 1px 6px rgba(91,82,209,0.06)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: C.muted }}>{s.label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.white, border: `1.5px solid ${C.border}`, boxShadow: '0 1px 6px rgba(91,82,209,0.06)' }}>
          {/* Filters */}
          <div className="flex items-center gap-3 px-6 py-4 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: C.muted }} />
              <input
                className="w-full rounded-xl pl-9 pr-4 py-2 text-sm transition-all"
                style={{ border: `1.5px solid ${C.border}`, color: C.dark, outline: 'none', backgroundColor: C.bg }}
                placeholder="Cari nama atau email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <select
              className="rounded-xl px-3 py-2 text-sm"
              style={{ border: `1.5px solid ${C.border}`, color: C.dark, outline: 'none', backgroundColor: C.bg }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">Semua Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button onClick={loadData} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-all" style={{ border: `1.5px solid ${C.border}`, color: C.mid, backgroundColor: C.bg }}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3" style={{ color: C.light }} />
              <p className="text-sm" style={{ color: C.muted }}>Memuat data pengguna...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: C.primary }} />
              <p className="text-sm font-medium" style={{ color: C.dark }}>Tidak ada pengguna ditemukan</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>Coba ubah filter atau tambah user baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
                    {['Pengguna', 'Email', 'Role', 'Status', 'Dibuat', 'Aksi'].map(h => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold" style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const rc = roleColor(u.role);
                    const initial = ((u.name ?? u.email)[0] ?? 'U').toUpperCase();
                    return (
                      <tr key={u.id} className="group transition-colors" style={{ borderBottom: `1px solid ${C.bg}` }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${rc}, ${rc}cc)` }}
                            >
                              {initial}
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: C.dark }}>{u.name ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-xs" style={{ color: C.mid }}>{u.email}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                            style={{ color: rc, backgroundColor: `${rc}15`, border: `1px solid ${rc}30` }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <button
                            onClick={() => toggleActive(u)}
                            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
                            style={{ backgroundColor: u.active ? '#10B981' : '#D1D5DB' }}
                            title={u.active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                          >
                            <span
                              className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
                              style={{ transform: u.active ? 'translateX(18px)' : 'translateX(2px)' }}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-xs" style={{ color: C.muted }}>
                          {new Date(u.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg transition-colors"
                              title="Edit user"
                              style={{ color: C.primary }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = C.pill}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u)}
                              className="p-1.5 rounded-lg transition-colors"
                              title="Hapus user"
                              style={{ color: '#EF4444' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-md"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: `1.5px solid ${C.border}` }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.light})` }}>
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h2 className="font-bold text-base" style={{ color: C.dark }}>
                  {editTarget ? 'Edit User' : 'Tambah User Baru'}
                </h2>
              </div>
              <button onClick={closeForm} className="rounded-lg p-1.5 transition-colors"
                style={{ color: C.muted }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.dark }}>Nama Lengkap <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all"
                  style={{ border: `1.5px solid ${C.border}`, color: C.dark, outline: 'none', backgroundColor: C.bg }}
                  placeholder="Masukkan nama lengkap..."
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.dark }}>Email <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="email"
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all"
                  style={{ border: `1.5px solid ${C.border}`, color: C.dark, outline: 'none', backgroundColor: C.bg }}
                  placeholder="user@gentongmas.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.dark }}>
                  Password {!editTarget && <span style={{ color: '#EF4444' }}>*</span>}
                  {editTarget && <span style={{ color: C.muted, fontWeight: 400 }}> (kosongkan jika tidak diubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="w-full rounded-xl px-4 py-2.5 pr-11 text-sm transition-all"
                    style={{ border: `1.5px solid ${C.border}`, color: C.dark, outline: 'none', backgroundColor: C.bg }}
                    placeholder={editTarget ? 'Password baru (opsional)...' : 'Min 8 karakter...'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: C.muted }}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.dark }}>Role <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  className="w-full rounded-xl px-4 py-2.5 text-sm transition-all"
                  style={{ border: `1.5px solid ${C.border}`, color: form.roleId ? C.dark : C.muted, outline: 'none', backgroundColor: C.bg }}
                  value={form.roleId}
                  onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                >
                  <option value="">Pilih role...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={closeForm}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: `1.5px solid ${C.border}`, color: C.mid, backgroundColor: C.white }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}
              >
                Batal
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.light})`, opacity: saving ? 0.75 : 1 }}
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Tambah User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-sm"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: `1.5px solid ${C.border}` }}
          >
            <div className="p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl mx-auto mb-4" style={{ backgroundColor: '#FEF2F2' }}>
                <Trash2 className="h-5 w-5" style={{ color: '#EF4444' }} />
              </div>
              <h2 className="font-bold text-base mb-1" style={{ color: C.dark }}>Hapus User?</h2>
              <p className="text-sm" style={{ color: C.mid }}>
                User <strong>{confirmDelete.name ?? confirmDelete.email}</strong> akan dihapus secara permanen dan tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: `1.5px solid ${C.border}`, color: C.mid }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.white}
              >
                Batal
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#EF4444' }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

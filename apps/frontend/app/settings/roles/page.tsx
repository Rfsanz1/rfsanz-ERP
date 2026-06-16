'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { SETTINGS_CONFIG, SETTINGS_NAV } from '../../../lib/nav-configs';
import { Shield, Plus, X, Check, Edit } from 'lucide-react';

const C = '#546E7A';

const MODULES_LIST = ['Dashboard', 'Penjualan', 'Quotation', 'Invoice', 'CRM', 'Inventory', 'Pembelian', 'Manufaktur', 'Akuntansi', 'Jurnal', 'HR & Karyawan', 'Payroll', 'Rekrutmen', 'Servis', 'Armada', 'Marketplace', 'Laporan', 'Pengaturan'];
const PERMS = ['Lihat', 'Buat', 'Edit', 'Hapus', 'Approve'];

const SAMPLE_ROLES = [
  { id: 1, name: 'Administrator', desc: 'Akses penuh ke semua modul', users: 1, color: '#EA5455', perms: {} as Record<string, string[]> },
  { id: 2, name: 'Manajer Sales', desc: 'Akses sales, CRM, invoice, laporan', users: 2, color: '#8E24AA', perms: {} as Record<string, string[]> },
  { id: 3, name: 'Staff Keuangan', desc: 'Akses akuntansi, jurnal, invoice', users: 3, color: '#388E3C', perms: {} as Record<string, string[]> },
  { id: 4, name: 'Operator Gudang', desc: 'Akses inventory, penerimaan barang', users: 5, color: '#F57C00', perms: {} as Record<string, string[]> },
  { id: 5, name: 'Staff HR', desc: 'Akses HR, payroll, rekrutmen', users: 2, color: '#C2185B', perms: {} as Record<string, string[]> },
  { id: 6, name: 'Sales', desc: 'Akses penjualan dan CRM dasar', users: 6, color: '#00ACC1', perms: {} as Record<string, string[]> },
];

const DEFAULT_ADMIN_PERMS: Record<string, string[]> = MODULES_LIST.reduce((acc, m) => ({ ...acc, [m]: [...PERMS] }), {});
const DEFAULT_SALES_PERMS: Record<string, string[]> = {
  'Dashboard': ['Lihat'],
  'Penjualan': ['Lihat', 'Buat', 'Edit'],
  'Quotation': ['Lihat', 'Buat', 'Edit'],
  'Invoice': ['Lihat', 'Buat'],
  'CRM': ['Lihat', 'Buat', 'Edit'],
  'Laporan': ['Lihat'],
};

export default function RolesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [roles, setRoles] = useState(SAMPLE_ROLES.map((r, i) => ({ ...r, perms: i === 0 ? DEFAULT_ADMIN_PERMS : (i === 1 ? DEFAULT_SALES_PERMS : {}) })));
  const [selected, setSelected] = useState(roles[0]);
  const [editPerms, setEditPerms] = useState<Record<string, string[]>>(DEFAULT_ADMIN_PERMS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', desc: '' });
  const [msg, setMsg] = useState('');



  const selectRole = (role: typeof roles[0]) => {
    setSelected(role);
    setEditPerms(role.perms ?? {});
  };

  const togglePerm = (module: string, perm: string) => {
    setEditPerms(ep => {
      const cur = ep[module] ?? [];
      return { ...ep, [module]: cur.includes(perm) ? cur.filter(p => p !== perm) : [...cur, perm] };
    });
  };

  const hasPerm = (module: string, perm: string) => {
    if (selected.name === 'Administrator') return true;
    return (editPerms[module] ?? []).includes(perm);
  };

  const save = () => {
    setRoles(rs => rs.map(r => r.id === selected.id ? { ...r, perms: editPerms } : r));
    setMsg('Role berhasil disimpan!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <AppShell {...SETTINGS_CONFIG} navItems={SETTINGS_NAV} activeHref="/settings/roles">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Role & Permission</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Kelola role dan hak akses per modul sistem</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
            <Plus className="h-4 w-4" /> Tambah Role
          </button>
        </div>

        {msg && <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ backgroundColor: 'rgba(76,175,80,.1)', border: '1px solid rgba(76,175,80,.3)', color: '#388E3C' }}><Check className="h-4 w-4" />{msg}</div>}

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold px-1" style={{ color: '#9CA3AF' }}>DAFTAR ROLE</p>
            {roles.map(role => (
              <div key={role.id} onClick={() => selectRole(role)} className="bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-md" style={{ border: `2px solid ${selected.id === role.id ? role.color : '#EDE8F5'}` }}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: role.color }}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1E1B4B' }}>{role.name}</p>
                    <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{role.users} user · {role.desc.substring(0, 30)}...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-2 bg-white rounded-2xl" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: selected.color }}>
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: '#1E1B4B' }}>{selected.name}</h3>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{selected.desc}</p>
                </div>
              </div>
              {selected.name !== 'Administrator' && (
                <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                  <Check className="h-3.5 w-3.5" /> Simpan
                </button>
              )}
            </div>

            {selected.name === 'Administrator' ? (
              <div className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-3" style={{ color: '#EA545520' }} />
                <p className="font-semibold" style={{ color: '#1E1B4B' }}>Role Administrator</p>
                <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Administrator memiliki akses penuh ke semua modul dan tidak dapat dibatasi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE8F5', backgroundColor: '#F5F3FF' }}>
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: '#9CA3AF' }}>Modul</th>
                      {PERMS.map(p => (
                        <th key={p} className="px-3 py-3 text-center font-semibold" style={{ color: '#9CA3AF' }}>{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES_LIST.map(mod => (
                      <tr key={mod} style={{ borderBottom: '1px solid #F5F3FF' }} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium" style={{ color: '#1E1B4B' }}>{mod}</td>
                        {PERMS.map(perm => (
                          <td key={perm} className="px-3 py-2.5 text-center">
                            <button onClick={() => togglePerm(mod, perm)} className="h-5 w-5 rounded flex items-center justify-center mx-auto transition-colors" style={{ backgroundColor: hasPerm(mod, perm) ? C : '#F5F3FF', border: `1.5px solid ${hasPerm(mod, perm) ? C : '#D1D5DB'}` }}>
                              {hasPerm(mod, perm) && <Check className="h-3 w-3 text-white" />}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-sm mx-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EDE8F5' }}>
                <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Tambah Role Baru</h2>
                <button onClick={() => setShowForm(false)} style={{ color: '#9CA3AF' }}><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Nama Role *</label>
                  <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Nama role..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>Deskripsi</label>
                  <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder="Deskripsi role..." value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} onFocus={e => e.target.style.borderColor = C} onBlur={e => e.target.style.borderColor = '#EDE8F5'} />
                </div>
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #EDE8F5' }}>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid #EDE8F5', color: '#6B7280' }}>Batal</button>
                  <button onClick={() => { if (form.name) { setRoles(rs => [...rs, { id: rs.length + 1, name: form.name, desc: form.desc, users: 0, color: C, perms: {} }]); setShowForm(false); setForm({ name: '', desc: '' }); } }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: C }}>
                    <Shield className="h-4 w-4" /> Buat Role
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

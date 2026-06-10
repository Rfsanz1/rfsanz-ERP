'use client';

import { useEffect } from 'react';
import { Card } from '../ui/Card';
import { useRoleStore } from '../../lib/store/useRoleStore';

export function RolePermissionPanel() {
  const { roles, permissions, loading, error, loadRoles, loadPermissions } = useRoleStore();

  useEffect(() => {
    void loadRoles();
    void loadPermissions();
  }, [loadRoles, loadPermissions]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex flex-col gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Manajemen Role</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Role & Permission</h2>
          </div>
          <p className="text-sm text-slate-400">Lihat daftar role dan assignment permission untuk modul ERP modern.</p>
        </div>
        {loading ? (
          <p className="text-slate-400">Memuat data role...</p>
        ) : error ? (
          <p className="text-rose-400">{error}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Role</h3>
                {roles.map((role) => (
                  <div key={role.id} className="mt-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-base font-semibold text-white">{role.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{role.description || 'Tanpa deskripsi'}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">Permissions</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <span key={permission.id} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                          {permission.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Permissions</h3>
                <div className="mt-4 space-y-3">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-sm font-semibold text-white">{permission.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{permission.description || 'Tanpa deskripsi'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

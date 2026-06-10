'use client';

import { create } from 'zustand';
import { api } from '../api';

interface PermissionItem {
  id: string;
  name: string;
  description?: string;
}

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionItem[];
}

interface RoleState {
  roles: RoleItem[];
  permissions: PermissionItem[];
  loading: boolean;
  error: string | null;
  loadRoles: () => Promise<void>;
  loadPermissions: () => Promise<void>;
}

export const useRoleStore = create<RoleState>((set) => ({
  roles: [],
  permissions: [],
  loading: false,
  error: null,
  loadRoles: async () => {
    set({ loading: true, error: null });

    try {
      const response = await api.get('/roles');
      set({ roles: response.data, loading: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Tidak dapat memuat data role', loading: false });
    }
  },
  loadPermissions: async () => {
    set({ loading: true, error: null });

    try {
      const response = await api.get('/roles/permissions');
      set({ permissions: response.data, loading: false });
    } catch (err) {
      console.error(err);
      set({ error: 'Tidak dapat memuat permissions', loading: false });
    }
  },
}));

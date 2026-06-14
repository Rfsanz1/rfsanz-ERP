'use client';

import { create } from 'zustand';
import { setAuthToken } from '../api';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  error: string | null;
  loading: boolean;
  isDemo: boolean;
  rehydrate: () => void;
  autoLogin: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

const TOKEN_KEY = 'gm_auth_token';

const ADMIN_EMAIL = 'admin@rfsanz.com';
const ADMIN_PASSWORD = 'root';

const STATIC_USER: AuthUser = {
  id: '1',
  email: ADMIN_EMAIL,
  name: 'Admin',
  roles: ['admin'],
  permissions: [],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  refreshToken: null,
  user: STATIC_USER,
  error: null,
  loading: false,
  isDemo: false,

  rehydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      set({ token });
    }
  },

  autoLogin: async () => {
    if (typeof window === 'undefined') return;

    const existing = localStorage.getItem(TOKEN_KEY);
    if (existing) {
      set({ token: existing, user: STATIC_USER });
      return;
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      });

      if (res.ok) {
        const data = await res.json();
        const token: string = data.token ?? data.access_token ?? data.accessToken ?? '';
        if (token) {
          setAuthToken(token);
          set({ token, user: STATIC_USER, loading: false });
          return;
        }
      }
    } catch {
      // Network error, fall through
    }

    set({ loading: false });
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const token: string = data.token ?? data.access_token ?? data.accessToken ?? '';
        if (token) {
          setAuthToken(token);
          const user: AuthUser = {
            id: data.user?.id ?? '1',
            email: data.user?.email ?? email,
            name: data.user?.name ?? data.user?.username ?? 'User',
            roles: data.user?.roles ?? ['admin'],
            permissions: data.user?.permissions ?? [],
          };
          set({ token, user, loading: false });
          return true;
        }
      }
    } catch {
      // fall through
    }
    set({ loading: false, error: 'Login gagal' });
    return false;
  },

  logout: () => {
    setAuthToken(null);
    set({ token: null, user: null });
  },

  loadProfile: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const user: AuthUser = {
          id: data.id ?? data.userId ?? '1',
          email: data.email ?? '',
          name: data.name ?? data.username ?? 'User',
          roles: data.roles ?? ['admin'],
          permissions: data.permissions ?? [],
        };
        set({ user });
      }
    } catch {
      // Ignore
    }
  },
}));

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
  initialized: boolean;
  authReady: boolean;
  rehydrate: () => void;
  autoLogin: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

const TOKEN_KEY = 'gm_auth_token';

/** Decode JWT payload dan cek apakah masih valid (belum expired + 60 detik buffer) */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true; // no expiry → valid
    return payload.exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@rfsanz.com';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'root';

const STATIC_USER: AuthUser = {
  id: '1',
  email: ADMIN_EMAIL,
  name: 'Admin',
  roles: ['admin'],
  permissions: [],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: STATIC_USER,
  error: null,
  loading: false,
  isDemo: false,
  initialized: false,
  authReady: false,

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
      /* Periksa apakah token belum expired sebelum dipakai */
      const valid = isTokenValid(existing);
      if (valid) {
        set({ token: existing, user: STATIC_USER, initialized: true, authReady: true });
        return;
      }
      /* Token expired — hapus dan login ulang */
      localStorage.removeItem(TOKEN_KEY);
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
        const token: string =
          data.token ??
          data.access_token ??
          data.accessToken ??
          data.data?.token ??
          data.data?.access_token ??
          data.data?.accessToken ??
          '';
        if (token) {
          setAuthToken(token);
          localStorage.setItem(TOKEN_KEY, token);
          set({ token, user: STATIC_USER, loading: false, initialized: true, authReady: true });
          return;
        }
      }
    } catch {
      // Network error, fall through
    }

    set({ loading: false, initialized: true, authReady: true });
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

'use client';

import { create } from 'zustand';
import { api, setAuthToken } from '../api';

const AUTO_EMAIL    = 'admin@example.com';
const AUTO_PASSWORD = 'admin123';

interface AuthUser {
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

function setCookie(name: string, value: string, maxAge = 86400 * 7) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;path=/;max-age=0`;
}

function setAuthCookies(token: string, roles: string[]) {
  setCookie('erp_token', token);
  setCookie('erp_roles', encodeURIComponent(JSON.stringify(roles)));
}

function clearAuthCookies() {
  clearCookie('erp_token');
  clearCookie('erp_roles');
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  error: null,
  loading: false,
  isDemo: false,

  rehydrate: () => {
    if (typeof window === 'undefined') return;
    const storedToken        = window.localStorage.getItem('erp_token');
    const storedRefreshToken = window.localStorage.getItem('erp_refresh_token');

    if (storedToken) {
      setAuthToken(storedToken);
      setAuthCookies(storedToken, []);
    }

    set({
      token:        storedToken,
      refreshToken: storedRefreshToken,
      user:         null,
      isDemo:       false,
    });
  },

  autoLogin: async () => {
    const { token } = get();
    if (token) return;
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { email: AUTO_EMAIL, password: AUTO_PASSWORD });
      const { accessToken, refreshToken, user } = res.data;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('erp_token', accessToken);
        window.localStorage.setItem('erp_refresh_token', refreshToken ?? '');
      }
      setAuthToken(accessToken);
      setAuthCookies(accessToken, user?.roles ?? []);
      set({ token: accessToken, refreshToken: refreshToken ?? null, user, loading: false, isDemo: false });
    } catch {
      set({ loading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('erp_token', accessToken);
        window.localStorage.setItem('erp_refresh_token', refreshToken ?? '');
      }
      setAuthToken(accessToken);
      setAuthCookies(accessToken, user?.roles ?? []);
      set({ token: accessToken, refreshToken, user, loading: false, isDemo: false });
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Login gagal.';
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('erp_token');
      window.localStorage.removeItem('erp_refresh_token');
    }
    setAuthToken(null);
    clearAuthCookies();
    set({ token: null, refreshToken: null, user: null, error: null, isDemo: false });
  },

  loadProfile: async () => {
    const currentToken = typeof window !== 'undefined'
      ? window.localStorage.getItem('erp_token')
      : null;
    if (!currentToken) return;
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data });
      setAuthCookies(currentToken, response.data?.roles ?? []);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        await get().autoLogin();
      }
    }
  },
}));

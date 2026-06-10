'use client';

import { create } from 'zustand';
import { api, setAuthToken } from '../api';

const DEMO_TOKEN = 'demo_token_gentong_mas';
const DEMO_USER = {
  id: 'demo',
  email: 'admin@example.com',
  name: 'Admin Demo',
  roles: ['Administrator'],
  permissions: [],
};

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
  login: (email: string, password: string) => Promise<boolean>;
  loginDemo: () => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  error: null,
  loading: false,
  isDemo: false,

  rehydrate: () => {
    if (typeof window === 'undefined') return;
    const storedToken = window.localStorage.getItem('erp_token');
    const storedRefreshToken = window.localStorage.getItem('erp_refresh_token');
    const storedDemo = window.localStorage.getItem('erp_demo') === '1';

    if (storedToken) {
      setAuthToken(storedToken);
      const roles = storedDemo ? DEMO_USER.roles : [];
      setAuthCookies(storedToken, roles);
    } else {
      clearAuthCookies();
    }

    set({
      token: storedToken,
      refreshToken: storedRefreshToken,
      user: storedDemo ? DEMO_USER : null,
      isDemo: storedDemo,
    });
  },

  loginDemo: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('erp_token', DEMO_TOKEN);
      window.localStorage.setItem('erp_demo', '1');
      window.localStorage.removeItem('erp_refresh_token');
    }
    setAuthToken(DEMO_TOKEN);
    setAuthCookies(DEMO_TOKEN, DEMO_USER.roles);
    set({ token: DEMO_TOKEN, user: DEMO_USER, isDemo: true, error: null });
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('erp_token', accessToken);
        window.localStorage.setItem('erp_refresh_token', refreshToken);
        window.localStorage.removeItem('erp_demo');
      }
      setAuthToken(accessToken);
      setAuthCookies(accessToken, user?.roles ?? []);
      set({ token: accessToken, refreshToken, user, loading: false, isDemo: false });
      return true;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err?.response?.status === 503
          ? 'Server backend tidak aktif. Coba Demo Mode untuk melihat tampilan dashboard.'
          : 'Login gagal. Periksa email dan password.');
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('erp_token');
      window.localStorage.removeItem('erp_refresh_token');
      window.localStorage.removeItem('erp_demo');
    }
    setAuthToken(null);
    clearAuthCookies();
    set({ token: null, refreshToken: null, user: null, error: null, isDemo: false });
  },

  loadProfile: async () => {
    const isDemo = typeof window !== 'undefined' && window.localStorage.getItem('erp_demo') === '1';
    if (isDemo) {
      set({ user: DEMO_USER, isDemo: true });
      return;
    }
    const currentToken = typeof window !== 'undefined' ? window.localStorage.getItem('erp_token') : null;
    if (!currentToken) return;
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      set({ user: userData });
      setAuthCookies(currentToken, userData?.roles ?? []);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('erp_token');
          window.localStorage.removeItem('erp_refresh_token');
        }
        setAuthToken(null);
        clearAuthCookies();
        set({ token: null, refreshToken: null, user: null });
      }
    }
  },
}));

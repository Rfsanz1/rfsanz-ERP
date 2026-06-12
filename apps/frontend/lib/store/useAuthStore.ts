'use client';

import { create } from 'zustand';

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

const STATIC_USER: AuthUser = {
  id: '1',
  email: 'admin@gentongmas.com',
  name: 'Admin',
  roles: ['admin'],
  permissions: [],
};

export const useAuthStore = create<AuthState>(() => ({
  token: 'no-auth',
  refreshToken: null,
  user: STATIC_USER,
  error: null,
  loading: false,
  isDemo: false,

  rehydrate: () => {},
  autoLogin: async () => {},
  login: async () => true,
  logout: () => {},
  loadProfile: async () => {},
}));

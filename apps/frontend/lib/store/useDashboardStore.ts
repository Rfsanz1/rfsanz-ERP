'use client';

import { create } from 'zustand';
import { api } from '../api';

interface DashboardState {
  summary: { users: number; roles: number; notifications: number; permissions: number } | null;
  isLoading: boolean;
  error: string | null;
  fetchSummary: () => Promise<void>;
  loadSummary: () => Promise<void>;
}

const doFetch = async (set: any) => {
  set({ isLoading: true, error: null });
  try {
    const response = await api.get('/dashboard/summary');
    set({ summary: response.data, isLoading: false });
  } catch (err) {
    console.error(err);
    set({ error: 'Gagal memuat ringkasan dashboard', isLoading: false });
  }
};

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  isLoading: false,
  error: null,
  fetchSummary: () => doFetch(set),
  loadSummary: () => doFetch(set),
}));

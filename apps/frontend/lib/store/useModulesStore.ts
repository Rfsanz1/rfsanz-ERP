'use client';

import { create } from 'zustand';
import { DEFAULT_INSTALLED_IDS } from '../modules-registry';

const STORAGE_KEY = 'erp_installed_modules_v2';

function loadInstalled(): string[] {
  if (typeof window === 'undefined') return DEFAULT_INSTALLED_IDS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_INSTALLED_IDS;
  } catch {
    return DEFAULT_INSTALLED_IDS;
  }
}

function persist(ids: string[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

interface ModulesState {
  installed: string[];
  install: (id: string, deps?: string[]) => void;
  uninstall: (id: string) => void;
  isInstalled: (id: string) => boolean;
  hydrate: () => void;
}

export const useModulesStore = create<ModulesState>((set, get) => ({
  installed: DEFAULT_INSTALLED_IDS,

  hydrate: () => {
    set({ installed: loadInstalled() });
  },

  install: (id: string, deps: string[] = []) => {
    const current = get().installed;
    const toAdd = [id, ...deps].filter(m => !current.includes(m));
    if (toAdd.length === 0) return;
    const next = [...current, ...toAdd];
    persist(next);
    set({ installed: next });
  },

  uninstall: (id: string) => {
    const next = get().installed.filter(m => m !== id);
    persist(next);
    set({ installed: next });
  },

  isInstalled: (id: string) => get().installed.includes(id),
}));

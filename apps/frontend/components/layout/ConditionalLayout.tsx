'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { MaterioLayout } from './MaterioLayout';

const PUBLIC_PATHS = ['/', '/install', '/login'];
const STANDALONE_PREFIXES = ['/sales', '/gudang', '/driver'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  // Rehydrate SINKRON sebelum render pertama — semua halaman anak langsung dapat token
  // tanpa harus menunggu useEffect. Ini fix untuk 100+ halaman yang cek token di useEffect.
  useState(() => {
    if (typeof window !== 'undefined') {
      useAuthStore.getState().rehydrate();
    }
  });

  const { token } = useAuthStore();

  const isPublic     = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/install');
  const isStandalone = STANDALONE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Fallback: redirect ke login jika benar-benar tidak ada token di store maupun localStorage
  useEffect(() => {
    if (!isPublic && !isStandalone && !token) {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('erp_token') : null;
      if (!stored) {
        router.push('/login');
      }
    }
  }, [token, isPublic, isStandalone, router]);

  // Public & standalone pages — render tanpa sidebar
  if (isPublic || isStandalone) {
    return <>{children}</>;
  }

  // Protected ERP pages — bungkus dengan sidebar layout
  return <MaterioLayout>{children}</MaterioLayout>;
}

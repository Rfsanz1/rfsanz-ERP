'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { MaterioLayout } from './MaterioLayout';

const PUBLIC_PATHS = ['/', '/login', '/install'];
const STANDALONE_PREFIXES = ['/sales', '/gudang', '/driver'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useAuthStore();

  const isPublic =
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/install');

  const isStandalone =
    STANDALONE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Rehydrate auth from localStorage on first mount
  useEffect(() => {
    useAuthStore.getState().rehydrate();
  }, []);

  // Redirect to login if protected route and no token (runs after rehydrate)
  useEffect(() => {
    if (!isPublic && !token) {
      const stored =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('erp_token')
          : null;
      if (!stored) {
        router.push('/login');
      }
    }
  }, [token, isPublic, router]);

  // Public pages & standalone apps — render without sidebar
  if (isPublic || isStandalone) {
    return <>{children}</>;
  }

  // Protected ERP pages — wrap with sidebar layout
  return <MaterioLayout>{children}</MaterioLayout>;
}

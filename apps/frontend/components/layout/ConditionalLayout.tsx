'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MaterioLayout } from './MaterioLayout';
import { OfflineBanner } from '../ui/OfflineBanner';
import { useAuthStore } from '../../lib/store/useAuthStore';

const STANDALONE_PREFIXES = ['/gudang', '/driver'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initialized } = useAuthStore();

  const isStandalone = STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #E2E8F0',
          borderTopColor: '#6366F1',
          borderRadius: '50%',
          animation: 'spin .7s linear infinite',
        }} />
        <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
          Memuat sistem...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isStandalone) {
    return (
      <>
        <OfflineBanner />
        {children}
      </>
    );
  }

  return (
    <>
      <OfflineBanner />
      <MaterioLayout>{children}</MaterioLayout>
    </>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { registerAutoLogin } from '../../lib/api';
import { MaterioLayout } from './MaterioLayout';

const STANDALONE_PREFIXES = ['/gudang', '/driver'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const [ready, setReady] = useState(false);

  const { rehydrate, autoLogin, loadProfile } = useAuthStore();

  // Sinkron rehydrate sebelum render pertama
  useState(() => {
    if (typeof window !== 'undefined') {
      useAuthStore.getState().rehydrate();
    }
  });

  useEffect(() => {
    // Daftarkan autoLogin ke interceptor 401
    registerAutoLogin(autoLogin);

    const init = async () => {
      if (!useAuthStore.getState().token) {
        await autoLogin();
      }
      // Muat profil user (nama, roles) untuk ditampilkan di header
      await loadProfile();
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F3FF',
      }}>
        <svg style={{ width: 32, height: 32, animation: 'spin .8s linear infinite', color: '#5B52D1' }}
          viewBox="0 0 24 24" fill="none">
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          <circle opacity=".2" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path opacity=".8" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
        </svg>
      </div>
    );
  }

  const isStandalone = STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isStandalone) return <>{children}</>;
  return <MaterioLayout>{children}</MaterioLayout>;
}

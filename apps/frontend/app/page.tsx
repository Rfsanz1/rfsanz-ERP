'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/useAuthStore';

function getRoleRedirect(roles: string[]): string {
  const role = (roles?.[0] ?? '').toLowerCase();
  if (role === 'sales') return '/sales';
  if (role === 'gudang' || role === 'warehouse') return '/gudang';
  if (role === 'driver') return '/driver';
  return '/dashboard';
}

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    useAuthStore.getState().rehydrate();
    const { token, user } = useAuthStore.getState();
    if (!token) {
      router.replace('/login');
    } else {
      router.replace(getRoleRedirect(user?.roles ?? []));
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' }}>
      <svg style={{ width: 32, height: 32, animation: 'spin .8s linear infinite', color: '#5B52D1' }} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <circle opacity=".2" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
        <path opacity=".8" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/>
      </svg>
    </div>
  );
}

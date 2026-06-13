'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../lib/store/useAuthStore';

export function AuthInitializer() {
  const autoLogin = useAuthStore((s) => s.autoLogin);

  useEffect(() => {
    autoLogin();
  }, []);

  return null;
}

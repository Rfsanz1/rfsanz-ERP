'use client';

import { useNativeInit } from '../../lib/hooks/useNativeInit';

/**
 * NativeInitializer — komponen client-only yang menginisialisasi
 * fitur native Capacitor (StatusBar, SplashScreen, BackButton, dll.)
 * Dipasang di root layout, tidak merender apapun ke DOM.
 */
export function NativeInitializer() {
  useNativeInit();
  return null;
}

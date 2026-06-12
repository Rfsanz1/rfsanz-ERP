'use client';

import { useEffect } from 'react';
import { isNativePlatform, loadServerUrl } from '../api-config';

/**
 * useNativeInit — inisialisasi plugin Capacitor saat app pertama kali mount.
 * Aman dipanggil di browser (semua import Capacitor di-guard isNative).
 */
export function useNativeInit() {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const init = async () => {
      try {
        await loadServerUrl();

        const [{ SplashScreen }, { StatusBar, Style }, { App }] = await Promise.all([
          import('@capacitor/splash-screen'),
          import('@capacitor/status-bar'),
          import('@capacitor/app'),
        ]);

        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#7367F0' });

        setTimeout(() => SplashScreen.hide({ fadeOutDuration: 300 }), 500);

        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) window.history.back();
        });
      } catch (e) {
        console.warn('[useNativeInit] error:', e);
      }
    };

    init();
  }, []);
}

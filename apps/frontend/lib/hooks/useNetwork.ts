'use client';

import { useEffect, useState } from 'react';

export interface NetworkState {
  connected: boolean;
  connectionType: string;
}

const DEFAULT: NetworkState = { connected: true, connectionType: 'unknown' };

/**
 * useNetwork — deteksi koneksi internet.
 * Pada native Capacitor: pakai @capacitor/network.
 * Pada browser: pakai navigator.onLine + event listener.
 */
export function useNetwork(): NetworkState {
  const [state, setState] = useState<NetworkState>(DEFAULT);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const isNative = typeof window !== 'undefined' &&
        !!(window as any).Capacitor?.isNativePlatform?.();

      if (isNative) {
        try {
          const { Network } = await import('@capacitor/network');

          const status = await Network.getStatus();
          setState({ connected: status.connected, connectionType: status.connectionType });

          const handle = await Network.addListener('networkStatusChange', (s) => {
            setState({ connected: s.connected, connectionType: s.connectionType });
          });

          cleanup = () => handle.remove();
        } catch {
          setState({ connected: navigator.onLine, connectionType: 'unknown' });
        }
      } else {
        setState({ connected: navigator.onLine, connectionType: 'unknown' });

        const onOnline  = () => setState({ connected: true,  connectionType: 'unknown' });
        const onOffline = () => setState({ connected: false, connectionType: 'none' });

        window.addEventListener('online',  onOnline);
        window.addEventListener('offline', onOffline);

        cleanup = () => {
          window.removeEventListener('online',  onOnline);
          window.removeEventListener('offline', onOffline);
        };
      }
    };

    init();
    return () => cleanup?.();
  }, []);

  return state;
}

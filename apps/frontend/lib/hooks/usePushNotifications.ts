'use client';

import { useEffect, useState } from 'react';

export interface PushState {
  token: string | null;
  permissionGranted: boolean;
  error: string | null;
}

/**
 * usePushNotifications — registrasi push notification via @capacitor/push-notifications.
 * Hanya aktif di native; di browser web tidak melakukan apapun.
 */
export function usePushNotifications(): PushState {
  const [state, setState] = useState<PushState>({
    token: null,
    permissionGranted: false,
    error: null,
  });

  useEffect(() => {
    const isNative = typeof window !== 'undefined' &&
      !!(window as any).Capacitor?.isNativePlatform?.();

    if (!isNative) return;

    const init = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') {
          setState(s => ({ ...s, permissionGranted: false }));
          return;
        }

        setState(s => ({ ...s, permissionGranted: true }));
        await PushNotifications.register();

        const regHandle = await PushNotifications.addListener('registration', (token) => {
          setState(s => ({ ...s, token: token.value }));
        });

        const errHandle = await PushNotifications.addListener('registrationError', (err) => {
          setState(s => ({ ...s, error: err.error }));
        });

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Notifikasi diterima:', notification);
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Push] Notifikasi diklik:', action);
          const data = action.notification.data;
          if (data?.route) window.location.href = data.route;
        });

        return () => {
          regHandle.remove();
          errHandle.remove();
        };
      } catch (e: any) {
        setState(s => ({ ...s, error: e?.message ?? 'Push notification error' }));
      }
    };

    init();
  }, []);

  return state;
}

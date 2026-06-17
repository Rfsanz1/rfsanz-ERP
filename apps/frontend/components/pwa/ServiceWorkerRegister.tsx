'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered');

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      } catch (err) {
        console.warn('SW registration failed:', err);
      }
    };

    register();

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  return null;
}

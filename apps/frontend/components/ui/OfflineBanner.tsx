'use client';

import { WifiOff } from 'lucide-react';
import { useNetwork } from '../../lib/hooks/useNetwork';

export function OfflineBanner() {
  const { connected } = useNetwork();

  if (connected) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 16px',
        background: '#EF4444',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 2px 12px rgba(239,68,68,0.4)',
      }}
    >
      <WifiOff size={15} />
      Tidak ada koneksi internet — menampilkan data terakhir yang tersimpan
    </div>
  );
}

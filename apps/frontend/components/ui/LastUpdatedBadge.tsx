'use client';

import { Clock } from 'lucide-react';
import { useNetwork } from '../../lib/hooks/useNetwork';

interface Props {
  label: string | null;
}

/**
 * LastUpdatedBadge — tampilkan badge "data terakhir diperbarui X menit lalu"
 * Hanya muncul saat offline atau data sudah lama (> 10 menit).
 */
export function LastUpdatedBadge({ label }: Props) {
  const { connected } = useNetwork();

  if (!label || connected) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 100,
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.25)',
        fontSize: 11,
        fontWeight: 600,
        color: '#B45309',
      }}
    >
      <Clock size={11} />
      {label}
    </div>
  );
}

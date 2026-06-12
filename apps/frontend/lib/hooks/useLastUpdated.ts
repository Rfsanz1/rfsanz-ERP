'use client';

import { useState, useCallback } from 'react';

/**
 * useLastUpdated — simpan dan tampilkan timestamp "terakhir diperbarui"
 * untuk mendukung indikator data stale saat offline.
 */
export function useLastUpdated() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const markUpdated = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  const getLabel = useCallback((): string | null => {
    if (!lastUpdated) return null;
    const diffMs   = Date.now() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1)  return 'Baru saja diperbarui';
    if (diffMins < 60) return `Terakhir diperbarui ${diffMins} menit lalu`;

    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24)  return `Terakhir diperbarui ${diffHrs} jam lalu`;

    return `Terakhir diperbarui ${lastUpdated.toLocaleDateString('id-ID')}`;
  }, [lastUpdated]);

  return { lastUpdated, markUpdated, getLabel };
}

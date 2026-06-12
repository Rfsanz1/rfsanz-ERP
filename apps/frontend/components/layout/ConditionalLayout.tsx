'use client';

import { usePathname } from 'next/navigation';
import { MaterioLayout } from './MaterioLayout';
import { OfflineBanner } from '../ui/OfflineBanner';

const STANDALONE_PREFIXES = ['/gudang', '/driver'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isStandalone = STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isStandalone) {
    return (
      <>
        <OfflineBanner />
        {children}
      </>
    );
  }

  return (
    <>
      <OfflineBanner />
      <MaterioLayout>{children}</MaterioLayout>
    </>
  );
}

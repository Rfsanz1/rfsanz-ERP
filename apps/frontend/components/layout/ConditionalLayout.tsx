'use client';

import { usePathname } from 'next/navigation';
import { MaterioLayout } from './MaterioLayout';

const STANDALONE_PREFIXES = ['/gudang', '/driver'];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isStandalone = STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (isStandalone) return <>{children}</>;

  return <MaterioLayout>{children}</MaterioLayout>;
}

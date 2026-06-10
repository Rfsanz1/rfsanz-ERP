'use client';

import { useEffect, useState } from 'react';
import DashboardContent from './_DashboardContent';
import { PageLoader } from '@gm/ui';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <PageLoader />;

  return <DashboardContent />;
}

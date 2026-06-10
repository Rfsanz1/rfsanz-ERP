'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FleetIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/fleet/vehicles'); }, []);
  return null;
}

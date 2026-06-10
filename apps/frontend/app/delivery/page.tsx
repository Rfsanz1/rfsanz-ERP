'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeliveryIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/delivery/areas'); }, []);
  return null;
}

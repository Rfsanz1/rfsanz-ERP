'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchasingIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/purchasing/rfq'); }, []);
  return null;
}

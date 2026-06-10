'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MarketplaceIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/marketplace/price-sync'); }, []);
  return null;
}

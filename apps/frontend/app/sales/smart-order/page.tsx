'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Smart Order Input sudah digabung menjadi satu pintu dengan "Buat Order Baru".
 * Halaman ini hanya redirect agar link/bookmark lama tetap berfungsi.
 */
export default function SmartOrderRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sales/orders/new');
  }, [router]);

  return null;
}

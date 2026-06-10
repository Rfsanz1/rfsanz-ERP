'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoiceIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/invoice/list'); }, []);
  return null;
}

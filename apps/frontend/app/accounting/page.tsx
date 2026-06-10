'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountingIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/finance/journal-entries'); }, []);
  return null;
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayrollIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/hr/payrolls'); }, []);
  return null;
}

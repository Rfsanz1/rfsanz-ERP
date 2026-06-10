'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/service/work-orders'); }, []);
  return null;
}

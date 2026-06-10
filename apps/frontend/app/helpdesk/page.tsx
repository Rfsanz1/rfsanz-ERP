'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HelpdeskIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/service/work-orders'); }, []);
  return null;
}

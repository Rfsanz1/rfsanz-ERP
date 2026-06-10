'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CRMIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/crm/leads'); }, []);
  return null;
}

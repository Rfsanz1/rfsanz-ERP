'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecruitmentIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/recruitment/positions'); }, []);
  return null;
}

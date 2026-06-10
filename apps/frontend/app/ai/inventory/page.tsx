'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';

export default function AiInventoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/ai/inventory-prediction');
  }, []);
  return null;
}

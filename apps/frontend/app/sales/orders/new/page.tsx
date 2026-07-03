'use client';

import { useRouter } from 'next/navigation';
import CreateOrderModal from '../../../../components/orders/CreateOrderModal';

export default function NewOrderPage() {
  const router = useRouter();

  return (
    <CreateOrderModal
      mode="page"
      onClose={() => router.back()}
      onSuccess={() => router.push('/sales/orders')}
    />
  );
}

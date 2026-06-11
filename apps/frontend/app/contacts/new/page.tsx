'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import ContactForm from '../../../components/contacts/ContactForm';
import { ArrowLeft } from 'lucide-react';

export default function NewContactPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  if (!token) return null;

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-lg transition hover:bg-purple-50"
            style={{ border: '1px solid #EDE8F5', color: '#7367F0' }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Tambah Kontak Baru</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Isi data kontak pelanggan, pemasok, atau keduanya</p>
          </div>
        </div>
        <ContactForm mode="create" />
      </div>
    </AppShell>
  );
}

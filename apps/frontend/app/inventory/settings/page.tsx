'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { INVENTORY_CONFIG, INVENTORY_NAV } from '../../../lib/nav-configs';
import { Save } from 'lucide-react';

export default function InventorySettingsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...INVENTORY_CONFIG} navItems={INVENTORY_NAV} activeHref="/inventory/settings">
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pengaturan Inventaris</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Konfigurasi manajemen stok</p></div>
        <div className="bg-white rounded-2xl p-6 space-y-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          {[{ label: 'Metode Penilaian Stok', placeholder: 'FIFO / Average' }, { label: 'Minimum Stok Default', placeholder: '10' }, { label: 'Gudang Utama', placeholder: 'Pilih gudang...' }, { label: 'Notifikasi Stok Menipis', placeholder: 'Email / WhatsApp' }].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
              <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} />
            </div>
          ))}
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: INVENTORY_CONFIG.appColor }}><Save className="h-4 w-4" /> Simpan</button>
        </div>
      </div>
    </AppShell>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { POS_CONFIG, POS_NAV } from '../../../lib/nav-configs';
import { Save } from 'lucide-react';

export default function PosSettingsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push('/login'); }, [token]);
  if (!token) return null;
  return (
    <AppShell {...POS_CONFIG} navItems={POS_NAV} activeHref="/pos/settings">
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pengaturan POS</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Konfigurasi kasir dan pembayaran</p></div>
        <div className="bg-white rounded-2xl p-6 space-y-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          {[
            { label: 'Nama Toko di Struk', placeholder: 'Gentong Mas' },
            { label: 'Jumlah Kasir', placeholder: '5' },
            { label: 'PPN (%)', placeholder: '11' },
            { label: 'Metode Pembayaran', placeholder: 'Tunai, Transfer, QRIS' },
            { label: 'Printer Struk', placeholder: 'Thermal 80mm' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
              <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} />
            </div>
          ))}
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: POS_CONFIG.appColor }}><Save className="h-4 w-4" /> Simpan</button>
        </div>
      </div>
    </AppShell>
  );
}

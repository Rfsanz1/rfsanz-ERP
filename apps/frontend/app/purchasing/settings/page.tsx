'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import AppShell from '../../../components/layout/AppShell';
import { PURCHASING_CONFIG, PURCHASING_NAV } from '../../../lib/nav-configs';
import { Save } from 'lucide-react';

export default function PurchasingSettingsPage() {
  const { token } = useAuthStore();
  const router = useRouter();

  return (
    <AppShell {...PURCHASING_CONFIG} navItems={PURCHASING_NAV} activeHref="/purchasing/settings">
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div><h1 className="text-xl font-bold" style={{ color: '#1E1B4B' }}>Pengaturan Pembelian</h1><p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>Konfigurasi modul pengadaan</p></div>
        <div className="bg-white rounded-2xl p-6 space-y-5" style={{ border: '1.5px solid #EDE8F5', boxShadow: '0 1px 4px rgba(47,43,61,.06)' }}>
          {[{ label: 'Prefix Nomor PO', placeholder: 'PO-' }, { label: 'Term Pembayaran Default', placeholder: 'Net 30' }, { label: 'Approval PO di Atas (Rp)', placeholder: '10.000.000' }, { label: 'Email Notifikasi PO', placeholder: 'purchasing@perusahaan.com' }].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1E1B4B' }}>{f.label}</label>
              <input className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1.5px solid #EDE8F5', color: '#1E1B4B', outline: 'none' }} placeholder={f.placeholder} />
            </div>
          ))}
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: PURCHASING_CONFIG.appColor }}><Save className="h-4 w-4" /> Simpan</button>
        </div>
      </div>
    </AppShell>
  );
}

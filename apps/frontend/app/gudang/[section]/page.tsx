'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { WAREHOUSE_CONFIG, WAREHOUSE_NAV } from '../../../lib/nav-configs';
import { useAuthStore } from '../../../lib/store/useAuthStore';

export default function GudangSectionPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const rawSection = Array.isArray(params?.section) ? params.section[0] : params?.section;
  const section = rawSection ?? 'dashboard';



  return (
    <AppShell {...WAREHOUSE_CONFIG} navItems={WAREHOUSE_NAV} activeHref={`/gudang/${section}`}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="rounded-[32px] border border-[#E8E6EF] bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[#8A86A2]">Gudang</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#312E3B]">{section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6B6880]">
            Halaman ini disiapkan sebagai tempat khusus untuk fitur gudang, seperti picking order, barang masuk, barang keluar, transfer, dan stock opname.
          </p>
          <div className="mt-6 rounded-3xl border border-dashed border-[#E9E7EF] bg-[#FBFBFF] p-6">
            <p className="text-sm text-[#5B5B6D]">Konten untuk <strong>{section}</strong> akan diimplementasikan dengan workflow gudang yang terhubung ke backend tunggal dan user role-based.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

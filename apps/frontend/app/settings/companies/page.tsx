'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store/useAuthStore';
import { OdooLayout } from '../../../components/layout/OdooLayout';
import { Building2, Plus, Edit2, Trash2, CheckCircle, Globe, Phone, Mail, Hash } from 'lucide-react';

const COMPANIES = [
  { id: 1, name: 'PT Gentong Mas Utama', code: 'GMU', address: 'Jl. Raya Jakarta No. 1, Jakarta Pusat', phone: '021-5551234', email: 'info@gentongmas.id', currency: 'IDR', isMain: true, status: 'active' },
  { id: 2, name: 'CV Gentong Mas Surabaya', code: 'GMS', address: 'Jl. Darmo No. 45, Surabaya', phone: '031-8881234', email: 'sby@gentongmas.id', currency: 'IDR', isMain: false, status: 'active' },
  { id: 3, name: 'PT Gentong Mas Bandung', code: 'GMB', address: 'Jl. Dago No. 12, Bandung', phone: '022-7771234', email: 'bdg@gentongmas.id', currency: 'IDR', isMain: false, status: 'inactive' },
];

export default function CompaniesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="Multi Perusahaan" subtitle="Kelola beberapa entitas perusahaan dalam satu sistem">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#1E1B4B' }}>Manajemen Perusahaan</h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Kelola multi perusahaan dan cabang dalam satu platform ERP</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
            <Plus className="h-4 w-4" /> Tambah Perusahaan
          </button>
        </div>

        {/* Feature Info */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(91,82,209,.06)', border: '1.5px solid rgba(91,82,209,.15)' }}>
          <Building2 className="h-5 w-5 flex-shrink-0" style={{ color: '#5B52D1' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>Mode Multi-Company Aktif</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Data setiap perusahaan terisolasi. Anda dapat berpindah perusahaan dari topbar. Laporan konsolidasi tersedia di modul Laporan Keuangan.</p>
          </div>
        </div>

        {/* Companies List */}
        <div className="space-y-4">
          {COMPANIES.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl p-5"
              style={{ backgroundColor: '#FFFFFF', border: `1.5px solid ${c.isMain ? '#5B52D1' : '#EDE9FE'}` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white text-lg" style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold" style={{ color: '#1E1B4B' }}>{c.name}</p>
                      {c.isMain && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
                          <CheckCircle className="h-3 w-3" /> Utama
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                        backgroundColor: c.status === 'active' ? 'rgba(34,197,94,.1)' : 'rgba(107,114,128,.1)',
                        color: c.status === 'active' ? '#22C55E' : '#6B7280',
                      }}>
                        {c.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 font-mono" style={{ color: '#9CA3AF' }}>Kode: {c.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(59,130,246,.1)', color: '#1D4ED8' }}>
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  {!c.isMain && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(239,68,68,.1)', color: '#DC2626' }}>
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <div>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Alamat</p>
                    <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{c.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <div>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Telepon</p>
                    <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{c.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <div>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Email</p>
                    <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{c.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <div>
                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Mata Uang</p>
                    <p className="text-xs font-medium" style={{ color: '#1E1B4B' }}>{c.currency}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OdooLayout>
  );
}

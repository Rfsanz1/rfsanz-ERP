'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe, ShoppingBag, BookOpen, MessageSquare, GraduationCap, Calendar,
  Users, ShoppingCart, Monitor, UtensilsCrossed, RefreshCw, Car,
  FileText, BookMarked, Receipt, PenLine, TrendingUp, Leaf,
  FolderKanban, Clock, Wrench, Headphones, CalendarCheck, LayoutGrid,
  File, CheckSquare, Brain, Package, Factory, Truck, Settings2, ShieldCheck, Hammer,
  Mail, MessageCircle, BarChart, Share2,
  UserCheck, CalendarX, UserPlus, Star, Bus, DollarSign,
  Palette, Search, Check, ChevronRight, Zap, X
} from 'lucide-react';

interface App {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  popular?: boolean;
}

interface Category {
  id: string;
  label: string;
  apps: App[];
}

const CATEGORIES: Category[] = [
  {
    id: 'website',
    label: 'Website',
    apps: [
      { id: 'website', name: 'Website', desc: 'Buat & kelola website perusahaan', icon: Globe, color: '#00CFE8', gradient: 'from-cyan-400 to-cyan-600', popular: true },
      { id: 'ecommerce', name: 'eCommerce', desc: 'Toko online terintegrasi', icon: ShoppingBag, color: '#FF9F43', gradient: 'from-orange-400 to-orange-600', popular: true },
      { id: 'blog', name: 'Blog', desc: 'Platform konten & artikel', icon: BookOpen, color: '#28C76F', gradient: 'from-green-400 to-green-600' },
      { id: 'forum', name: 'Forum', desc: 'Komunitas & diskusi online', icon: MessageSquare, color: '#5B52D1', gradient: 'from-purple-400 to-purple-600' },
      { id: 'elearning', name: 'eLearning', desc: 'Platform kursus & edukasi', icon: GraduationCap, color: '#00CFE8', gradient: 'from-sky-400 to-blue-600' },
      { id: 'event', name: 'Event', desc: 'Manajemen acara & tiket', icon: Calendar, color: '#EA5455', gradient: 'from-rose-400 to-red-600' },
    ],
  },
  {
    id: 'sales',
    label: 'Penjualan',
    apps: [
      { id: 'crm', name: 'CRM', desc: 'Kelola prospek & pelanggan', icon: Users, color: '#5B52D1', gradient: 'from-violet-400 to-purple-600', popular: true },
      { id: 'sales', name: 'Penjualan', desc: 'Order penjualan & penawaran', icon: ShoppingCart, color: '#28C76F', gradient: 'from-emerald-400 to-green-600', popular: true },
      { id: 'pos', name: 'Kasir (POS)', desc: 'Point of sale & kasir', icon: Monitor, color: '#FF9F43', gradient: 'from-amber-400 to-orange-600', popular: true },
      { id: 'restaurant', name: 'Restoran', desc: 'Manajemen meja & pesanan', icon: UtensilsCrossed, color: '#EA5455', gradient: 'from-red-400 to-rose-600' },
      { id: 'subscription', name: 'Langganan', desc: 'Billing & recurring payment', icon: RefreshCw, color: '#00CFE8', gradient: 'from-cyan-400 to-teal-600' },
      { id: 'rental', name: 'Rental', desc: 'Sewa aset & manajemen kontrak', icon: Car, color: '#FF9F43', gradient: 'from-yellow-400 to-amber-600' },
    ],
  },
  {
    id: 'finance',
    label: 'Keuangan',
    apps: [
      { id: 'invoice', name: 'Invoice', desc: 'Tagihan & faktur otomatis', icon: FileText, color: '#5B52D1', gradient: 'from-purple-400 to-violet-600', popular: true },
      { id: 'accounting', name: 'Akuntansi', desc: 'Jurnal, COA & laporan keuangan', icon: BookMarked, color: '#28C76F', gradient: 'from-green-500 to-emerald-700', popular: true },
      { id: 'expense', name: 'Pengeluaran', desc: 'Reimbursement & expense report', icon: Receipt, color: '#FF9F43', gradient: 'from-orange-400 to-amber-600' },
      { id: 'sign', name: 'Tanda Tangan', desc: 'Tanda tangan digital dokumen', icon: PenLine, color: '#00CFE8', gradient: 'from-sky-400 to-cyan-600' },
      { id: 'equity', name: 'Ekuitas', desc: 'Manajemen saham & ekuitas', icon: TrendingUp, color: '#EA5455', gradient: 'from-rose-400 to-pink-600' },
      { id: 'esg', name: 'ESG', desc: 'Environmental social governance', icon: Leaf, color: '#28C76F', gradient: 'from-lime-400 to-green-600' },
    ],
  },
  {
    id: 'service',
    label: 'Layanan',
    apps: [
      { id: 'project', name: 'Project', desc: 'Manajemen proyek & tugas', icon: FolderKanban, color: '#5B52D1', gradient: 'from-purple-400 to-indigo-600', popular: true },
      { id: 'timesheet', name: 'Timesheet', desc: 'Pencatatan jam kerja', icon: Clock, color: '#FF9F43', gradient: 'from-amber-400 to-orange-600' },
      { id: 'field-service', name: 'Field Service', desc: 'Teknisi lapangan & jadwal', icon: Wrench, color: '#00CFE8', gradient: 'from-teal-400 to-cyan-600' },
      { id: 'helpdesk', name: 'Helpdesk', desc: 'Tiket dukungan pelanggan', icon: Headphones, color: '#EA5455', gradient: 'from-red-400 to-rose-600' },
      { id: 'appointment', name: 'Appointment', desc: 'Booking & jadwal pertemuan', icon: CalendarCheck, color: '#28C76F', gradient: 'from-emerald-400 to-teal-600' },
      { id: 'planning', name: 'Planning', desc: 'Perencanaan shift & sumber daya', icon: LayoutGrid, color: '#5B52D1', gradient: 'from-violet-400 to-purple-600' },
    ],
  },
  {
    id: 'productivity',
    label: 'Produktivitas',
    apps: [
      { id: 'document', name: 'Dokumen', desc: 'Manajemen & berbagi dokumen', icon: File, color: '#FF9F43', gradient: 'from-amber-400 to-yellow-600' },
      { id: 'approval', name: 'Persetujuan', desc: 'Alur persetujuan & approval', icon: CheckSquare, color: '#28C76F', gradient: 'from-green-400 to-emerald-600' },
      { id: 'knowledge', name: 'Knowledge Base', desc: 'Wiki & basis pengetahuan', icon: Brain, color: '#00CFE8', gradient: 'from-sky-400 to-blue-600' },
    ],
  },
  {
    id: 'supply-chain',
    label: 'Rantai Pasok',
    apps: [
      { id: 'inventory', name: 'Inventaris', desc: 'Stok, gudang & produk', icon: Package, color: '#EA5455', gradient: 'from-red-400 to-orange-600', popular: true },
      { id: 'manufacturing', name: 'Manufaktur', desc: 'Produksi & bill of material', icon: Factory, color: '#5B52D1', gradient: 'from-slate-400 to-slate-700' },
      { id: 'purchase', name: 'Pembelian', desc: 'Purchase order & supplier', icon: Truck, color: '#FF9F43', gradient: 'from-orange-400 to-amber-600', popular: true },
      { id: 'maintenance', name: 'Maintenance', desc: 'Perawatan mesin & aset', icon: Settings2, color: '#00CFE8', gradient: 'from-cyan-400 to-sky-600' },
      { id: 'quality', name: 'Quality Control', desc: 'Kontrol kualitas & inspeksi', icon: ShieldCheck, color: '#28C76F', gradient: 'from-emerald-400 to-green-600' },
      { id: 'repair', name: 'Perbaikan', desc: 'Manajemen perbaikan & servis', icon: Hammer, color: '#EA5455', gradient: 'from-rose-400 to-red-600' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    apps: [
      { id: 'email-marketing', name: 'Email Marketing', desc: 'Kampanye email massal', icon: Mail, color: '#5B52D1', gradient: 'from-purple-400 to-violet-600' },
      { id: 'sms-marketing', name: 'SMS Marketing', desc: 'Pesan promosi via SMS', icon: MessageCircle, color: '#FF9F43', gradient: 'from-amber-400 to-orange-600' },
      { id: 'survey', name: 'Survey', desc: 'Survei & formulir online', icon: BarChart, color: '#00CFE8', gradient: 'from-cyan-400 to-blue-600' },
      { id: 'social', name: 'Social Media', desc: 'Kelola semua akun sosmed', icon: Share2, color: '#28C76F', gradient: 'from-green-400 to-teal-600' },
    ],
  },
  {
    id: 'hr',
    label: 'Sumber Daya Manusia',
    apps: [
      { id: 'employee', name: 'Karyawan', desc: 'Data & profil karyawan', icon: UserCheck, color: '#5B52D1', gradient: 'from-purple-400 to-pink-600', popular: true },
      { id: 'attendance', name: 'Absensi', desc: 'Kehadiran & jam kerja', icon: CalendarCheck, color: '#00CFE8', gradient: 'from-sky-400 to-cyan-600' },
      { id: 'recruitment', name: 'Rekrutmen', desc: 'Lowongan & seleksi kandidat', icon: UserPlus, color: '#28C76F', gradient: 'from-green-400 to-emerald-600' },
      { id: 'leave', name: 'Cuti', desc: 'Pengajuan & approval cuti', icon: CalendarX, color: '#FF9F43', gradient: 'from-amber-400 to-yellow-600' },
      { id: 'appraisal', name: 'Penilaian', desc: 'Evaluasi & penilaian kinerja', icon: Star, color: '#EA5455', gradient: 'from-rose-400 to-red-600' },
      { id: 'fleet', name: 'Armada', desc: 'Manajemen kendaraan', icon: Bus, color: '#5B52D1', gradient: 'from-slate-500 to-slate-700' },
      { id: 'payroll', name: 'Payroll', desc: 'Penggajian & slip gaji', icon: DollarSign, color: '#28C76F', gradient: 'from-emerald-500 to-green-700', popular: true },
    ],
  },
  {
    id: 'custom',
    label: 'Kustomisasi',
    apps: [
      { id: 'studio', name: 'Studio', desc: 'Kustomisasi tampilan & form', icon: Palette, color: '#5B52D1', gradient: 'from-violet-500 to-purple-700' },
    ],
  },
];

const ALL_APPS = CATEGORIES.flatMap((c) => c.apps.map((a) => ({ ...a, category: c.label })));

export default function InstallPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (catId: string) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    const allSelected = cat.apps.every((a) => selected.has(a.id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) cat.apps.forEach((a) => next.delete(a.id));
      else cat.apps.forEach((a) => next.add(a.id));
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q && !activeCategory) return CATEGORIES;
    return CATEGORIES
      .filter((c) => !activeCategory || c.id === activeCategory)
      .map((c) => ({
        ...c,
        apps: c.apps.filter(
          (a) =>
            !q ||
            a.name.toLowerCase().includes(q) ||
            a.desc.toLowerCase().includes(q) ||
            c.label.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.apps.length > 0);
  }, [search, activeCategory]);

  const selectedApps = ALL_APPS.filter((a) => selected.has(a.id));

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F2F5' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 flex items-center justify-between h-14"
        style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EDE9FE' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}
          >
            G
          </div>
          <span className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Gentong Mas ERP</span>
          <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
            <Zap className="h-3 w-3" /> Pilih Aplikasi
          </span>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-sm flex items-center gap-1.5 transition-colors"
          style={{ color: '#9CA3AF' }}
        >
          Lewati
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      {/* Hero */}
      <div className="text-center px-6 py-10">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1E1B4B' }}>
          Pilih Aplikasi yang Ingin Diaktifkan
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: '#9CA3AF' }}>
          Pilih modul yang sesuai dengan kebutuhan bisnis Anda. Anda bisa mengubahnya kapan saja di Pengaturan.
        </p>
      </div>

      {/* Search + Filter bar */}
      <div
        className="sticky top-14 z-30 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{ backgroundColor: '#F0F2F5', borderBottom: '1px solid #EDE9FE' }}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
          <input
            className="w-full rounded-lg pl-9 pr-4 py-2 text-sm bg-white"
            style={{ border: '1px solid #EDE9FE', color: '#1E1B4B', outline: 'none' }}
            placeholder="Cari aplikasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = '#5B52D1'; }}
            onBlur={(e) => { e.target.style.borderColor = '#EDE9FE'; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#9CA3AF' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: !activeCategory ? '#5B52D1' : '#FFFFFF',
              color: !activeCategory ? '#FFFFFF' : '#6B7280',
              border: `1px solid ${!activeCategory ? '#5B52D1' : '#EDE9FE'}`,
            }}
          >
            Semua
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: activeCategory === cat.id ? '#5B52D1' : '#FFFFFF',
                color: activeCategory === cat.id ? '#FFFFFF' : '#6B7280',
                border: `1px solid ${activeCategory === cat.id ? '#5B52D1' : '#EDE9FE'}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 pb-32 space-y-10">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#9CA3AF' }}>
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-base">Aplikasi tidak ditemukan</p>
            <p className="text-sm mt-1">Coba kata kunci lain</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const allSelected = cat.apps.every((a) => selected.has(a.id));
            const someSelected = cat.apps.some((a) => selected.has(a.id));
            return (
              <section key={cat.id}>
                {/* Category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#1E1B4B' }}>
                      {cat.label}
                    </h2>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EDE9FE', color: '#5B52D1' }}>
                      {cat.apps.length}
                    </span>
                  </div>
                  <button
                    onClick={() => selectAll(cat.id)}
                    className="text-xs font-medium transition-colors flex items-center gap-1"
                    style={{ color: allSelected || someSelected ? '#5B52D1' : '#9CA3AF' }}
                  >
                    {allSelected ? (
                      <><X className="h-3 w-3" /> Batal semua</>
                    ) : (
                      <><Check className="h-3 w-3" /> Pilih semua</>
                    )}
                  </button>
                </div>

                {/* App grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {cat.apps.map((app) => {
                    const isSelected = selected.has(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => toggle(app.id)}
                        className="relative flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-all duration-200 bg-white group"
                        style={{
                          border: isSelected ? '2px solid #5B52D1' : '2px solid transparent',
                          backgroundColor: isSelected ? 'rgba(91,82,209,.04)' : '#FFFFFF',
                          boxShadow: isSelected
                            ? '0 4px 16px rgba(91,82,209,.18)'
                            : '0 2px 6px rgba(47,43,61,.08)',
                          transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                          outline: 'none',
                        }}
                      >
                        {/* Popular badge */}
                        {app.popular && !isSelected && (
                          <span
                            className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}
                          >
                            POPULER
                          </span>
                        )}

                        {/* Checkmark */}
                        {isSelected && (
                          <span
                            className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ backgroundColor: '#5B52D1' }}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}

                        {/* Icon */}
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient} transition-transform duration-200`}
                          style={{ transform: isSelected ? 'scale(1.08)' : 'scale(1)' }}
                        >
                          <app.icon className="h-6 w-6 text-white" />
                        </div>

                        {/* Label */}
                        <div>
                          <p
                            className="text-xs font-semibold leading-tight"
                            style={{ color: isSelected ? '#5B52D1' : '#1E1B4B' }}
                          >
                            {app.name}
                          </p>
                          <p className="text-[10px] mt-0.5 leading-tight" style={{ color: '#9CA3AF' }}>
                            {app.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Sticky summary bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          transform: selected.size > 0 ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div
          className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4"
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #EDE9FE',
            boxShadow: '0 -4px 20px rgba(47,43,61,.12)',
          }}
        >
          {/* Left: selected count + preview */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: '#5B52D1' }}
            >
              {selected.size}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#1E1B4B' }}>
                {selected.size} Aplikasi Dipilih
              </p>
              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                {selectedApps.slice(0, 4).map((a) => a.name).join(', ')}
                {selectedApps.length > 4 ? ` +${selectedApps.length - 4} lainnya` : ''}
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#6B7280', border: '1px solid #EDE9FE' }}
            >
              Hapus Semua
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#5B52D1' }}
            >
              Lanjutkan
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacer so bottom bar doesn't overlap when visible */}
      {selected.size > 0 && <div className="h-20" />}
    </div>
  );
}

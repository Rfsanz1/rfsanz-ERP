'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { OdooLayout } from '../../components/layout/OdooLayout';
import {
  Brain, MessageSquare, TrendingUp, Lightbulb, Zap, FileBarChart,
  BarChart2, Package, DollarSign, UserCheck, ShoppingBag, Bell,
  ScrollText, ArrowUpRight, Sparkles, Activity, CheckCircle,
  AlertCircle, Clock,
} from 'lucide-react';

const AI_MODULES = [
  { href: '/ai/chatbot', label: 'AI Chat Assistant', desc: 'Tanya bisnis Anda dalam bahasa natural', icon: MessageSquare, color: '#5B52D1', bg: 'rgba(91,82,209,.1)' },
  { href: '/ai/forecast', label: 'AI Forecast', desc: 'Prediksi penjualan & demand planning', icon: TrendingUp, color: '#3B82F6', bg: '#EFF6FF' },
  { href: '/ai/recommendation', label: 'AI Rekomendasi', desc: 'Rekomendasi produk & strategi cerdas', icon: Lightbulb, color: '#F59E0B', bg: '#FFFBEB' },
  { href: '/ai/automation', label: 'AI Automation', desc: 'Otomasi workflow berbasis kondisi', icon: Zap, color: '#22C55E', bg: '#F0FDF4' },
  { href: '/ai/report-generator', label: 'AI Report Generator', desc: 'Buat laporan otomatis dengan AI', icon: FileBarChart, color: '#8B5CF6', bg: '#F5F3FF' },
  { href: '/ai/sales-prediction', label: 'AI Sales Prediction', desc: 'Prediksi penjualan per produk/salesman', icon: BarChart2, color: '#EC4899', bg: '#FDF2F8' },
  { href: '/ai/inventory-prediction', label: 'AI Inventory Prediction', desc: 'Prediksi kebutuhan stok & reorder', icon: Package, color: '#14B8A6', bg: '#F0FDFA' },
  { href: '/ai/financial-analysis', label: 'AI Financial Analysis', desc: 'Analisis keuangan mendalam dengan AI', icon: DollarSign, color: '#EF4444', bg: '#FEF2F2' },
  { href: '/ai/hr-assistant', label: 'AI HR Assistant', desc: 'Bantu pengelolaan SDM & rekrutmen', icon: UserCheck, color: '#6366F1', bg: '#EEF2FF' },
  { href: '/ai/marketplace-assistant', label: 'AI Marketplace', desc: 'Optimasi listing & harga marketplace', icon: ShoppingBag, color: '#F97316', bg: '#FFF7ED' },
  { href: '/ai/notifications', label: 'AI Notification', desc: 'Notifikasi cerdas berbasis AI trigger', icon: Bell, color: '#0EA5E9', bg: '#F0F9FF' },
  { href: '/ai/logs', label: 'AI Logs', desc: 'Riwayat semua aktivitas AI', icon: ScrollText, color: '#6B7280', bg: '#F9FAFB' },
];

const AI_STATS = [
  { label: 'Query Hari Ini', value: '1,284', icon: MessageSquare, color: '#5B52D1' },
  { label: 'Automasi Aktif', value: '8', icon: Zap, color: '#22C55E' },
  { label: 'Prediksi Akurasi', value: '92.4%', icon: TrendingUp, color: '#3B82F6' },
  { label: 'Laporan Dibuat', value: '34', icon: FileBarChart, color: '#8B5CF6' },
];

const RECENT_AI_INSIGHTS = [
  { msg: 'Prediksi revenue Juni 2026: Rp 318 jt (+12% vs Mei)', type: 'forecast', time: '5 mnt lalu' },
  { msg: 'Stok Semen Portland akan habis dalam 3 hari berdasarkan pola demand', type: 'inventory', time: '18 mnt lalu' },
  { msg: 'Invoice INV-2026-0847 belum dibayar 7 hari — trigger WA otomatis', type: 'automation', time: '32 mnt lalu' },
  { msg: 'Pelanggan PT Sinar Jaya tidak order >30 hari — CRM follow-up dibuat', type: 'crm', time: '1 jam lalu' },
];

export default function AiDashboardPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/dashboard'); return; }
    setMounted(true);
  }, [token]);

  if (!mounted || !token) return null;

  return (
    <OdooLayout title="AI Center" subtitle="Kecerdasan buatan terintegrasi untuk bisnis Anda">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5B52D1 0%, #8B80F9 60%, #C4A8D0 100%)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-6 right-32 h-24 w-24 rounded-full border-2 border-white" />
            <div className="absolute -bottom-4 right-64 h-16 w-16 rounded-full border border-white" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gentong Mas AI Center</h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,.8)' }}>
                ERP Intelligence — Powered by GPT-4 · 12 Modul AI Aktif · Model dilatih data bisnis Anda
              </p>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white font-semibold">AI Online</span>
            </div>
          </div>
          <div className="relative mt-4 grid grid-cols-4 gap-4">
            {AI_STATS.map((s, i) => (
              <div key={i} className="text-center bg-white/15 rounded-xl py-3 px-2">
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,.7)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: '#1E1B4B' }}>Modul AI</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>
              <Sparkles className="h-3 w-3 inline mr-1" />12 Aktif
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {AI_MODULES.map((m, i) => (
              <Link
                key={i}
                href={m.href}
                className="group rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all"
                style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: m.bg }}>
                  <m.icon className="h-5 w-5" style={{ color: m.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug" style={{ color: '#1E1B4B' }}>{m.label}</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#9CA3AF' }}>{m.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: m.color }}>
                  Buka <ArrowUpRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Insights */}
        <div className="rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EDE9FE' }}>
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#1E1B4B' }}>
              <Activity className="h-4 w-4" style={{ color: '#5B52D1' }} /> AI Insights Terkini
            </h3>
            <Link href="/ai/logs" className="text-xs font-semibold" style={{ color: '#5B52D1' }}>Lihat Semua Log</Link>
          </div>
          <div className="divide-y" style={{ borderColor: '#EDE9FE' }}>
            {RECENT_AI_INSIGHTS.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(91,82,209,.08)' }}>
                  <Brain className="h-4 w-4" style={{ color: '#5B52D1' }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs" style={{ color: '#1E1B4B' }}>{ins.msg}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize" style={{ backgroundColor: 'rgba(91,82,209,.1)', color: '#5B52D1' }}>{ins.type}</span>
                    <span className="text-[10px]" style={{ color: '#9CA3AF' }}>· {ins.time}</span>
                  </div>
                </div>
                <CheckCircle className="h-4 w-4 flex-shrink-0 mt-1" style={{ color: '#22C55E' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Chat */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#F5F3FF', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center gap-3 mb-3">
            <Brain className="h-5 w-5" style={{ color: '#5B52D1' }} />
            <p className="font-bold text-sm" style={{ color: '#1E1B4B' }}>Tanyakan AI sesuatu...</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Berapa total penjualan bulan ini?',
              'Produk paling laris?',
              'Stok hampir habis?',
              'Siapa sales terbaik?',
              'Berapa laba bulan lalu?',
              'Invoice yang belum dibayar?',
            ].map((q) => (
              <Link
                key={q}
                href={`/ai/chatbot?q=${encodeURIComponent(q)}`}
                className="px-3 py-2 rounded-xl text-xs font-medium transition hover:shadow-sm"
                style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #EDE9FE', color: '#5B52D1' }}
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </OdooLayout>
  );
}

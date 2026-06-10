'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import { useModulesStore } from '../../lib/store/useModulesStore';
import { MODULES, ERP_Module } from '../../lib/modules-registry';
import {
  Search, Star, CheckCircle, ArrowLeft, LayoutGrid,
  X, Lock, CheckCheck, Sparkles, ChevronRight, Check,
} from 'lucide-react';
import Link from 'next/link';

const PROTECTED = ['system'];
const BRAND = '#7C3AED';
const BRAND_DARK = '#5B21B6';

export default function AppStorePage() {
  const { token } = useAuthStore();
  const { installed, install, uninstall, hydrate } = useModulesStore();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<ERP_Module | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    hydrate();
    setMounted(true);
  }, [token]);

  const filtered = useMemo(() => {
    if (!query) return MODULES;
    const q = query.toLowerCase();
    return MODULES.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q) ||
      m.features.some(f => f.toLowerCase().includes(q))
    );
  }, [query]);

  const handleInstall = async (mod: ERP_Module) => {
    if (mod.status === 'coming-soon' || mod.status === 'core') return;
    setInstalling(mod.id);
    await new Promise(r => setTimeout(r, 800));
    install(mod.id, mod.deps);
    setInstalling(null);
  };

  const handleUninstall = (mod: ERP_Module) => {
    if (PROTECTED.includes(mod.id)) return;
    uninstall(mod.id);
  };

  if (!mounted) return null;

  const isInstalled = (id: string) => installed.includes(id);
  const installedCount = MODULES.filter(m => isInstalled(m.id)).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F4F9' }}>

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white border-b px-4 md:px-6 py-3.5 flex items-center gap-3" style={{ borderColor: '#EDE8F5' }}>
        <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0" style={{ color: '#9CA3AF' }}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 ml-1 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
            <LayoutGrid className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-none" style={{ color: '#2F2B3D' }}>App Store</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>Gentong Mas ERP</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari modul atau fitur..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200"
            style={{ borderColor: '#EDE8F5' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold flex-shrink-0" style={{ color: '#6B7280' }}>
          <CheckCircle className="h-4 w-4" style={{ color: '#059669' }} />
          {installedCount} / {MODULES.length} aktif
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Hero Banner */}
        {!query && (
          <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 55%, #3730A3 100%)` }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-16 h-32 w-32 rounded-full border-2 border-white" />
              <div className="absolute -bottom-4 right-36 h-20 w-20 rounded-full border-2 border-white" />
              <div className="absolute top-0 right-4 h-48 w-48 rounded-full border border-white" />
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Gentong Mas ERP</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">App Store</h1>
                <p className="text-sm opacity-80 text-white">Install modul yang Anda butuhkan. Setiap modul berisi fitur lengkap.</p>
                <div className="flex items-center gap-6 mt-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{MODULES.length}</p>
                    <p className="text-[11px] opacity-70 text-white">Total Modul</p>
                  </div>
                  <div className="h-8 border-l border-white/20" />
                  <div>
                    <p className="text-2xl font-bold text-white">{installedCount}</p>
                    <p className="text-[11px] opacity-70 text-white">Terinstall</p>
                  </div>
                  <div className="h-8 border-l border-white/20" />
                  <div>
                    <p className="text-2xl font-bold text-white">{MODULES.length - installedCount}</p>
                    <p className="text-[11px] opacity-70 text-white">Tersedia</p>
                  </div>
                </div>
              </div>
              {/* Module emoji grid preview */}
              <div className="hidden md:flex flex-wrap gap-2 max-w-[200px]">
                {MODULES.map(m => (
                  <div key={m.id}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    onClick={() => setDetail(m)}
                    title={m.name}
                  >
                    {m.emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search result header */}
        {query && (
          <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
            {filtered.length} modul ditemukan untuk &ldquo;{query}&rdquo;
          </p>
        )}

        {/* Module Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: '#F5F4F9' }}>
              <Search className="h-8 w-8" style={{ color: '#C0BBCA' }} />
            </div>
            <p className="font-semibold" style={{ color: '#6B7280' }}>Modul tidak ditemukan</p>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(mod => {
              const Icon = mod.icon;
              const inst = isInstalled(mod.id);
              const isCore = mod.status === 'core' || PROTECTED.includes(mod.id);
              const isInstalling = installing === mod.id;

              return (
                <div
                  key={mod.id}
                  onClick={() => setDetail(mod)}
                  className="bg-white rounded-2xl border cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
                  style={{ borderColor: inst ? mod.color + '50' : '#EDE8F5' }}
                >
                  {/* Installed top bar */}
                  {inst && (
                    <div className="h-1 w-full" style={{ backgroundColor: mod.color }} />
                  )}

                  <div className="p-5">
                    {/* Icon & status */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-105"
                        style={{ background: mod.gradient }}
                      >
                        {mod.emoji}
                      </div>
                      {inst && !isCore && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#D1FAE5' }}>
                          <Check className="h-3.5 w-3.5" style={{ color: '#059669' }} />
                        </div>
                      )}
                      {isCore && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#EDE9FE' }}>
                          <Lock className="h-3 w-3" style={{ color: BRAND }} />
                        </div>
                      )}
                    </div>

                    {/* Name & desc */}
                    <h3 className="text-sm font-bold mb-1 leading-tight" style={{ color: '#2F2B3D' }}>{mod.name}</h3>
                    <p className="text-[11px] leading-relaxed line-clamp-2 mb-4" style={{ color: '#9CA3AF' }}>{mod.desc}</p>

                    {/* Feature count */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: mod.bgColor, color: mod.color }}>
                        {mod.features.length} fitur termasuk
                      </div>
                    </div>

                    {/* Rating & installs */}
                    <div className="flex items-center justify-between text-[10px] mb-4" style={{ color: '#9CA3AF' }}>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" style={{ color: '#F9A825', fill: '#F9A825' }} />
                        {mod.rating}
                      </span>
                      <span>{mod.installs} install</span>
                    </div>

                    {/* Install button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (isCore || isInstalling) return;
                        inst ? handleUninstall(mod) : handleInstall(mod);
                      }}
                      disabled={isInstalling || isCore}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={
                        isCore
                          ? { backgroundColor: '#EDE9FE', color: BRAND }
                          : isInstalling
                          ? { backgroundColor: mod.bgColor, color: mod.color, opacity: 0.7 }
                          : inst
                          ? { backgroundColor: 'rgba(220,38,38,.08)', color: '#DC2626', border: '1.5px solid rgba(220,38,38,.2)' }
                          : { background: mod.gradient, color: '#fff' }
                      }
                    >
                      {isCore ? '🔒 Core' : isInstalling ? '⏳ Menginstall...' : inst ? '✕ Uninstall' : '+ Install'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 text-white relative" style={{ background: detail.gradient }}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-8 h-24 w-24 rounded-full border-2 border-white" />
                <div className="absolute -bottom-2 right-20 h-16 w-16 rounded-full border border-white" />
              </div>
              <button
                onClick={() => setDetail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="relative flex items-center gap-4">
                <div className="text-4xl">{detail.emoji}</div>
                <div>
                  <h2 className="text-lg font-bold text-white">{detail.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" style={{ fill: '#FDE68A', color: '#FDE68A' }} />
                      {detail.rating}
                    </span>
                    <span>{detail.installs} install</span>
                    <span>v{detail.version}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{detail.longDesc}</p>

              {/* Features list */}
              <div>
                <p className="text-xs font-bold mb-3" style={{ color: '#2F2B3D' }}>Fitur yang termasuk:</p>
                <div className="grid grid-cols-1 gap-2">
                  {detail.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: detail.bgColor }}>
                        <Check className="h-3 w-3" style={{ color: detail.color }} />
                      </div>
                      <span className="text-xs" style={{ color: '#4B5563' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deps */}
              {detail.deps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#9CA3AF' }}>Memerlukan modul:</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.deps.map(dep => {
                      const depMod = MODULES.find(m => m.id === dep);
                      const depInst = isInstalled(dep);
                      return (
                        <span key={dep} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F5F4F9', color: '#6B7280' }}>
                          {depMod?.emoji} {depMod?.name ?? dep}
                          {depInst && <CheckCircle className="h-3 w-3 ml-0.5" style={{ color: '#059669' }} />}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              {detail.href && isInstalled(detail.id) && detail.status !== 'coming-soon' && (
                <Link
                  href={detail.href}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-center border transition-all"
                  style={{ borderColor: detail.color, color: detail.color }}
                >
                  Buka Modul
                </Link>
              )}
              {detail.status === 'core' || PROTECTED.includes(detail.id) ? (
                <div className="flex-1 py-3 rounded-xl text-sm font-bold text-center" style={{ backgroundColor: '#EDE9FE', color: BRAND }}>
                  🔒 Modul Inti
                </div>
              ) : (
                <button
                  onClick={() => {
                    isInstalled(detail.id) ? handleUninstall(detail) : handleInstall(detail);
                    setDetail(null);
                  }}
                  disabled={installing === detail.id}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: isInstalled(detail.id) ? '#DC2626' : detail.gradient }}
                >
                  {installing === detail.id ? 'Menginstall...' : isInstalled(detail.id) ? 'Uninstall' : 'Install Sekarang'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

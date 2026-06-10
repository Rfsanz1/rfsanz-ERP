'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store/useAuthStore';
import {
  Eye, EyeOff, BarChart2, ShoppingCart, Package,
  Users, Truck, DollarSign, TrendingUp, Bell, Settings,
  Zap, ArrowUpRight, Activity, PieChart, Home,
} from 'lucide-react';

function getRoleRedirect(roles: string[]): string {
  const role = (roles?.[0] ?? '').toLowerCase();
  if (role === 'sales') return '/sales';
  if (role === 'gudang' || role === 'warehouse') return '/gudang';
  if (role === 'driver') return '/driver';
  return '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginDemo, loadProfile, token, error, loading } = useAuthStore();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (token) {
      const user = useAuthStore.getState().user;
      router.push(getRoleRedirect(user?.roles ?? []));
    }
  }, [token]);
  if (token) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      await loadProfile();
      const user = useAuthStore.getState().user;
      router.push(getRoleRedirect(user?.roles ?? []));
    }
  }

  function handleDemo() {
    loginDemo();
    const user = useAuthStore.getState().user;
    router.push(getRoleRedirect(user?.roles ?? []));
  }

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.45s ease',
      }}
    >

        {/* ── LEFT SECTION ── */}
        <div
          className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #4338CA 0%, #5B52D1 35%, #7C6FF5 65%, #8B80F9 100%)',
            padding: '40px 36px',
          }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Abstract floating shapes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute rounded-full" style={{ width: 280, height: 280, top: -80, right: -60, background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)', filter: 'blur(30px)' }} />
            <div className="absolute rounded-full" style={{ width: 200, height: 200, bottom: -40, left: -40, background: 'radial-gradient(circle, rgba(196,181,253,0.25) 0%, transparent 70%)', filter: 'blur(30px)' }} />
            <div className="absolute" style={{ width: 120, height: 120, top: '40%', right: '8%', borderRadius: '30%', border: '1.5px solid rgba(255,255,255,0.15)', transform: 'rotate(20deg)' }} />
            <div className="absolute" style={{ width: 60, height: 60, top: '20%', left: '12%', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.12)' }} />
            <div className="absolute" style={{ width: 35, height: 35, bottom: '28%', right: '18%', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="absolute" style={{ width: 18, height: 18, top: '32%', left: '30%', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div className="absolute" style={{ width: 10, height: 10, bottom: '42%', left: '18%', borderRadius: '50%', backgroundColor: 'rgba(196,181,253,0.5)' }} />
          </div>

          {/* Logo & brand */}
          <div className="relative flex items-center gap-3 z-10">
            <div
              className="flex items-center justify-center font-bold text-[#6C63F6] text-[15px]"
              style={{
                width: 38, height: 38,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 16px rgba(91,82,209,0.3)',
                letterSpacing: '-0.5px',
              }}
            >
              G
            </div>
            <div>
              <span className="text-white font-bold text-[15px] tracking-tight leading-none block">Gentong Mas</span>
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Enterprise ERP</span>
            </div>
          </div>

          {/* Headline */}
          <div className="relative z-10 -mt-4">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold mb-5"
              style={{ backgroundColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Zap className="h-3 w-3" style={{ color: '#FCD34D' }} />
              Platform ERP Terintegrasi
            </div>
            <h1 className="text-[2.1rem] font-bold text-white leading-[1.2] tracking-tight">
              Kelola bisnis Anda<br />
              <span style={{ color: '#C4B5FD' }}>lebih cerdas.</span>
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 300 }}>
              Sales, inventaris, keuangan & HR — satu dashboard, real-time analytics.
            </p>
          </div>

          {/* Dashboard mockup card */}
          <div
            className="relative z-10"
            style={{
              borderRadius: 20,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)',
              padding: '18px 18px 16px',
            }}
          >
            {/* Mockup header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                {/* Mini sidebar icons */}
                <div className="flex flex-col gap-1.5">
                  {[Home, BarChart2, ShoppingCart, Package, DollarSign, Users].map((Icon, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center"
                      style={{
                        width: 26, height: 26,
                        borderRadius: 8,
                        backgroundColor: i === 1 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <Icon className="h-3 w-3" style={{ color: i === 1 ? '#fff' : 'rgba(255,255,255,0.45)' }} />
                    </div>
                  ))}
                </div>

                {/* Main content area */}
                <div className="flex-1">
                  <p className="text-white text-[11px] font-semibold mb-0.5">Dashboard Overview</p>
                  <p className="text-[9.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Mei 2026 · Real-time</p>

                  {/* Stat mini cards */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                    {[
                      { label: 'Revenue', value: 'Rp 2.4M', icon: TrendingUp, color: '#A78BFA' },
                      { label: 'Orders', value: '348', icon: ShoppingCart, color: '#67E8F9' },
                      { label: 'SKU', value: '1.2K', icon: Package, color: '#86EFAC' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl p-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <stat.icon className="h-2.5 w-2.5 mb-1" style={{ color: stat.color }} />
                        <p className="text-white text-[11px] font-bold leading-none">{stat.value}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bar chart */}
                  <div className="mt-2.5 rounded-xl p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Penjualan Bulanan</p>
                      <Activity className="h-2.5 w-2.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                    <div className="flex items-end gap-1 h-10">
                      {[35, 55, 45, 70, 52, 80, 65, 50, 62, 78, 58, 92].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            background: i === 11
                              ? 'linear-gradient(to top, #A78BFA, #C4B5FD)'
                              : 'rgba(255,255,255,0.18)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live status */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                <span className="text-[9.5px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Semua sistem aktif</span>
              </div>
              <span className="text-[9.5px]" style={{ color: 'rgba(255,255,255,0.3)' }}>6 modul terhubung</span>
            </div>
          </div>

          {/* Bottom */}
          <p className="relative z-10 text-[10.5px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2026 Gentong Mas — Enterprise Resource Planning
          </p>
        </div>

        {/* ── RIGHT SECTION ── */}
        <div
          className="flex flex-1 flex-col items-center justify-center relative overflow-hidden"
          style={{ background: '#FFFFFF', padding: '40px 44px' }}
        >
          {/* Subtle corner decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute" style={{ top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(237,233,254,0.8) 0%, transparent 70%)' }} />
            <div className="absolute" style={{ bottom: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,228,255,0.6) 0%, transparent 70%)' }} />
          </div>

          <div className="relative w-full" style={{ maxWidth: 360 }}>

            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div className="flex items-center justify-center font-bold text-white text-[14px]" style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #5B52D1, #8B80F9)' }}>G</div>
              <span className="font-bold text-[16px]" style={{ color: '#1E1B4B' }}>Gentong Mas ERP</span>
            </div>

            {/* Header text */}
            <div className="mb-8">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mb-4"
                style={{ backgroundColor: '#F5F3FF', color: '#6D28D9', border: '1px solid #EDE9FE' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 inline-block" />
                Selamat datang kembali
              </div>
              <h2 className="text-[2rem] font-bold tracking-tight leading-tight" style={{ color: '#1E1B4B' }}>
                Welcome Back
              </h2>
              <p className="mt-2 text-[13.5px]" style={{ color: '#9CA3AF' }}>
                Masuk untuk akses penuh ke dashboard ERP Anda
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-[12.5px] font-semibold mb-1.5" style={{ color: '#374151' }}>
                  Alamat Email
                </label>
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="nama@perusahaan.com"
                  className="w-full outline-none text-[13.5px] transition-all duration-200"
                  style={{
                    borderRadius: 14,
                    padding: '12px 16px',
                    border: focusedField === 'email' ? '1.5px solid #8B80F9' : '1.5px solid #E5E7EB',
                    boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(139,128,249,0.1), 0 1px 4px rgba(91,82,209,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                    color: '#111827',
                    backgroundColor: '#FAFAFA',
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12.5px] font-semibold" style={{ color: '#374151' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[12px] font-semibold transition-colors"
                    style={{ color: '#7C3AED' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#5B52D1')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7C3AED')}
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full outline-none text-[13.5px] transition-all duration-200"
                    style={{
                      borderRadius: 14,
                      padding: '12px 48px 12px 16px',
                      border: focusedField === 'password' ? '1.5px solid #8B80F9' : '1.5px solid #E5E7EB',
                      boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(139,128,249,0.1), 0 1px 4px rgba(91,82,209,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                      color: '#111827',
                      backgroundColor: '#FAFAFA',
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors"
                    style={{ color: '#C4C9D4' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#C4C9D4')}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5 py-0.5">
                <button
                  type="button"
                  onClick={() => setRemember(v => !v)}
                  className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
                  style={{
                    width: 18, height: 18,
                    borderRadius: 6,
                    border: remember ? '2px solid #7C3AED' : '2px solid #D1D5DB',
                    backgroundColor: remember ? '#7C3AED' : 'transparent',
                    boxShadow: remember ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                  }}
                >
                  {remember && (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-[12.5px] select-none" style={{ color: '#6B7280' }}>Ingat saya selama 30 hari</span>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-2xl px-4 py-3 text-[12.5px] flex items-start gap-2.5"
                  style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                >
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold text-white transition-all duration-200"
                style={{
                  borderRadius: 14,
                  padding: '13px 20px',
                  background: 'linear-gradient(135deg, #5B52D1 0%, #7C6FF5 50%, #8B80F9 100%)',
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(91,82,209,0.45), 0 2px 8px rgba(91,82,209,0.2)',
                  opacity: loading ? 0.75 : 1,
                  marginTop: 4,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = '0 10px 32px rgba(91,82,209,0.55), 0 2px 8px rgba(91,82,209,0.25)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(91,82,209,0.45), 0 2px 8px rgba(91,82,209,0.2)';
                }}
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Dashboard
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Demo Mode button */}
              <button
                type="button"
                onClick={handleDemo}
                className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold transition-all duration-200"
                style={{
                  borderRadius: 14,
                  padding: '12px 20px',
                  backgroundColor: '#F0FDF4',
                  border: '1.5px solid #BBF7D0',
                  color: '#15803D',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#DCFCE7';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#F0FDF4';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Coba Demo Mode (tanpa backend)
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: '#F0EEF8' }} />
                <span className="text-[12px] font-medium" style={{ color: '#C4C9D4' }}>atau masuk dengan</span>
                <div className="flex-1 h-px" style={{ backgroundColor: '#F0EEF8' }} />
              </div>

              {/* Google button */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 text-[13px] font-semibold transition-all duration-200"
                style={{
                  borderRadius: 14,
                  padding: '12px 20px',
                  backgroundColor: '#FAFAFA',
                  border: '1.5px solid #EEECFB',
                  color: '#374151',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#F5F3FF';
                  e.currentTarget.style.borderColor = '#DDD6FE';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(91,82,209,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#FAFAFA';
                  e.currentTarget.style.borderColor = '#EEECFB';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                }}
              >
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Lanjutkan dengan Google
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-[12px] mt-7" style={{ color: '#C4C9D4' }}>
              Butuh akses?{' '}
              <span
                className="font-semibold cursor-pointer transition-colors"
                style={{ color: '#7C3AED' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#5B52D1')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7C3AED')}
              >
                Hubungi administrator
              </span>
            </p>

            {/* Trusted by badges */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-5" style={{ borderTop: '1px solid #F3F0FF' }}>
              {[
                { label: 'SSL Secured', icon: '🔒' },
                { label: 'ISO 27001', icon: '✓' },
                { label: 'Data Aman', icon: '🛡' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-1">
                  <span className="text-[11px]">{b.icon}</span>
                  <span className="text-[10.5px] font-medium" style={{ color: '#C4C9D4' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}


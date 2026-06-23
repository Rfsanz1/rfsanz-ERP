'use client';

import { useEffect, useState } from 'react';
import DashboardContent from './_DashboardContent';

/* ── Skeleton pulse block ─────────────────────────────────────────── */
function S({ w = '100%', h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: r,
        background: 'linear-gradient(90deg, #E2E8F0 25%, #EEF2FF 50%, #E2E8F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skel-shimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: 1400 }} className="space-y-5">
      <style>{`
        @keyframes skel-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <S w={160} h={26} r={8} />
          <S w={240} h={13} r={6} />
        </div>
        <div className="flex items-center gap-2">
          <S w={180} h={36} r={10} />
          <S w={90}  h={36} r={10} />
        </div>
      </div>

      {/* ── KPI cards (2 cols mobile → 4 cols desktop) ─────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div className="flex items-center justify-between">
              <S w={40} h={40} r={12} />
              <S w={24} h={14} r={6} />
            </div>
            <div className="space-y-2">
              <S w="70%" h={26} r={8} />
              <S w="90%" h={12} r={6} />
              <S w="55%" h={12} r={6} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '20px 24px',
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div className="space-y-1.5">
            <S w={100} h={16} r={6} />
            <S w={200} h={12} r={5} />
          </div>
          <S w={18} h={18} r={4} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 12, padding: '20px 12px 18px', borderRadius: 14,
                border: '1.5px solid var(--border)', background: 'var(--surface-sunken)',
              }}
            >
              <S w={52} h={52} r={14} />
              <S w="70%" h={13} r={5} />
            </div>
          ))}
        </div>
      </div>

      {/* ── 2-col section: Chart + Kas & Bank ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <S w={130} h={16} r={6} />
            <S w={40}  h={20} r={100} />
          </div>
          {/* Bar chart skeleton */}
          <div className="flex items-end gap-1" style={{ height: 96, marginBottom: 12 }}>
            {[55, 70, 45, 80, 60, 90, 50, 75, 65, 85, 70, 100].map((h, i) => (
              <div
                key={i} className="flex-1"
                style={{
                  height: `${h}%`, borderRadius: '4px 4px 2px 2px',
                  background: i === 11
                    ? 'rgba(99,102,241,0.25)'
                    : 'linear-gradient(90deg, #E2E8F0 25%, #EEF2FF 50%, #E2E8F0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'skel-shimmer 1.6s ease-in-out infinite',
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            <S w="60%" h={12} r={5} />
            <S w="40%" h={12} r={5} />
          </div>
        </div>

        {/* Kas & Bank card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '20px 24px',
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <S w={110} h={16} r={6} />
            <S w={18}  h={18} r={4} />
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3"
                style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <S w={36} h={36} r={10} />
                <div className="flex-1 space-y-1.5">
                  <S w="60%" h={13} r={5} />
                  <S w="40%" h={11} r={4} />
                </div>
                <S w={70} h={16} r={6} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent orders table ──────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div className="flex items-center justify-between"
          style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <S w={130} h={16} r={6} />
          <S w={80}  h={14} r={5} />
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="flex items-center gap-3"
            style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}
          >
            <S w={32}  h={32}  r={8} />
            <div className="flex-1 space-y-1.5">
              <S w="45%" h={13} r={5} />
              <S w="30%" h={11} r={4} />
            </div>
            <S w={70}  h={22}  r={100} />
            <S w={80}  h={14}  r={5}   />
          </div>
        ))}
      </div>

    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <DashboardSkeleton />;

  return <DashboardContent />;
}

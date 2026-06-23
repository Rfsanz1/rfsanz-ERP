'use client';

/* ─────────────────────────────────────────────────────────────────
   Skeleton Loading Components — shimmer animasi bergerak kiri→kanan
   Gunakan komponen ini untuk mengganti "Memuat..." teks.
───────────────────────────────────────────────────────────────── */

import React from 'react';

/* Keyframe shimmer di-inject sekali sebagai <style> tag */
export function SkeletonStyle() {
  return (
    <style>{`
      @keyframes sk-shimmer {
        0%   { background-position: -600px 0; }
        100% { background-position:  600px 0; }
      }
      .sk {
        background: linear-gradient(90deg, #e8eaf0 25%, #f5f6fa 50%, #e8eaf0 75%);
        background-size: 600px 100%;
        animation: sk-shimmer 1.4s infinite linear;
        border-radius: 6px;
        display: inline-block;
      }
      .sk-amber {
        background: linear-gradient(90deg, #fde68a 25%, #fef9ec 50%, #fde68a 75%);
        background-size: 600px 100%;
        animation: sk-shimmer 1.4s infinite linear;
        border-radius: 6px;
        display: inline-block;
      }
    `}</style>
  );
}

/* Satu blok shimmer dengan ukuran bebas */
function S({ w = '100%', h = 14, className = 'sk', style = {} }: {
  w?: string | number;
  h?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{ width: w, height: h, borderRadius: 6, display: 'block', ...style }}
    />
  );
}

/* ── Skeleton baris tabel (putih / ungu untuk Sales) ──────────── */
export function SkeletonTableRows({ cols = 6, count = 8 }: { cols?: number; count?: number }) {
  return (
    <>
      <SkeletonStyle />
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <S w={j === 0 ? '70%' : j === cols - 1 ? '50%' : `${60 + ((i + j) % 3) * 15}%`} h={13} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Skeleton baris tabel Gudang (amber) ──────────────────────── */
export function GudangSkeletonTableRows({
  cols = 7,
  count = 6,
  border = '#FEF3C7',
}: {
  cols?: number;
  count?: number;
  border?: string;
}) {
  return (
    <>
      <SkeletonStyle />
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} style={{ borderBottom: `1px solid ${border}` }}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} style={{ padding: '14px 16px' }}>
              <S
                w={j === 0 ? '70%' : j === cols - 1 ? '40%' : `${55 + ((i + j) % 4) * 10}%`}
                h={13}
                className="sk-amber"
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Skeleton kartu (untuk Picking & Transfer) ────────────────── */
export function GudangSkeletonCards({
  count = 5,
  border = '#FEF3C7',
  accent = '#D97706',
}: {
  count?: number;
  border?: string;
  accent?: string;
}) {
  return (
    <>
      <SkeletonStyle />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              border: `1.5px solid ${border}`,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* icon placeholder */}
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(90deg, ${accent}22 25%, ${accent}11 50%, ${accent}22 75%)`,
                backgroundSize: '300px 100%',
                animation: 'sk-shimmer 1.4s infinite linear',
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <S w={`${50 + (i % 3) * 15}%`} h={13} className="sk-amber" />
              <S w={`${35 + (i % 4) * 10}%`} h={11} className="sk-amber" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <S w={60} h={20} className="sk-amber" style={{ borderRadius: 100 }} />
              <S w={44} h={11} className="sk-amber" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Dashboard Sales (halaman /sales) ─────────────────────────── */
export function SalesDashboardSkeleton() {
  return (
    <div style={{ maxWidth: 1200 }} className="space-y-5">
      <SkeletonStyle />

      {/* Header */}
      <div>
        <S w={220} h={24} style={{ marginBottom: 8 }} />
        <S w={300} h={13} />
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <S w={36} h={36} style={{ borderRadius: 10 }} />
              <S w={32} h={16} style={{ borderRadius: 8 }} />
            </div>
            <S w={80} h={28} style={{ marginBottom: 6 }} />
            <S w={130} h={12} />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
        <S w={120} h={16} style={{ marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px' }}>
              <S w={40} h={40} style={{ borderRadius: 12 }} />
              <S w={60} h={11} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

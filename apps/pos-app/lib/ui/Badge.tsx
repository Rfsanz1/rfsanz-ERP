'use client';
import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple';

const COLORS: Record<BadgeVariant, { color: string; bg: string }> = {
  success: { color:'#16A34A', bg:'rgba(34,197,94,.12)' },
  warning: { color:'#D97706', bg:'rgba(245,158,11,.12)' },
  danger:  { color:'#DC2626', bg:'rgba(239,68,68,.12)' },
  info:    { color:'#0891B2', bg:'rgba(8,145,178,.12)' },
  purple:  { color:'#7C3AED', bg:'rgba(124,58,237,.1)' },
  default: { color:'#6B7280', bg:'rgba(107,114,128,.1)' },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({ children, variant = 'default', size = 'md', dot }: BadgeProps) {
  const { color, bg } = COLORS[variant];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius:100, fontSize: size === 'sm' ? 11 : 12,
      fontWeight:600, color, backgroundColor:bg,
    }}>
      {dot && <span style={{ width:6, height:6, borderRadius:'50%', backgroundColor:color }} />}
      {children}
    </span>
  );
}

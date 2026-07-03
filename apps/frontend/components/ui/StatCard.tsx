'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, icon: Icon, iconColor = '#8C57FF', trend, trendUp }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 6px rgba(47,43,61,.08)',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconColor }}
        >
          <Icon className="h-[22px] w-[22px]" style={{ color: '#fff' }} strokeWidth={2} />
        </div>
        {trend && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{
              color: trendUp ? '#56CA00' : '#FF4C51',
              background: trendUp ? 'rgba(86,202,0,0.12)' : 'rgba(255,76,81,0.12)',
            }}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

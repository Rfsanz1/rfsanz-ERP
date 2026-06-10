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

export function StatCard({ label, value, icon: Icon, iconColor = '#5B52D1', trend, trendUp }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-lg p-5 flex items-start gap-4"
      style={{ boxShadow: '0 2px 6px rgba(47,43,61,.12)', border: '1px solid #EDE9FE' }}
    >
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${iconColor}18` }}
      >
        <Icon className="h-6 w-6" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: '#1E1B4B' }}>{value}</p>
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-[#28C76F]' : 'text-[#EA5455]'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  );
}

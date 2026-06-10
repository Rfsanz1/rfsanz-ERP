'use client';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-[#28C76F]/12 text-[#28C76F] border-[#28C76F]/20',
  warning: 'bg-[#FF9F43]/12 text-[#FF9F43] border-[#FF9F43]/20',
  danger: 'bg-[#EA5455]/12 text-[#EA5455] border-[#EA5455]/20',
  info: 'bg-[#00CFE8]/12 text-[#00CFE8] border-[#00CFE8]/20',
  default: 'bg-[#9CA3AF]/12 text-[#9CA3AF] border-[#9CA3AF]/20',
};

export function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}

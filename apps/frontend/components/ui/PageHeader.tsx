'use client';

import { LucideIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 mb-2 text-xs" style={{ color: '#9CA3AF' }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>›</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-[#5B52D1] transition-colors">{crumb.label}</a>
              ) : (
                <span style={{ color: '#6B7280' }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(91,82,209,.12)' }}>
              <Icon className="h-5 w-5" style={{ color: '#5B52D1' }} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#1E1B4B' }}>{title}</h1>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { OdooLayout } from './OdooLayout';

interface ModernLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  pageTitle?: string;
  config?: unknown;
  navItems?: unknown[];
}

// Kept for backwards compatibility — wraps the new OdooLayout
export function ModernLayout({ children, title, subtitle, pageTitle }: ModernLayoutProps) {
  const effectiveTitle = title ?? pageTitle;
  return (
    <OdooLayout title={effectiveTitle} subtitle={subtitle}>
      {children}
    </OdooLayout>
  );
}

export default ModernLayout;

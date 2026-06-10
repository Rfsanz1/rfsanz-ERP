'use client';

// OdooLayout is now a passthrough — the global YetiLayout (injected via
// ConditionalLayout in the root app/layout.tsx) provides the sidebar/topbar.
// Kept for backward-compatibility so 100+ existing page imports don't break.

interface OdooLayoutProps {
  children: React.ReactNode;
  [key: string]: any;
}

export function OdooLayout({ children }: OdooLayoutProps) {
  return <>{children}</>;
}

export default OdooLayout;

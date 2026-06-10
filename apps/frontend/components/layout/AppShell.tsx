'use client';

// AppShell is now a passthrough — the global YetiLayout (injected via
// ConditionalLayout in the root app/layout.tsx) provides the sidebar/topbar.
// Kept for backward-compatibility so 100+ existing page imports don't break.

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: { label: string; href: string }[];
}

interface AppShellProps {
  children: React.ReactNode;
  [key: string]: any;
}

export default function AppShell({ children }: AppShellProps) {
  return <>{children}</>;
}

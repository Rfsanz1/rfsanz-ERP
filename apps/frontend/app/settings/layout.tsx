'use client';

import dynamic from 'next/dynamic';

const SettingsLayoutInner = dynamic(
  () => import('./SettingsLayoutInner'),
  { ssr: false }
);

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsLayoutInner>{children}</SettingsLayoutInner>;
}

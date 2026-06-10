'use client';

import { ReactNode, useState } from 'react';
import { YetiSidebar } from './YetiSidebar';
import { YetiTopbar } from './YetiTopbar';

interface YetiLayoutProps {
  children: ReactNode;
}

export function YetiLayout({ children }: YetiLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F2F5]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <YetiSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <YetiTopbar
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

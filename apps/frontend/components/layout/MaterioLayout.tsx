'use client';

import { ReactNode, useState } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './MaterioSidebar';
import { MaterioTopbar } from './MaterioTopbar';
import { MobileBottomNav } from './MobileBottomNav';

const MaterioSidebar = dynamic(
  () => import('./MaterioSidebar').then((m) => ({ default: m.MaterioSidebar })),
  { ssr: false }
);

interface MaterioLayoutProps {
  children: ReactNode;
}

export function MaterioLayout({ children }: MaterioLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <MaterioSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'all 0.25s ease',
        }}
      >
        <MaterioTopbar
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)}
        />
        <Box
          sx={{
            flex: 1,
            p: { xs: 1.5, sm: 2.5, md: 3 },
            overflowY: 'auto',
            paddingTop: { xs: 1.5, sm: 2.5, md: 3 },
            paddingBottom: { xs: 1.5, sm: 2.5, md: 3 },
          }}
        >
          {children}
          {/* Spacer to always clear the fixed bottom nav on mobile */}
          <div style={{ height: 80 }} />
        </Box>
      </Box>

      {/* Mobile bottom navigation — hidden on desktop */}
      <MobileBottomNav />
    </Box>
  );
}

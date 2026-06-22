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

interface MaterioLayoutProps { children: ReactNode; }

export function MaterioLayout({ children }: MaterioLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Fixed sidebar — burger is INSIDE the sidebar */}
      <MaterioSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content — marginLeft follows sidebar width, 1024px breakpoint matches Tailwind lg */}
      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
          // Use raw media query so breakpoint matches Tailwind's lg (1024px), not MUI lg (1200px)
          '@media (min-width: 1024px)': {
            marginLeft: `${sidebarW}px`,
          },
          transition: 'margin-left 0.25s ease',
        }}
      >
        <MaterioTopbar
          collapsed={sidebarCollapsed}
          onToggleMobileSidebar={() => setMobileSidebarOpen(v => !v)}
        />
        <Box sx={{
          flex: 1,
          p: { xs: 1.5, sm: 2.5, md: 3 },
          paddingTop:    { xs: 1.5, sm: 2.5, md: 3 },
          paddingBottom: { xs: 1.5, sm: 2.5, md: 3 },
        }}>
          {children}
          <div style={{ height: 80 }} />
        </Box>
      </Box>

      <MobileBottomNav />
    </Box>
  );
}

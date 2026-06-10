'use client';

import { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import { MaterioSidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './MaterioSidebar';
import { MaterioTopbar } from './MaterioTopbar';

interface MaterioLayoutProps {
  children: ReactNode;
}

export function MaterioLayout({ children }: MaterioLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

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
            p: { xs: 2, sm: 3 },
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

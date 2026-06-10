import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { ConditionalLayout } from '../components/layout/ConditionalLayout';
import { ThemeRegistry } from '../lib/theme/ThemeRegistry';
import { ServiceWorkerRegister } from '../components/pwa/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#7367F0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Gentong Mas ERP',
  description: 'Sistem ERP terpadu untuk sales, inventory, finance, pengiriman & CRM',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GM ERP',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* iOS PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GM ERP" />
        <link rel="apple-touch-icon" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ThemeRegistry>
          <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeRegistry>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

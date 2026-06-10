import '../styles/globals.css';
import type { Metadata } from 'next';
import ToastContainer from '../components/ToastContainer';

export const metadata: Metadata = {
  title: 'Gentong Mas — POS Kasir',
  description: 'Aplikasi Kasir POS — Gentong Mas ERP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}


/** @type {import('next').NextConfig} */
const rawBackend = process.env.BACKEND_URL || 'http://127.0.0.1:6000';
const BACKEND = rawBackend.startsWith('http://') || rawBackend.startsWith('https://')
  ? rawBackend
  : `https://${rawBackend}`;

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
const allowedDevOrigins = [
  '*.replit.dev',
  '*.repl.co',
  '*.replit.app',
  '*.replit.com',
  '*.pike.replit.dev',
  '*.kirk.replit.dev',
  '*.sisko.replit.dev',
  '*.janeway.replit.dev',
];
if (replitDevDomain) allowedDevOrigins.push(replitDevDomain);

const nextConfig = {
  transpilePackages: ['@gm/ui', '@gm/utils', '@gm/types'],
  reactStrictMode: true,
  allowedDevOrigins,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@mui/material', '@mui/icons-material'],
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/docs',
        destination: `${BACKEND}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${BACKEND}/docs/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

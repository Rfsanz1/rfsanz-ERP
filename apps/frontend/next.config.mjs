/** @type {import('next').NextConfig} */
const BACKEND = 'http://127.0.0.1:6000';

const config = {
  transpilePackages: ['@gm/ui', '@gm/utils', '@gm/types'],
  reactStrictMode: true,
  allowedDevOrigins: ['*.replit.dev', '*.repl.co', '*.replit.app', '*.replit.com'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
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

export default config;

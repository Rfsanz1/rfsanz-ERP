/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:6000';

const config = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/docs',
        destination: `${BACKEND_URL}/docs`,
      },
    ];
  },
};

export default config;

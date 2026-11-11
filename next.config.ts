import type {NextConfig} from 'next';
import { execSync } from 'child_process';

let gitCommit = 'd3c277e';
try {
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
} catch {}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: 'v1.0.61',
    NEXT_PUBLIC_GIT_COMMIT: gitCommit,
  },
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  /* config options here */
  devIndicators: false,
  productionBrowserSourceMaps: false,
  outputFileTracingExcludes: {
    '*': ['**/*.js.map', '**/*.mjs.map'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // @ts-ignore
  allowedDevOrigins: [
    '*.trycloudflare.com',
    'localhost:9005',
    '127.0.0.1:9005'
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self "https://www.youtube.com"), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

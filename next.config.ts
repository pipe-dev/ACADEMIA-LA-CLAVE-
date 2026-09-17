import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
    'specifically-voice-feature-thousand.trycloudflare.com',
    '*.trycloudflare.com',
    'localhost:9002',
    '127.0.0.1:9002'
  ],
};

export default nextConfig;

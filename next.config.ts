import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['sharp', '@mediapipe/tasks-vision', 'p-limit', 'openai', '@google/generative-ai', '@imgly/background-removal-node'],
  experimental: {
    // allow reading wasm/model assets from node_modules at runtime
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default withNextIntl(nextConfig);

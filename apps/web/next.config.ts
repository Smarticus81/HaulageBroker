import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@haulage/core', '@haulage/types'],
  reactStrictMode: true,
  typedRoutes: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'motion'],
  },
};

export default nextConfig;

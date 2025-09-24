/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@clearhaul/ui', '@clearhaul/types', '@clearhaul/sdk-js'],
}

module.exports = nextConfig

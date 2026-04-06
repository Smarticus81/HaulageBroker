/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@carrier/ui', '@carrier/types', '@carrier/sdk'],
};

module.exports = nextConfig;

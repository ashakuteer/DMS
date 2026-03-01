/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ngo-donor/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;

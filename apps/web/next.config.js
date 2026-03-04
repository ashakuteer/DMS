/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ngo-donor/shared"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://dms-production-598e.up.railway.app/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

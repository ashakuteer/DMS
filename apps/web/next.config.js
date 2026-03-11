/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ngo-donor/shared"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  images: {
  domains: ["ovxfbfcrtwrhfugvwjym.supabase.co"],
  remotePatterns: [
    {
      protocol: "https",
      hostname: "ovxfbfcrtwrhfugvwjym.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
  ],
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

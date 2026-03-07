/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ngo-donor/shared"],
  
  // ✅ Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // ✅ Enable compression
  compress: true,

  // ✅ Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ovxfbfcrtwrhfugvwjym.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // ✅ Add caching headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
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

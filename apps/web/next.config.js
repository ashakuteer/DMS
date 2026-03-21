/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  allowedDevOrigins: [
    "*.replit.dev",
    "*.spock.replit.dev",
    "*.repl.co",
    "*.replit.app",
    "*.kirk.replit.dev",
    "*.repl.run",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ovxfbfcrtwrhfugvwjym.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async rewrites() {
    const apiUrl =
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://dms-production-598e.up.railway.app"
        : "http://localhost:3001");
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  allowedDevOrigins: ["*.replit.dev", "*.repl.co", "*.replit.app"],

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

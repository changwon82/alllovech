import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.youtube.com" },
      { protocol: "http", hostname: "alllovechurch.org" },
      { hostname: "pub-8b16770935a84226a2ce21554c7466de.r2.dev" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/proxy/old-site/:path*",
        destination: "http://alllovechurch.org/:path*",
      },
    ];
  },
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.youtube.com" },
    ],
  },
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;

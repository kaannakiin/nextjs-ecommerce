import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: "cdn.playflexdesign.com",
      },
      { hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;

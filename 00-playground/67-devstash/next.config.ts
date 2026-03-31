import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        // R2 storage URLs
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        // R2 public bucket URLs (if configured)
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
};

export default nextConfig;

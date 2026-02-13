import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Disable optimization to preserve image quality
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    qualities: [75, 100],
  },
  webpack: (config, { dev }) => {
    if (!dev) return config;

    const ignoredPaths = [
      "**/node_modules/**",
      "**/.git/**",
      "**/.next/**",
      "**/data/credits.json",
      "**/data/subscriptions.json",
    ];

    const currentWatchOptions = config.watchOptions || {};
    const currentIgnored = currentWatchOptions.ignored;
    const ignored = Array.isArray(currentIgnored)
      ? [...currentIgnored, ...ignoredPaths]
      : ignoredPaths;

    config.watchOptions = {
      ...currentWatchOptions,
      ignored,
    };

    return config;
  },
};

export default nextConfig;

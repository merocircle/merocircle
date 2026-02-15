import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Turbopack configuration to fix WASM binding issues
  experimental: {
    turbo: {
      resolveAlias: {},
    },
  },
  // Suppress Supabase realtime dependency warning
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/@supabase\/realtime-js/ }
      ];
    }

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;

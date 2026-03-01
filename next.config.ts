import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Resolve @ alias to src (matches existing Vite alias)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

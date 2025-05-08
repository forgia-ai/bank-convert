import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty"],
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
}

export default nextConfig

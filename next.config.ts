import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty", "pdf-parse"],
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }

    // Suppress Supabase realtime warnings
    config.module.exprContextCritical = false

    return config
  },
}

export default nextConfig

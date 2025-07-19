import type { NextConfig } from "next"
import { withPlausibleProxy } from "next-plausible"

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty", "pdf-parse"],
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }

    // Suppress Supabase realtime warnings
    config.module.exprContextCritical = false

    return config
  },
  // Add additional rewrites for i18n routes to work with Plausible proxy
  async rewrites() {
    return [
      // Handle i18n routes for Plausible proxy
      {
        source: "/:lang/proxy/js/script.js",
        destination: "https://plausible.io/js/script.file-downloads.local.outbound-links.js",
      },
      {
        source: "/:lang/proxy/api/event",
        destination: "https://plausible.io/api/event",
      },
    ]
  },
}

// Use withPlausibleProxy as recommended in the docs
// This automatically sets up the necessary rewrites
export default withPlausibleProxy()(nextConfig)

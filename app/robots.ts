import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://www.bankstatementconvert.to" // Replace with your actual domain
      : "http://localhost:3000"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/viewer/billing", "/sign-in/", "/sign-up/", "/_next/"],
      },
      // Note: We welcome AI crawlers to help users discover our service
      // through AI-powered search and recommendations
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

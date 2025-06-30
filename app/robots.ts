import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://bankstatementconverter.com" // Replace with your actual domain
      : "http://localhost:3000"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/viewer/billing", "/sign-in/", "/sign-up/", "/_next/"],
      },
      // Block AI crawlers from accessing financial data
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

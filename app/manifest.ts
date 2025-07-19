import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bank Statement Convert - PDF to Excel Converter",
    short_name: "BankStatementConverter",
    description:
      "Convert PDF bank statements to Excel instantly with AI-powered accuracy. Free online tool supporting 500+ banks worldwide.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait",
    scope: "/",
    categories: ["finance", "productivity", "business", "utilities"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Convert Statement",
        short_name: "Convert",
        description: "Upload and convert a bank statement",
        url: "/en/viewer",
        icons: [
          {
            src: "/shortcut-convert.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Pricing",
        short_name: "Pricing",
        description: "View pricing plans",
        url: "/en/pricing",
        icons: [
          {
            src: "/shortcut-pricing.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
    ],
  }
}

import { Checkout } from "@polar-sh/nextjs"

// Simple checkout handler using Polar's NextJS adapter with metadata support
export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/en/viewer/billing?success=true`,
})

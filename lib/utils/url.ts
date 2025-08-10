export function normalizeBaseUrl(input: string): string {
  let url = (input || "").trim()
  if (!url) return url
  // Ensure protocol
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  // Remove trailing slashes
  return url.replace(/\/+$/, "")
}

export function getNormalizedEnvSiteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return undefined
  return normalizeBaseUrl(raw)
}

import { notFound } from "next/navigation"

// Catch-all for any unmatched route under a locale.
// Ensures a 404 status is returned rather than a 200.
export default function LocaleCatchAllPage() {
  notFound()
}

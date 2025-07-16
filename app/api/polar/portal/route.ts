import { CustomerPortal } from "@polar-sh/nextjs"
import { auth } from "@clerk/nextjs/server"
import { getUserPolarCustomerId } from "@/lib/integrations/polar"
import { logger } from "@/lib/utils/logger"

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  getCustomerId: async () => {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("User not authenticated")
    }

    const customerId = await getUserPolarCustomerId(userId)

    if (!customerId) {
      logger.warn({ userId }, "No Polar customer ID found for user")
      throw new Error("No customer found")
    }

    return customerId
  },
})

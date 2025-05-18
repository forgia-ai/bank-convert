// app/(dashboard)/layout.tsx
import UserNavbar from "@/components/navigation/user-navbar"
import { PropsWithChildren } from "react"
import { Toaster } from "@/components/ui/sonner"

/**
 * Layout for all pages within the authenticated user dashboard.
 * It includes the UserNavbar and provides a consistent structure.
 */
export default function DashboardLayout({ children }: PropsWithChildren) {
  // Here you would typically add logic to ensure the user is authenticated.
  // For example, using Clerk's <Protect> component or a similar mechanism.
  // If not authenticated, you might redirect to a login page.
  // For now, we'll assume authentication is handled and proceed to show the layout.

  return (
    <div className="flex flex-col min-h-screen">
      <UserNavbar />
      <main className="flex-grow p-6 md:p-8">
        {/* Dashboard page content will be rendered here */}
        {children}
      </main>
      {/* Add a slim footer or specific dashboard footer if needed later */}
      <Toaster richColors closeButton />
    </div>
  )
}

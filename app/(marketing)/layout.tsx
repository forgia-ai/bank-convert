import MainNavbar from "@/components/navigation/main-navbar"
import Footer from "@/components/navigation/footer"
import TopAuthorityBar from "@/components/marketing/top-authority-bar"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopAuthorityBar />
      <MainNavbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {" "}
        {/* Added some basic content styling */}
        {children}
      </main>
      <Footer />
    </div>
  )
}

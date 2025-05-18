import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card" // Assuming Card components are available

export default function InteractiveHeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 grid gap-8 md:grid-cols-2 items-center">
        {/* Text Content */}
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
            Convert Bank Statements to Excel in Seconds
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Upload PDF or CSV, get structured data instantly. Free for up to 1 page per day!
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
            <Button size="lg" className="w-full sm:w-auto">
              Upload Statement & Convert
            </Button>
            {/* Optional: Secondary CTA, e.g., Learn More */}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Join 10,000+ happy users transforming their financial data.
          </p>
        </div>

        {/* Miniature Demo/Visual */}
        <div className="flex justify-center items-center">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-border">
                <p className="text-muted-foreground text-sm">Visual File Upload Zone</p>
              </div>
              <div className="text-2xl text-primary animate-bounce">➔</div>{" "}
              {/* Simple arrow, could be an icon */}
              <div className="w-full h-24 bg-muted rounded-md flex items-center justify-center border border-border">
                <p className="text-muted-foreground text-sm">Stylized Excel Icon / Data Snippet</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Simplified visual representation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

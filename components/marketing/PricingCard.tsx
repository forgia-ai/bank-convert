// components/marketing/pricing-card.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react" // Using an icon for features

interface PricingCardProps {
  planName: string
  price: string // e.g., "$0", "$8/month"
  priceFrequency?: string // e.g., "/month", "billed annually"
  description: string
  features: string[]
  ctaText: string
  isPopular?: boolean
  isLoading?: boolean
  className?: string
  onPlanSelect?: (planName: string) => void // Add click handler
}

export default function PricingCard({
  planName,
  price,
  priceFrequency,
  description,
  features,
  ctaText,
  isPopular = false,
  isLoading = false,
  className = "",
  onPlanSelect,
}: PricingCardProps) {
  return (
    <Card
      className={`flex flex-col ${isPopular ? "border-primary shadow-lg relative" : ""} ${className}`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <CardHeader className="items-center text-center pt-6">
        {" "}
        {/* Reduced padding top */}
        <CardTitle className="text-2xl font-bold">{planName}</CardTitle>
        <div className="mt-1">
          <span className="text-4xl font-extrabold">{price}</span>
          {priceFrequency && (
            <span className="text-sm text-muted-foreground ml-1">{priceFrequency}</span>
          )}
        </div>
        <CardDescription className="mt-2 h-10">{description}</CardDescription>{" "}
        {/* Reduced height and margin */}
      </CardHeader>
      <CardContent className="flex-grow">
        {" "}
        {/* flex-grow to push footer down */}
        <ul className="space-y-2 mb-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          size="lg"
          className="w-full cursor-pointer"
          variant={isPopular ? "default" : "outline"}
          disabled={isLoading}
          onClick={() => onPlanSelect?.(planName)}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            ctaText
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

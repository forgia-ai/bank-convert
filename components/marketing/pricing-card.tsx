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
import { CheckCircle2 } from "lucide-react" // Using an icon for features

interface PricingCardProps {
  planName: string
  price: string // e.g., "$0", "$8/month"
  priceFrequency?: string // e.g., "/month", "billed annually"
  description: string
  features: string[]
  ctaText: string
  isPopular?: boolean
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
      <CardHeader className="items-center text-center pt-8">
        {" "}
        {/* Added padding top */}
        <CardTitle className="text-2xl font-bold">{planName}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-extrabold">{price}</span>
          {priceFrequency && (
            <span className="text-sm text-muted-foreground ml-1">{priceFrequency}</span>
          )}
        </div>
        <CardDescription className="mt-3 h-12">{description}</CardDescription>{" "}
        {/* Set fixed height for description */}
      </CardHeader>
      <CardContent className="flex-grow">
        {" "}
        {/* flex-grow to push footer down */}
        <ul className="space-y-3 mb-6">
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
          onClick={() => onPlanSelect?.(planName)}
        >
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  )
}

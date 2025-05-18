// components/marketing/feature-card.tsx
import React from "react"

interface FeatureCardProps {
  icon: React.ReactNode // We'll pass simple SVG placeholders or text for now
  title: string
  description: string
  className?: string
}

export default function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`flex flex-col items-center p-6 text-center bg-card rounded-lg border shadow-sm ${className}`}
    >
      <div className="mb-4 text-primary text-4xl">
        {" "}
        {/* Increased size for icon placeholder */}
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

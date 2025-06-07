interface TopAuthorityBarProps {
  trustMessage: string
}

export default function TopAuthorityBar({ trustMessage }: TopAuthorityBarProps) {
  return (
    <div className="bg-primary text-primary-foreground py-2 text-center text-sm">
      <div className="container mx-auto px-4">
        {trustMessage}
        {/* Future: Add rotating messages or "As Seen On" logos */}
      </div>
    </div>
  )
}

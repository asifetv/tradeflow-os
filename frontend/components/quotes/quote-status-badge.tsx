import { QuoteStatus } from "@/lib/types/quote"
import { Badge } from "@/components/ui/badge"

interface QuoteStatusBadgeProps {
  status: QuoteStatus
}

const statusConfig: Record<QuoteStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  [QuoteStatus.DRAFT]: { label: "Draft", variant: "secondary" },
  [QuoteStatus.SENT]: { label: "Sent", variant: "default" },
  [QuoteStatus.ACCEPTED]: { label: "Accepted", variant: "default" },
  [QuoteStatus.REJECTED]: { label: "Rejected", variant: "destructive" },
  [QuoteStatus.EXPIRED]: { label: "Expired", variant: "outline" },
  [QuoteStatus.REVISED]: { label: "Revised", variant: "secondary" },
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

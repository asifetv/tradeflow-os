"use client"

import { useQuote } from "@/lib/hooks/use-quotes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { QuoteStatusBadge } from "./quote-status-badge"

interface QuoteCardProps {
  quoteId: string
}

export function QuoteCard({ quoteId }: QuoteCardProps) {
  const { data: quote, isLoading } = useQuote(quoteId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (!quote) {
    return <Card><CardContent className="pt-6">Quote not found</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{quote.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{quote.quote_number}</p>
          </div>
          <QuoteStatusBadge status={quote.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {quote.description && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-sm">{quote.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p className="text-sm font-semibold">{quote.currency} {quote.total_amount.toFixed(2)}</p>
          </div>
          {quote.validity_days && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valid For</p>
              <p className="text-sm">{quote.validity_days} days</p>
            </div>
          )}
        </div>

        {quote.line_items && quote.line_items.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Line Items ({quote.line_items.length})</p>
            <ul className="text-sm space-y-1">
              {quote.line_items.slice(0, 3).map((item, idx) => (
                <li key={idx} className="text-muted-foreground">
                  {item.quantity} {item.unit} of {item.description}
                </li>
              ))}
              {quote.line_items.length > 3 && (
                <li className="text-muted-foreground italic">
                  +{quote.line_items.length - 3} more items
                </li>
              )}
            </ul>
          </div>
        )}

        {quote.payment_terms && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
            <p className="text-sm">{quote.payment_terms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

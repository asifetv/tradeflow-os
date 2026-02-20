"use client"

import { useQuotes } from "@/lib/hooks/use-quotes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useState } from "react"

interface QuotesTableProps {
  customerId?: string | null
}

export function QuotesTable({ customerId }: QuotesTableProps) {
  const [page, setPage] = useState(0)
  const pageSize = 50
  const { data, isLoading } = useQuotes(page * pageSize, pageSize, customerId || undefined)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  const quotes = data?.quotes || []

  if (quotes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No quotes found</p>
        <Link href="/quotes/new">
          <Button>Create First Quote</Button>
        </Link>
      </div>
    )
  }

  const total = data?.total || 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{quote.quote_number}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{quote.title}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {quote.status.replace(/_/g, " ")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold">
                    {quote.currency} {quote.total_amount?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valid For</p>
                  <p className="font-semibold">{quote.validity_days} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-semibold text-sm">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/quotes/${quote.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link href={`/quotes/${quote.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Total: {total} quotes
      </div>
    </div>
  )
}

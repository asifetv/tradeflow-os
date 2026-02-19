"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { QuotesListResponse } from "@/lib/types/quote"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CustomerQuotesProps {
  customerId: string
}

export function CustomerQuotes({ customerId }: CustomerQuotesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-quotes", customerId],
    queryFn: async () => {
      const response = await axios.get<QuotesListResponse>(
        `${API_BASE_URL}/api/customers/${customerId}/quotes`,
        {
          headers: {
            "X-User-ID": "550e8400-e29b-41d4-a716-446655440000",
          },
        }
      )
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  const quotes = data?.quotes || []

  if (quotes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No quotes linked to this customer</p>
        <Link href="/quotes/new">
          <Button>Create Quote</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.id}>
          <CardHeader>
            <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{quote.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">
                  {quote.currency} {quote.total_amount?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
            <Link href={`/quotes/${quote.id}`}>
              <Button variant="outline" className="w-full">
                View Quote
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

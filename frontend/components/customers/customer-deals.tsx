"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DealsListResponse } from "@/lib/types/deal"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CustomerDealsProps {
  customerId: string
}

export function CustomerDeals({ customerId }: CustomerDealsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-deals", customerId],
    queryFn: async () => {
      const response = await axios.get<DealsListResponse>(
        `${API_BASE_URL}/api/customers/${customerId}/deals`,
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

  const deals = data?.deals || []

  if (deals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No deals linked to this customer</p>
        <Link href="/deals/new">
          <Button>Create Deal</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => (
        <Card key={deal.id}>
          <CardHeader>
            <CardTitle className="text-lg">{deal.deal_number}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{deal.status.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="font-semibold">
                  {deal.currency} {deal.total_value?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
            <Link href={`/deals/${deal.id}`}>
              <Button variant="outline" className="w-full">
                View Deal
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

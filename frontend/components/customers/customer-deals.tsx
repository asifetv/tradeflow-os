"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Deal } from "@/lib/types/deal"
import { dealApi } from "@/lib/api"

interface CustomerDealsProps {
  customerId: string
}

export function CustomerDeals({ customerId }: CustomerDealsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-deals", customerId],
    queryFn: async () => {
      // Fetch all deals and filter by customer_id
      const response = await dealApi.list({ customer_id: customerId, skip: 0, limit: 100 })
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

  const deals = (data?.items || data?.deals || []) as Deal[]

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

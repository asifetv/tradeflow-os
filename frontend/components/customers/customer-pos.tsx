"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerPOsListResponse } from "@/lib/types/customer-po"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CustomerPOsProps {
  customerId: string
}

export function CustomerPOs({ customerId }: CustomerPOsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-pos", customerId],
    queryFn: async () => {
      const response = await axios.get<CustomerPOsListResponse>(
        `${API_BASE_URL}/api/customers/${customerId}/pos`,
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

  const pos = data?.customer_pos || []

  if (pos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No purchase orders linked to this customer</p>
        <Link href="/customer-pos/new">
          <Button>Create PO</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pos.map((po) => (
        <Card key={po.id}>
          <CardHeader>
            <CardTitle className="text-lg">{po.po_number}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{po.status.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">
                  {po.currency} {po.total_amount?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
            <Link href={`/customer-pos/${po.id}`}>
              <Button variant="outline" className="w-full">
                View PO
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

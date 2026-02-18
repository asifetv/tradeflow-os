"use client"

import { useCustomer } from "@/lib/hooks/use-customers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface CustomerCardProps {
  customerId: string
}

export function CustomerCard({ customerId }: CustomerCardProps) {
  const { data: customer, isLoading } = useCustomer(customerId)

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

  if (!customer) {
    return <Card><CardContent className="pt-6">Customer not found</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{customer.company_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{customer.customer_code}</p>
          </div>
          <Badge variant={customer.is_active ? "default" : "secondary"}>
            {customer.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Country</p>
            <p className="text-sm">{customer.country}</p>
          </div>
          {customer.city && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p className="text-sm">{customer.city}</p>
            </div>
          )}
        </div>

        {customer.address && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="text-sm">{customer.address}</p>
          </div>
        )}

        {customer.primary_contact_name && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Primary Contact</p>
            <p className="text-sm">{customer.primary_contact_name}</p>
            {customer.primary_contact_email && (
              <p className="text-xs text-muted-foreground">{customer.primary_contact_email}</p>
            )}
            {customer.primary_contact_phone && (
              <p className="text-xs text-muted-foreground">{customer.primary_contact_phone}</p>
            )}
          </div>
        )}

        {customer.payment_terms && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
              <p className="text-sm">{customer.payment_terms}</p>
            </div>
          </div>
        )}

        {customer.credit_limit && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Credit Limit</p>
            <p className="text-sm">${customer.credit_limit.toFixed(2)}</p>
          </div>
        )}

        {customer.notes && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Notes</p>
            <p className="text-sm">{customer.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

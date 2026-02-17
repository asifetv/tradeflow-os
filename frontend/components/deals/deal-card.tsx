/**
 * Deal card component for Kanban board
 */

"use client"

import Link from "next/link"

import { Deal } from "@/lib/types/deal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"

interface DealCardProps {
  deal: Deal
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <Link href={`/deals/${deal.id}`}>
      <Card className="mb-3 cursor-pointer transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{deal.deal_number}</CardTitle>
              <CardDescription className="mt-1 truncate">{deal.customer_rfq_ref}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="line-clamp-2 text-sm text-gray-600">{deal.description}</p>
          <div className="flex items-center justify-between pt-2">
            <div>
              {deal.total_value !== null && (
                <p className="text-sm font-semibold text-gray-900">
                  {deal.currency} {deal.total_value.toLocaleString()}
                </p>
              )}
              {deal.line_items.length > 0 && (
                <p className="text-xs text-gray-500">{deal.line_items.length} items</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

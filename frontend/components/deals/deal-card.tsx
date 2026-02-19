/**
 * Deal card component for Kanban board
 */

"use client"

import Link from "next/link"
import { Deal } from "@/lib/types/deal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DealCardProps {
  deal: Deal
}

export function DealCard({ deal }: DealCardProps) {
  const daysInStage = Math.floor(
    (new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const margin = deal.estimated_margin_pct ?? 0
  const marginColor = margin >= 20 ? "text-green-600" : margin >= 10 ? "text-amber-600" : "text-red-600"
  const marginBg = margin >= 20 ? "bg-green-50" : margin >= 10 ? "bg-amber-50" : "bg-red-50"

  return (
    <Link href={`/deals/${deal.id}`}>
      <Card className="mb-3 cursor-pointer transition-all hover:shadow-lg hover:border-purple-300 border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-bold text-gray-900 truncate">
                {deal.deal_number}
              </CardTitle>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {deal.customer_rfq_ref || "No RFQ ref"}
              </p>
            </div>
            {margin !== 0 && (
              <div className={`px-2 py-1 rounded text-xs font-semibold ${marginColor} ${marginBg}`}>
                {margin.toFixed(1)}%
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="line-clamp-2 text-xs text-gray-600 leading-tight">
            {deal.description}
          </p>

          {/* Value and Items */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              {deal.total_value !== null && (
                <p className="font-semibold text-gray-900">
                  {deal.currency} {(deal.total_value / 1000).toFixed(0)}K
                </p>
              )}
              {deal.line_items.length > 0 && (
                <p className="text-gray-500">{deal.line_items.length} items</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-700">{daysInStage}d</p>
              <p className="text-gray-500">in stage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

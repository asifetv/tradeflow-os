/**
 * Kanban board view for deals
 */

"use client"

import { Deal, DealStatus } from "@/lib/types/deal"
import { DealCard } from "./deal-card"

const STATUS_ORDER = [
  DealStatus.RFQ_RECEIVED,
  DealStatus.SOURCING,
  DealStatus.QUOTED,
  DealStatus.PO_RECEIVED,
  DealStatus.ORDERED,
  DealStatus.IN_PRODUCTION,
  DealStatus.SHIPPED,
  DealStatus.DELIVERED,
  DealStatus.INVOICED,
  DealStatus.PAID,
  DealStatus.CLOSED,
  DealStatus.CANCELLED,
]

const STATUS_LABELS: Record<DealStatus, string> = {
  [DealStatus.RFQ_RECEIVED]: "RFQ Received",
  [DealStatus.SOURCING]: "Sourcing",
  [DealStatus.QUOTED]: "Quoted",
  [DealStatus.PO_RECEIVED]: "PO Received",
  [DealStatus.ORDERED]: "Ordered",
  [DealStatus.IN_PRODUCTION]: "In Production",
  [DealStatus.SHIPPED]: "Shipped",
  [DealStatus.DELIVERED]: "Delivered",
  [DealStatus.INVOICED]: "Invoiced",
  [DealStatus.PAID]: "Paid",
  [DealStatus.CLOSED]: "Closed",
  [DealStatus.CANCELLED]: "Cancelled",
}

interface KanbanBoardProps {
  deals: Deal[]
  isLoading?: boolean
}

export function KanbanBoard({ deals, isLoading }: KanbanBoardProps) {
  // Group deals by status
  const dealsByStatus: Record<DealStatus, Deal[]> = {} as any

  STATUS_ORDER.forEach((status) => {
    dealsByStatus[status] = deals.filter((deal) => deal.status === status)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-full">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">
                {STATUS_LABELS[status]}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {dealsByStatus[status].length} {dealsByStatus[status].length === 1 ? "deal" : "deals"}
              </p>
            </div>
            <div className="space-y-2">
              {dealsByStatus[status].map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

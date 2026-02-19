/**
 * Enhanced Kanban board view for deals with metrics and color coding
 */

"use client"

import { Deal, DealStatus } from "@/lib/types/deal"
import { DealCard } from "./deal-card"
import { TrendingUp } from "lucide-react"

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

const STATUS_COLORS: Record<DealStatus, { bg: string; border: string; header: string; badge: string }> = {
  [DealStatus.RFQ_RECEIVED]: { bg: "bg-blue-50", border: "border-blue-200", header: "bg-blue-100", badge: "bg-blue-200 text-blue-800" },
  [DealStatus.SOURCING]: { bg: "bg-cyan-50", border: "border-cyan-200", header: "bg-cyan-100", badge: "bg-cyan-200 text-cyan-800" },
  [DealStatus.QUOTED]: { bg: "bg-indigo-50", border: "border-indigo-200", header: "bg-indigo-100", badge: "bg-indigo-200 text-indigo-800" },
  [DealStatus.PO_RECEIVED]: { bg: "bg-purple-50", border: "border-purple-200", header: "bg-purple-100", badge: "bg-purple-200 text-purple-800" },
  [DealStatus.ORDERED]: { bg: "bg-pink-50", border: "border-pink-200", header: "bg-pink-100", badge: "bg-pink-200 text-pink-800" },
  [DealStatus.IN_PRODUCTION]: { bg: "bg-orange-50", border: "border-orange-200", header: "bg-orange-100", badge: "bg-orange-200 text-orange-800" },
  [DealStatus.SHIPPED]: { bg: "bg-amber-50", border: "border-amber-200", header: "bg-amber-100", badge: "bg-amber-200 text-amber-800" },
  [DealStatus.DELIVERED]: { bg: "bg-yellow-50", border: "border-yellow-200", header: "bg-yellow-100", badge: "bg-yellow-200 text-yellow-800" },
  [DealStatus.INVOICED]: { bg: "bg-lime-50", border: "border-lime-200", header: "bg-lime-100", badge: "bg-lime-200 text-lime-800" },
  [DealStatus.PAID]: { bg: "bg-green-50", border: "border-green-200", header: "bg-green-100", badge: "bg-green-200 text-green-800" },
  [DealStatus.CLOSED]: { bg: "bg-emerald-50", border: "border-emerald-200", header: "bg-emerald-100", badge: "bg-emerald-200 text-emerald-800" },
  [DealStatus.CANCELLED]: { bg: "bg-gray-50", border: "border-gray-200", header: "bg-gray-100", badge: "bg-gray-200 text-gray-800" },
}

interface KanbanBoardProps {
  deals: Deal[]
  isLoading?: boolean
  visibleStatuses?: DealStatus[]
}

export function KanbanBoard({ deals, isLoading, visibleStatuses }: KanbanBoardProps) {
  // Use all statuses by default if not specified
  const statusesToShow = visibleStatuses || STATUS_ORDER
  // Group deals by status
  const dealsByStatus: Record<DealStatus, Deal[]> = {} as any

  STATUS_ORDER.forEach((status) => {
    dealsByStatus[status] = deals.filter((deal) => deal.status === status)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="pb-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statusesToShow.map((status) => {
          const statusDeals = dealsByStatus[status]
          const totalValue = statusDeals.reduce((sum, deal) => sum + (deal.total_value || 0), 0)
          const avgValue = statusDeals.length > 0 ? totalValue / statusDeals.length : 0
          const colors = STATUS_COLORS[status]

          return (
            <div
              key={status}
              className={`${colors.bg} rounded-xl p-4 border-2 ${colors.border} shadow-sm hover:shadow-md transition-shadow flex flex-col`}
            >
              {/* Column Header */}
              <div className={`${colors.header} -mx-4 -mt-4 px-4 py-3 mb-4 rounded-t-lg border-b ${colors.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {STATUS_LABELS[status]}
                  </h3>
                  <span className={`${colors.badge} text-xs font-semibold px-2 py-1 rounded-full`}>
                    {statusDeals.length}
                  </span>
                </div>

                {/* Metrics */}
                {statusDeals.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">Total Value</p>
                      <p className="font-semibold text-gray-900">
                        ${(totalValue / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Value</p>
                      <p className="font-semibold text-gray-900">
                        ${(avgValue / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cards Container */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                {statusDeals.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs text-gray-400 text-center">No deals</p>
                  </div>
                ) : (
                  statusDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

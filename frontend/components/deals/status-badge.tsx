/**
 * Status badge component with color coding
 */

import { DealStatus } from "@/lib/types/deal"
import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: DealStatus
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const statusColorMap: Record<DealStatus, string> = {
  [DealStatus.RFQ_RECEIVED]: "bg-blue-100 text-blue-800",
  [DealStatus.SOURCING]: "bg-cyan-100 text-cyan-800",
  [DealStatus.QUOTED]: "bg-purple-100 text-purple-800",
  [DealStatus.PO_RECEIVED]: "bg-yellow-100 text-yellow-800",
  [DealStatus.ORDERED]: "bg-orange-100 text-orange-800",
  [DealStatus.IN_PRODUCTION]: "bg-red-100 text-red-800",
  [DealStatus.SHIPPED]: "bg-pink-100 text-pink-800",
  [DealStatus.DELIVERED]: "bg-green-100 text-green-800",
  [DealStatus.INVOICED]: "bg-teal-100 text-teal-800",
  [DealStatus.PAID]: "bg-emerald-100 text-emerald-800",
  [DealStatus.CLOSED]: "bg-gray-100 text-gray-800",
  [DealStatus.CANCELLED]: "bg-slate-100 text-slate-800",
}

const statusLabelMap: Record<DealStatus, string> = {
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

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColorMap[status]}`}>
      {statusLabelMap[status]}
    </div>
  )
}

/**
 * Stage Visibility Toggle - Allow users to show/hide deal stages
 */

"use client"

import { useState, useEffect } from "react"
import { DealStatus } from "@/lib/types/deal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface StageVisibilityToggleProps {
  visibleStatuses: DealStatus[]
  onVisibilityChange: (statuses: DealStatus[]) => void
}

export function StageVisibilityToggle({
  visibleStatuses,
  onVisibilityChange,
}: StageVisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hiddenCount = STATUS_ORDER.length - visibleStatuses.length

  const handleToggleStage = (status: DealStatus) => {
    if (visibleStatuses.includes(status)) {
      onVisibilityChange(visibleStatuses.filter((s) => s !== status))
    } else {
      onVisibilityChange([...visibleStatuses, status])
    }
  }

  const handleShowAll = () => {
    onVisibilityChange(STATUS_ORDER)
  }

  const handleHideCompleted = () => {
    const active = [
      DealStatus.RFQ_RECEIVED,
      DealStatus.SOURCING,
      DealStatus.QUOTED,
      DealStatus.PO_RECEIVED,
      DealStatus.ORDERED,
      DealStatus.IN_PRODUCTION,
    ]
    onVisibilityChange(active)
  }

  const handleShowActive = () => {
    const active = [
      DealStatus.RFQ_RECEIVED,
      DealStatus.SOURCING,
      DealStatus.QUOTED,
      DealStatus.PO_RECEIVED,
      DealStatus.ORDERED,
      DealStatus.IN_PRODUCTION,
      DealStatus.SHIPPED,
      DealStatus.DELIVERED,
      DealStatus.INVOICED,
    ]
    onVisibilityChange(active)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          {hiddenCount > 0 ? (
            <>
              <Eye className="h-4 w-4" />
              {visibleStatuses.length}/{STATUS_ORDER.length} Stages
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              All Stages
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pipeline Stages</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShowAll} className="text-xs flex-1">
              Show All
            </Button>
            <Button variant="outline" size="sm" onClick={handleShowActive} className="text-xs flex-1">
              Active Only
            </Button>
            <Button variant="outline" size="sm" onClick={handleHideCompleted} className="text-xs flex-1">
              In Progress
            </Button>
          </div>

          {/* Stage List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-50">
                <Checkbox
                  checked={visibleStatuses.includes(status)}
                  onCheckedChange={() => handleToggleStage(status)}
                  id={status}
                />
                <label
                  htmlFor={status}
                  className="flex-1 text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {STATUS_LABELS[status]}
                </label>
                {visibleStatuses.includes(status) ? (
                  <Eye className="h-4 w-4 text-blue-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-300" />
                )}
              </div>
            ))}
          </div>

          {/* Info Text */}
          <p className="text-xs text-slate-500 text-center">
            Showing {visibleStatuses.length} of {STATUS_ORDER.length} stages
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

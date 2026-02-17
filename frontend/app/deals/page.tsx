/**
 * Deals list page with Kanban and table views
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutGrid, LayoutList } from "lucide-react"

import { DealStatus } from "@/lib/types/deal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KanbanBoard } from "@/components/deals/kanban-board"
import { DealsTable } from "@/components/deals/deals-table"
import { useDeals } from "@/lib/hooks/use-deals"

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")
  const [status, setStatus] = useState<DealStatus | undefined>()
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading } = useDeals(page * limit, limit, status)

  const statuses: DealStatus[] = [
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals Pipeline</h1>
          <p className="text-gray-600 mt-1">Manage your deal lifecycle</p>
        </div>
        <Link href="/deals/new">
          <Button>+ New Deal</Button>
        </Link>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="w-4 h-4 mr-2" />
              Table
            </Button>
          </div>

          {/* Status Filter */}
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">Filter by status:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={status === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatus(undefined)
                  setPage(0)
                }}
              >
                All
              </Button>
              {statuses.map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatus(s)
                    setPage(0)
                  }}
                >
                  {s.replace(/_/g, " ").toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Content */}
      <div>
        {viewMode === "kanban" ? (
          <KanbanBoard deals={data?.deals || []} isLoading={isLoading} />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <DealsTable deals={data?.deals || []} isLoading={isLoading} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination for table view */}
      {viewMode === "table" && data && data.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of{" "}
            {data.total} deals
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={(page + 1) * limit >= data.total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

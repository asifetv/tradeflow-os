/**
 * Deals list page with Kanban and table views
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LayoutGrid, LayoutList, Plus } from "lucide-react"

import { DealStatus } from "@/lib/types/deal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KanbanBoard } from "@/components/deals/kanban-board"
import { DealsTable } from "@/components/deals/deals-table"
import { PipelineDashboard } from "@/components/deals/pipeline-dashboard"
import { StageVisibilityToggle } from "@/components/deals/stage-visibility-toggle"
import { useDeals } from "@/lib/hooks/use-deals"
import { TopNav } from "@/components/navigation/top-nav"

const DEFAULT_VISIBLE_STATUSES = [
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

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")
  const [page, setPage] = useState(0)
  const [visibleStatuses, setVisibleStatuses] = useState<DealStatus[]>(DEFAULT_VISIBLE_STATUSES)
  const limit = 50

  // Load visible stages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dealStageVisibility")
    if (saved) {
      try {
        setVisibleStatuses(JSON.parse(saved))
      } catch {
        setVisibleStatuses(DEFAULT_VISIBLE_STATUSES)
      }
    }
  }, [])

  // Save visible stages to localStorage
  const handleVisibilityChange = (statuses: DealStatus[]) => {
    setVisibleStatuses(statuses)
    localStorage.setItem("dealStageVisibility", JSON.stringify(statuses))
  }

  const { data, isLoading } = useDeals(page * limit, limit)

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                Deals Pipeline
              </h1>
              <p className="text-muted-foreground mt-2">Manage your deal lifecycle</p>
            </div>
            <Link href="/deals/new">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4" />
                New Deal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Pipeline Dashboard */}
        <PipelineDashboard deals={data?.deals || []} isLoading={isLoading} />

        {/* Controls */}
        <Card className="bg-card border border-border shadow-sm">
          <CardContent className="pt-6 space-y-4">
            {/* View Mode Toggle and Stage Controls */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">View:</span>
                <Button
                  variant={viewMode === "kanban" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className="gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="gap-2"
                >
                  <LayoutList className="w-4 h-4" />
                  Table
                </Button>
              </div>
              {viewMode === "kanban" && (
                <StageVisibilityToggle
                  visibleStatuses={visibleStatuses}
                  onVisibilityChange={handleVisibilityChange}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Content */}
        <div>
          {viewMode === "kanban" ? (
            <KanbanBoard
              deals={data?.deals || []}
              isLoading={isLoading}
              visibleStatuses={visibleStatuses}
            />
          ) : (
            <Card className="bg-card border border-border shadow-sm">
              <CardContent className="pt-6">
                <DealsTable deals={data?.deals || []} isLoading={isLoading} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination for table view */}
        {viewMode === "table" && data && data.total > limit && (
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
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
    </div>
  )
}

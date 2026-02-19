/**
 * Pipeline Dashboard - Overview metrics for deal pipeline
 */

"use client"

import { Deal, DealStatus } from "@/lib/types/deal"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, TrendingUp, DollarSign, Target } from "lucide-react"

interface PipelineDashboardProps {
  deals: Deal[]
  isLoading?: boolean
}

export function PipelineDashboard({ deals, isLoading }: PipelineDashboardProps) {
  // Calculate metrics
  const totalValue = deals.reduce((sum, deal) => sum + (deal.total_value || 0), 0)
  const avgDealValue = deals.length > 0 ? totalValue / deals.length : 0
  const closedDeals = deals.filter((deal) => deal.status === DealStatus.CLOSED).length
  const closedValue = deals
    .filter((deal) => deal.status === DealStatus.CLOSED)
    .reduce((sum, deal) => sum + (deal.total_value || 0), 0)

  const winRate = deals.length > 0 ? ((closedDeals / deals.length) * 100).toFixed(1) : "0"
  const avgMargin =
    deals.length > 0
      ? (deals.reduce((sum, deal) => sum + (deal.estimated_margin_pct || 0), 0) / deals.length).toFixed(1)
      : "0"

  // Get deals by stage counts
  const rfqCount = deals.filter((d) => d.status === DealStatus.RFQ_RECEIVED).length
  const quotedCount = deals.filter((d) => d.status === DealStatus.QUOTED).length
  const poReceivedCount = deals.filter((d) => d.status === DealStatus.PO_RECEIVED).length
  const orderedCount = deals.filter((d) => d.status === DealStatus.ORDERED).length

  const metrics = [
    {
      label: "Total Pipeline Value",
      value: `$${(totalValue / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "from-blue-500 to-blue-600",
      lightColor: "bg-blue-50",
    },
    {
      label: "Total Deals",
      value: deals.length.toString(),
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      lightColor: "bg-purple-50",
    },
    {
      label: "Avg Deal Size",
      value: `$${(avgDealValue / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      lightColor: "bg-green-50",
    },
    {
      label: "Win Rate",
      value: `${winRate}%`,
      icon: Target,
      color: "from-orange-500 to-orange-600",
      lightColor: "bg-orange-50",
    },
  ]

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading pipeline data...</div>
  }

  return (
    <div className="space-y-4">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{metric.label}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r {metric.color} bg-clip-text text-transparent">
                      {metric.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.lightColor}`}>
                    <Icon className={`h-6 w-6 bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pipeline Funnel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Pipeline Stages</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">🎯 RFQ Received</span>
                <span className="font-semibold text-slate-900">{rfqCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">📋 Quoted</span>
                <span className="font-semibold text-slate-900">{quotedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">📦 PO Received</span>
                <span className="font-semibold text-slate-900">{poReceivedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">✅ Ordered</span>
                <span className="font-semibold text-slate-900">{orderedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Closed Deals</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-slate-600">Total Closed</p>
                <p className="text-3xl font-bold text-emerald-600">{closedDeals}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mt-3">Closed Value</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${(closedValue / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Performance</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-slate-600">Avg Margin</p>
                <p className="text-3xl font-bold text-blue-600">{avgMargin}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mt-3">Active Deals</p>
                <p className="text-2xl font-bold text-purple-600">
                  {deals.filter((d) => d.status !== DealStatus.CLOSED && d.status !== DealStatus.CANCELLED)
                    .length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

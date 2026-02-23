/**
 * Deal detail page with tabs
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Download, MoreVertical } from "lucide-react"

import { Deal, DealStatus } from "@/lib/types/deal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/deals/status-badge"
import { ActivityTimeline } from "@/components/deals/activity-timeline"
import { ProposalList } from "@/components/proposals/proposal-list"
import { DocumentUpload } from "@/components/documents/document-upload"
import { DocumentList } from "@/components/documents/document-list"
import { useDeal, useDealActivity, useDeleteDeal, useUpdateDealStatus } from "@/lib/hooks/use-deals"
import { useCustomer } from "@/lib/hooks/use-customers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DealStatus as DealStatusEnum } from "@/lib/types/deal"
import { DocumentCategory } from "@/lib/types/document"
import { format } from "date-fns"

const VALID_STATUS_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  [DealStatusEnum.RFQ_RECEIVED]: [
    DealStatusEnum.SOURCING,
    DealStatusEnum.QUOTED,
    DealStatusEnum.CANCELLED,
  ],
  [DealStatusEnum.SOURCING]: [DealStatusEnum.QUOTED, DealStatusEnum.CANCELLED],
  [DealStatusEnum.QUOTED]: [
    DealStatusEnum.PO_RECEIVED,
    DealStatusEnum.SOURCING,
    DealStatusEnum.CANCELLED,
  ],
  [DealStatusEnum.PO_RECEIVED]: [DealStatusEnum.ORDERED, DealStatusEnum.CANCELLED],
  [DealStatusEnum.ORDERED]: [DealStatusEnum.IN_PRODUCTION, DealStatusEnum.CANCELLED],
  [DealStatusEnum.IN_PRODUCTION]: [DealStatusEnum.SHIPPED, DealStatusEnum.CANCELLED],
  [DealStatusEnum.SHIPPED]: [DealStatusEnum.DELIVERED, DealStatusEnum.CANCELLED],
  [DealStatusEnum.DELIVERED]: [DealStatusEnum.INVOICED, DealStatusEnum.CANCELLED],
  [DealStatusEnum.INVOICED]: [DealStatusEnum.PAID, DealStatusEnum.CANCELLED],
  [DealStatusEnum.PAID]: [DealStatusEnum.CLOSED],
  [DealStatusEnum.CLOSED]: [],
  [DealStatusEnum.CANCELLED]: [],
}

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: deal, isLoading: isDealLoading } = useDeal(dealId)
  const { data: activityData, isLoading: isActivityLoading } = useDealActivity(dealId)
  const { data: customer } = useCustomer(deal?.customer_id || "")
  const deleteMutation = useDeleteDeal()
  const updateStatusMutation = useUpdateDealStatus(dealId)

  const handleDelete = async () => {
    try {
      console.log("Starting delete for deal:", dealId)
      await deleteMutation.mutateAsync(dealId)
      console.log("Delete completed, navigating to deals list")
      setShowDeleteDialog(false)
      router.push("/deals")
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const handleStatusChange = async (newStatus: DealStatus) => {
    await updateStatusMutation.mutateAsync({ status: newStatus })
  }

  if (isDealLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (!deal) {
    return (
      <>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Deal not found</h2>
            <Link href="/deals">
              <Button variant="outline">Back to Deals</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const validTransitions = VALID_STATUS_TRANSITIONS[deal.status] || []

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/deals">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{deal.deal_number}</h1>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={deal.status} />
                <p className="text-gray-600 text-sm">
                  {deal.customer_rfq_ref && `RFQ: ${deal.customer_rfq_ref}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/deals/${dealId}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Deal</DialogTitle>
                </DialogHeader>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this deal? This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

      {/* Status Management */}
      {validTransitions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Change Status</p>
                <p className="text-xs text-gray-500 mt-1">
                  {validTransitions.length} valid transition{validTransitions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {validTransitions.map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                  >
                    {status.replace(/_/g, " ").toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="line-items">Line Items ({deal.line_items.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{deal.description}</p>
              </CardContent>
            </Card>

            {/* Customer Info */}
            {deal.customer_id && customer ? (
              <Link href={`/customers/${deal.customer_id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Customer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                      {customer.company_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{customer.customer_code}</p>
                    {customer.primary_contact_name && (
                      <p className="text-sm text-gray-600 mt-2">{customer.primary_contact_name}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ) : deal.customer_id ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Loading customer...</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">No customer assigned</p>
                </CardContent>
              </Card>
            )}

            {/* Created Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Created</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">
                    {format(new Date(deal.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Updated Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {format(new Date(deal.updated_at), "MMM d, yyyy HH:mm")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-transparent border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900">
                  {deal.total_value !== null
                    ? `${deal.currency} ${deal.total_value.toLocaleString()}`
                    : "-"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-transparent border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900">
                  {deal.total_cost !== null
                    ? `${deal.currency} ${deal.total_cost.toLocaleString()}`
                    : "-"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-transparent border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Est. Margin %</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900">
                  {deal.estimated_margin_pct !== null ? `${deal.estimated_margin_pct.toFixed(2)}%` : "-"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-transparent border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Act. Margin %</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900">
                  {deal.actual_margin_pct !== null ? `${deal.actual_margin_pct.toFixed(2)}%` : "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          {deal.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{deal.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Line Items Tab */}
        <TabsContent value="line-items">
          {deal.line_items.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No line items added
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {deal.line_items.map((item, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-b-0">
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Description</p>
                          <p className="font-semibold">{item.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Material Spec</p>
                          <p className="font-semibold">{item.material_spec}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="text-sm">{item.quantity} {item.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Required Delivery</p>
                          <p className="text-sm">{item.required_delivery_date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <ActivityTimeline
                activityLogs={activityData?.activity_logs || []}
                isLoading={isActivityLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <ProposalList dealId={dealId} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <DocumentUpload
            category={DocumentCategory.RFQ}
            entityType="Deal"
            entityId={dealId}
            onUploadSuccess={() => {
              // List will auto-refresh via React Query
            }}
          />
          <DocumentList
            entityType="Deal"
            entityId={dealId}
            category={DocumentCategory.RFQ}
          />
        </TabsContent>
      </Tabs>
    </div>
  </>
  )
}

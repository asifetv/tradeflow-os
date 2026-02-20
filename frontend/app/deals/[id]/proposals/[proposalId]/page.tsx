"use client"

import { useParams, useRouter } from "next/navigation"
import { useVendorProposal, useUpdateVendorProposal } from "@/lib/hooks/use-vendor-proposals"
import { useDeal } from "@/lib/hooks/use-deals"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
  const proposalId = params.proposalId as string

  const { data: proposal, isLoading } = useVendorProposal(proposalId)
  const { data: deal } = useDeal(dealId)
  const updateProposal = useUpdateVendorProposal(proposalId)

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProposal.mutateAsync({
        status: newStatus as any,
      })
      toast.success(`✅ Proposal marked as ${newStatus}`)
      router.push(`/deals/${dealId}?tab=proposals`)
    } catch (error) {
      toast.error("Failed to update proposal")
      console.error(error)
    }
  }

  if (isLoading) return <div className="py-8 text-center">Loading proposal...</div>
  if (!proposal) {
    return (
      <div className="space-y-4">
        <Link href={`/deals/${dealId}?tab=proposals`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Proposals
          </Button>
        </Link>
        <div className="text-center py-8 text-red-600">Proposal not found</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-blue-50"
      case "received":
        return "bg-green-50"
      case "selected":
        return "bg-green-100"
      case "rejected":
        return "bg-red-50"
      default:
        return "bg-gray-50"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline">Requested</Badge>
      case "received":
        return <Badge variant="secondary">Received</Badge>
      case "selected":
        return <Badge className="bg-green-600">Selected</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/deals/${dealId}?tab=proposals`}>
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Proposals
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Proposal Details</h1>
      </div>

      {/* Proposal Status Card */}
      <Card className={getStatusColor(proposal.status)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{proposal.vendor?.company_name || "Unknown Vendor"}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{proposal.vendor?.vendor_code}</p>
            </div>
            {getStatusBadge(proposal.status)}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Proposal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="text-lg font-semibold">
                {proposal.total_price ? `${proposal.total_price} ${proposal.currency}` : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Lead Time</p>
              <p className="text-lg font-semibold">
                {proposal.lead_time_days ? `${proposal.lead_time_days} days` : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Payment Terms</p>
              <p className="text-lg font-semibold">{proposal.payment_terms || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Validity Date</p>
              <p className="text-lg font-semibold">
                {proposal.validity_date ? format(new Date(proposal.validity_date), "MMM dd, yyyy") : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendor Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Credibility Score</p>
              <p className="text-lg font-semibold">{proposal.vendor?.credibility_score || "-"}/100</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Quality Score</p>
              <p className="text-lg font-semibold">{proposal.vendor?.quality_score || "-"}/100</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">On-Time Delivery</p>
              <p className="text-lg font-semibold">
                {proposal.vendor?.on_time_delivery_rate
                  ? `${(proposal.vendor.on_time_delivery_rate * 100).toFixed(0)}%`
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Country</p>
              <p className="text-lg font-semibold">{proposal.vendor?.country || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        {proposal.vendor && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposal.vendor.primary_contact_name && (
                <div>
                  <p className="text-sm text-gray-600">Contact Name</p>
                  <p className="font-semibold">{proposal.vendor.primary_contact_name}</p>
                </div>
              )}

              {proposal.vendor.primary_contact_email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a
                    href={`mailto:${proposal.vendor.primary_contact_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {proposal.vendor.primary_contact_email}
                  </a>
                </div>
              )}

              {proposal.vendor.primary_contact_phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{proposal.vendor.primary_contact_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Specs Match */}
        {proposal.specs_match !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Specifications Match</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {proposal.specs_match ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-green-600">Specs Match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <span className="font-semibold text-red-600">Specs Don't Match</span>
                  </>
                )}
              </div>

              {proposal.discrepancies && Object.keys(proposal.discrepancies).length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-semibold mb-2">Discrepancies:</p>
                  <ul className="text-sm space-y-1">
                    {Object.entries(proposal.discrepancies).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {proposal.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {proposal.status === "requested" && (
          <Button
            onClick={() => handleStatusChange("received")}
            disabled={updateProposal.isPending}
            className="gap-2"
          >
            {updateProposal.isPending ? "Updating..." : "Mark as Received"}
          </Button>
        )}

        {proposal.status === "received" && (
          <>
            <Button
              onClick={() => handleStatusChange("selected")}
              disabled={updateProposal.isPending}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {updateProposal.isPending ? "Updating..." : "✅ Select This Vendor"}
            </Button>
            <Button
              onClick={() => handleStatusChange("rejected")}
              disabled={updateProposal.isPending}
              variant="destructive"
              className="gap-2"
            >
              {updateProposal.isPending ? "Updating..." : "❌ Reject"}
            </Button>
          </>
        )}

        <Link href={`/deals/${dealId}?tab=proposals`}>
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    </div>
  )
}

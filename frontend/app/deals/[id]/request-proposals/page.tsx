"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useVendors } from "@/lib/hooks/use-vendors"
import { useCreateVendorProposal } from "@/lib/hooks/use-vendor-proposals"
import { useDeal } from "@/lib/hooks/use-deals"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Mail, MapPin, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function RequestProposalsPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string

  const { data: deal } = useDeal(dealId)
  const { data: vendorsData, isLoading: isVendorsLoading } = useVendors(0, 100)
  const createProposal = useCreateVendorProposal()

  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVendorToggle = (vendorId: string) => {
    const newSelected = new Set(selectedVendorIds)
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId)
    } else {
      newSelected.add(vendorId)
    }
    setSelectedVendorIds(newSelected)
  }

  const handleRequestProposals = async () => {
    if (selectedVendorIds.size === 0) {
      toast.error("Please select at least one vendor")
      return
    }

    setIsSubmitting(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const vendorId of selectedVendorIds) {
        try {
          await createProposal.mutateAsync({
            deal_id: dealId,
            vendor_id: vendorId,
            status: "requested",
            currency: "AED",
          })
          successCount++
        } catch (error) {
          failCount++
          console.error(`Failed to request proposal from vendor ${vendorId}:`, error)
        }
      }

      if (successCount > 0) {
        toast.success(
          `✅ Proposals requested from ${successCount} vendor${successCount !== 1 ? "s" : ""}!`,
          {
            description: "Vendors will receive your request shortly",
            duration: 5000,
          }
        )
      }

      if (failCount > 0) {
        toast.error(`⚠️ Failed to request from ${failCount} vendor${failCount !== 1 ? "s" : ""}`)
      }

      if (successCount > 0) {
        router.push(`/deals/${dealId}?tab=proposals`)
      }
    } catch (error) {
      console.error("Error requesting proposals:", error)
      toast.error("Failed to request proposals")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!deal) return <div className="py-8 text-center">Loading deal...</div>
  if (isVendorsLoading) return <div className="py-8 text-center">Loading vendors...</div>
  if (!vendorsData?.items?.length) {
    return (
      <div className="space-y-4">
        <Link href={`/deals/${dealId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Deal
          </Button>
        </Link>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">No vendors available. Please create vendors first.</p>
            <Link href="/vendors/new">
              <Button>Create Vendor</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/deals/${dealId}`}>
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Deal
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Request Proposals</h1>
        <p className="text-gray-600 mt-2">
          Select vendors to request proposals for <span className="font-semibold">{deal.deal_number}</span>
        </p>
      </div>

      {/* Deal Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deal Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Deal Number</p>
            <p className="font-semibold">{deal.deal_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p className="text-sm">{deal.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Select Vendors ({selectedVendorIds.size} selected)
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {vendorsData.items.map((vendor) => (
            <Card
              key={vendor.id}
              onClick={() => handleVendorToggle(vendor.id)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedVendorIds.has(vendor.id)}
                    onCheckedChange={() => handleVendorToggle(vendor.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{vendor.company_name}</h3>
                        <p className="text-xs text-gray-600">{vendor.vendor_code}</p>
                      </div>
                      {vendor.is_active ? (
                        <Badge variant="outline" className="bg-green-50">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    {/* Vendor Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Credibility</p>
                        <p className="font-semibold">{vendor.credibility_score}/100</p>
                      </div>

                      <div>
                        <p className="text-gray-600">Lead Time</p>
                        <p className="font-semibold">
                          {vendor.avg_lead_time_days ? `${vendor.avg_lead_time_days} days` : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-600">Quality Score</p>
                        <p className="font-semibold">
                          {vendor.quality_score ? `${vendor.quality_score}/100` : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-600">On-Time %</p>
                        <p className="font-semibold">
                          {vendor.on_time_delivery_rate ? `${(vendor.on_time_delivery_rate * 100).toFixed(0)}%` : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {vendor.country}
                      </div>
                      {vendor.primary_contact_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {vendor.primary_contact_email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleRequestProposals}
          disabled={selectedVendorIds.size === 0 || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? "Sending..." : `Send to ${selectedVendorIds.size} vendor${selectedVendorIds.size !== 1 ? "s" : ""}`}
          {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
        </Button>
        <Link href={`/deals/${dealId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
    </div>
  )
}

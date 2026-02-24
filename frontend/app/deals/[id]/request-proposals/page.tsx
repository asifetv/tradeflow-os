"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search, Filter, CheckCircle2, Loader2 } from "lucide-react"

import { useVendorsAdvancedSearch } from "@/lib/hooks/use-vendors"
import { useCreateVendorProposal } from "@/lib/hooks/use-vendor-proposals"
import { useDeal } from "@/lib/hooks/use-deals"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface SearchFilters {
  q?: string
  min_credibility?: number
  max_credibility?: number
  country?: string
  category?: string
  certification?: string
}

export default function RequestProposalsPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string

  const { data: deal } = useDeal(dealId)
  const createProposal = useCreateVendorProposal()

  const [filters, setFilters] = useState<SearchFilters>({})
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set())
  const [isRequesting, setIsRequesting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [requestedVendors, setRequestedVendors] = useState<Array<{ name: string; code: string }>>([])
  const [requestCount, setRequestCount] = useState(0)

  const { data: vendorsData, isLoading: isLoadingVendors } = useVendorsAdvancedSearch({
    q: filters.q,
    min_credibility: filters.min_credibility,
    max_credibility: filters.max_credibility,
    country: filters.country,
    category: filters.category,
    certification: filters.certification,
    skip: 0,
    limit: 100,
  })

  const handleToggleVendor = (vendorId: string) => {
    setSelectedVendorIds((prev) => {
      const next = new Set(prev)
      if (next.has(vendorId)) {
        next.delete(vendorId)
      } else {
        next.add(vendorId)
      }
      return next
    })
  }

  const handleRequestProposals = async () => {
    if (selectedVendorIds.size === 0) {
      toast.error("Please select at least one vendor")
      return
    }

    setIsRequesting(true)
    try {
      const vendors = vendorsData?.items.filter((v) => selectedVendorIds.has(v.id)) || []

      // Create a proposal for each selected vendor
      for (const vendor of vendors) {
        await createProposal.mutateAsync({
          deal_id: dealId,
          vendor_id: vendor.id,
        })
      }

      // Store vendor info for success modal
      const vendorInfo = vendors.map((v) => ({
        name: v.company_name,
        code: v.vendor_code,
      }))
      setRequestedVendors(vendorInfo)
      setRequestCount(vendors.length)
      setShowSuccessModal(true)

      // Clear selections
      setSelectedVendorIds(new Set())
    } catch (error) {
      console.error("Error requesting proposals:", error)
      toast.error("Failed to request proposals")
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/deals/${dealId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deal
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Request Proposals</h1>
            <p className="text-sm text-gray-600 mt-1">
              {deal?.deal_number} - Find and select vendors to request proposals from
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Smart Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Keyword Search */}
            <div>
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Vendor name or code..."
                  value={filters.q || ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Credibility Score */}
            <div>
              <label className="text-sm font-medium text-gray-700">Credibility Score</label>
              <div className="space-y-2 mt-2">
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.min_credibility || 0}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        min_credibility: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: {filters.min_credibility || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="text-sm font-medium text-gray-700">Country</label>
              <Input
                placeholder="e.g., UAE, China..."
                value={filters.country || ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
                className="text-sm mt-2"
              />
            </div>

            {/* Product Category */}
            <div>
              <label className="text-sm font-medium text-gray-700">Product Category</label>
              <Input
                placeholder="e.g., Pipes, Valves..."
                value={filters.category || ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="text-sm mt-2"
              />
            </div>

            {/* Certification */}
            <div>
              <label className="text-sm font-medium text-gray-700">Certification</label>
              <Input
                placeholder="e.g., ISO 9001..."
                value={filters.certification || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, certification: e.target.value }))
                }
                className="text-sm mt-2"
              />
            </div>

            {/* Clear Filters */}
            {Object.values(filters).some((v) => v) && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Vendors List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Selected Count */}
          {selectedVendorIds.size > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">{selectedVendorIds.size} vendor(s) selected</p>
                  <p className="text-sm text-blue-700 mt-1">Ready to request proposals from selected vendors</p>
                </div>
                <Button
                  onClick={handleRequestProposals}
                  disabled={isRequesting}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Request Proposals
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Vendors List */}
          {isLoadingVendors ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading vendors...</p>
              </CardContent>
            </Card>
          ) : !vendorsData?.items?.length ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No vendors found. Try adjusting your filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vendorsData.items.map((vendor) => (
                <Card
                  key={vendor.id}
                  className={`cursor-pointer transition-all ${
                    selectedVendorIds.has(vendor.id)
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => handleToggleVendor(vendor.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedVendorIds.has(vendor.id)}
                        onCheckedChange={() => handleToggleVendor(vendor.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{vendor.company_name}</h3>
                          <Badge variant="outline">{vendor.vendor_code}</Badge>
                          <Badge
                            className={
                              vendor.credibility_score >= 70
                                ? "bg-green-100 text-green-800"
                                : vendor.credibility_score >= 40
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {vendor.credibility_score}/100
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-gray-500 text-xs">Country</p>
                            <p className="font-medium">{vendor.country}</p>
                          </div>
                          {vendor.on_time_delivery_rate !== null && (
                            <div>
                              <p className="text-gray-500 text-xs">On-Time Delivery</p>
                              <p className="font-medium">
                                {(vendor.on_time_delivery_rate * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}
                          {vendor.quality_score !== null && (
                            <div>
                              <p className="text-gray-500 text-xs">Quality Score</p>
                              <p className="font-medium">{vendor.quality_score}/100</p>
                            </div>
                          )}
                          {vendor.avg_lead_time_days !== null && (
                            <div>
                              <p className="text-gray-500 text-xs">Avg Lead Time</p>
                              <p className="font-medium">{vendor.avg_lead_time_days} days</p>
                            </div>
                          )}
                        </div>

                        {vendor.product_categories && vendor.product_categories.length > 0 && (
                          <div className="mt-3">
                            <p className="text-gray-500 text-xs mb-1">Categories</p>
                            <div className="flex flex-wrap gap-1">
                              {vendor.product_categories.map((cat: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              Proposals Requested! ✅
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-center">
                <p className="text-base font-medium text-gray-900">
                  Successfully requested proposals from {requestCount} vendor{requestCount !== 1 ? "s" : ""}
                </p>

                {requestedVendors.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-semibold text-blue-900">Vendors contacted:</p>
                    {requestedVendors.map((vendor, idx) => (
                      <div key={idx} className="text-left flex justify-between items-center">
                        <span className="text-gray-700">{vendor.name}</span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          {vendor.code}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-600">
                  You can track proposal responses in the Proposals tab of your deal.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex gap-3 pt-4">
            <AlertDialogAction
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
            >
              Stay Here
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessModal(false)
                router.push(`/deals/${dealId}?tab=proposals`)
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              View Proposals
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

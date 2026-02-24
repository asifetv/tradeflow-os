/**
 * Edit vendor proposal page
 * Handles updating proposal details with optional extracted data from documents
 */

"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useVendorProposal, useUpdateVendorProposal } from "@/lib/hooks/use-vendor-proposals"
import { toast } from "sonner"

interface ExtractedDataSummary {
  total_price?: number
  currency?: string
  lead_time_days?: number
  payment_terms?: string
  specs_match?: boolean
  notes?: string
  extractedFields?: string[]
}

export default function EditProposalPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
  const proposalId = params.proposalId as string

  const { data: proposal, isLoading } = useVendorProposal(proposalId as string)
  const updateProposal = useUpdateVendorProposal()
  const [extractedData, setExtractedData] = useState<ExtractedDataSummary | null>(null)
  const [showDataAppliedAlert, setShowDataAppliedAlert] = useState(false)
  const [hasAppliedExtractedData, setHasAppliedExtractedData] = useState(false)

  const [formData, setFormData] = useState({
    total_price: "",
    currency: "AED",
    lead_time_days: "",
    payment_terms: "",
    specs_match: false,
    notes: "",
  })

  // Retrieve extracted data from sessionStorage on mount (MUST RUN FIRST)
  useEffect(() => {
    const storageKey = `proposal_extracted_data_${proposalId}`
    console.log(`[EditProposalPage] Looking for sessionStorage key: ${storageKey}`)
    const stored = sessionStorage.getItem(storageKey)
    console.log(`[EditProposalPage] sessionStorage value:`, stored ? JSON.parse(stored) : "NOT FOUND")

    if (stored) {
      try {
        const parsedData = JSON.parse(stored)
        console.log(`[EditProposalPage] Successfully parsed extracted data:`, parsedData)
        setExtractedData(parsedData)
        setHasAppliedExtractedData(true)
        setShowDataAppliedAlert(true)
        setTimeout(() => setShowDataAppliedAlert(false), 5000)

        // Clear it after retrieving so it doesn't persist across navigations
        sessionStorage.removeItem(storageKey)
      } catch (e) {
        console.error("Failed to parse extracted data:", e)
      }
    } else {
      console.log(`[EditProposalPage] No extracted data found in sessionStorage`)
    }
  }, [proposalId]) // Run only once on mount

  // Initialize form when proposal loads OR after extracted data is processed
  useEffect(() => {
    if (proposal) {
      if (hasAppliedExtractedData && extractedData) {
        // Apply extracted data to form
        console.log("[EditProposalPage] Applying extracted data to form")
        setFormData({
          total_price: extractedData.total_price?.toString() || "",
          currency: extractedData.currency || "AED",
          lead_time_days: extractedData.lead_time_days?.toString() || "",
          payment_terms: extractedData.payment_terms || "",
          specs_match: extractedData.specs_match ?? false,
          notes: extractedData.notes || "",
        })
      } else {
        // Initialize from proposal
        console.log("[EditProposalPage] Initializing form from proposal data")
        setFormData({
          total_price: proposal.total_price?.toString() || "",
          currency: proposal.currency || "AED",
          lead_time_days: proposal.lead_time_days?.toString() || "",
          payment_terms: proposal.payment_terms || "",
          specs_match: proposal.specs_match ?? false,
          notes: proposal.notes || "",
        })
      }
    }
  }, [proposal, hasAppliedExtractedData, extractedData])

  const handleSave = async () => {
    try {
      // Validate numeric fields
      const totalPrice = formData.total_price.trim() ? parseFloat(formData.total_price) : undefined
      const leadTimeDays = formData.lead_time_days.trim() ? parseInt(formData.lead_time_days) : undefined

      if (totalPrice !== undefined && isNaN(totalPrice)) {
        toast.error("Total Price must be a valid number")
        return
      }
      if (leadTimeDays !== undefined && isNaN(leadTimeDays)) {
        toast.error("Lead Time must be a valid number")
        return
      }

      const updateData = {
        total_price: totalPrice,
        currency: formData.currency || undefined,
        lead_time_days: leadTimeDays,
        payment_terms: formData.payment_terms.trim() || undefined,
        specs_match: formData.specs_match,
        notes: formData.notes.trim() || undefined,
      }

      console.log("[EditProposalPage] Saving proposal with data:", updateData)

      await updateProposal.mutateAsync({
        id: proposalId,
        data: updateData,
      })

      toast.success("✅ Proposal updated successfully")
      router.push(`/deals/${dealId}/proposals/${proposalId}`)
    } catch (error: any) {
      console.error("❌ Update error:", error)
      console.error("Response data:", error.response?.data)
      const errorMsg = error.response?.data?.detail || "Failed to update proposal"
      toast.error(errorMsg)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      Loading proposal...
    </div>
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Proposal not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/deals/${dealId}/proposals/${proposalId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Proposal</h1>
            <p className="text-gray-600 mt-1">{proposal.vendor?.company_name}</p>
          </div>
        </div>
      </div>

      {/* Extracted Data Applied Alert */}
      {showDataAppliedAlert && extractedData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">✅ Document Data Applied</h3>
                <p className="text-sm text-blue-700">
                  Extracted data from the proposal document has been automatically populated into the form fields below.
                  Please verify and edit as needed before saving.
                </p>
                {extractedData.extractedFields && extractedData.extractedFields.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-blue-600 mb-1">Extracted Fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {extractedData.extractedFields.map((field, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Price & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Total Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.total_price}
                onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                className={extractedData?.total_price !== undefined ? "bg-blue-50" : ""}
              />
              {extractedData?.total_price !== undefined && (
                <p className="text-xs text-blue-600 mt-1">Auto-filled from document</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Currency</label>
              <Input
                placeholder="AED"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={extractedData?.currency !== undefined ? "bg-blue-50" : ""}
              />
              {extractedData?.currency !== undefined && (
                <p className="text-xs text-blue-600 mt-1">Auto-filled from document</p>
              )}
            </div>
          </div>

          {/* Row 2: Lead Time & Payment Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Lead Time (days)</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                className={extractedData?.lead_time_days !== undefined ? "bg-blue-50" : ""}
              />
              {extractedData?.lead_time_days !== undefined && (
                <p className="text-xs text-blue-600 mt-1">Auto-filled from document</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Terms</label>
              <Input
                placeholder="e.g., Net 45"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className={extractedData?.payment_terms !== undefined ? "bg-blue-50" : ""}
              />
              {extractedData?.payment_terms !== undefined && (
                <p className="text-xs text-blue-600 mt-1">Auto-filled from document</p>
              )}
            </div>
          </div>

          {/* Specs Match Checkbox */}
          <div className="flex items-center gap-2 p-3 border rounded bg-gray-50">
            <Checkbox
              id="specs-match"
              checked={formData.specs_match}
              onCheckedChange={(checked) => setFormData({ ...formData, specs_match: !!checked })}
            />
            <label htmlFor="specs-match" className="text-sm cursor-pointer font-medium">
              Specifications Match
            </label>
            {extractedData?.specs_match !== undefined && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Auto-filled
              </span>
            )}
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
            <Textarea
              placeholder="Add notes about this proposal..."
              className={`min-h-24 ${extractedData?.notes !== undefined ? "bg-blue-50" : ""}`}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
            {extractedData?.notes !== undefined && (
              <p className="text-xs text-blue-600 mt-1">Auto-filled from document</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={updateProposal.isPending}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              {updateProposal.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Link href={`/deals/${dealId}/proposals/${proposalId}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

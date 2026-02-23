/**
 * Edit deal page
 */

"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { DealForm } from "@/components/deals/deal-form"
import { useDeal } from "@/lib/hooks/use-deals"

export default function EditDealPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
  const [extractedData, setExtractedData] = useState<any>(null)

  const { data: deal, isLoading } = useDeal(dealId)

  // Retrieve extracted data from sessionStorage on mount
  useEffect(() => {
    const storageKey = `deal_extracted_data_${dealId}`
    const stored = sessionStorage.getItem(storageKey)
    if (stored) {
      try {
        setExtractedData(JSON.parse(stored))
        // Clear it after retrieving so it doesn't persist across navigations
        sessionStorage.removeItem(storageKey)
      } catch (e) {
        console.error("Failed to parse extracted data:", e)
      }
    }
  }, [dealId])

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Deal not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Deal</h1>
        <p className="text-gray-600 mt-1">{deal.deal_number}</p>
      </div>
      <DealForm initialDeal={deal} extractedRFQData={extractedData} />
    </div>
  )
}

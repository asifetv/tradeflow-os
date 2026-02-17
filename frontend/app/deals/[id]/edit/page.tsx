/**
 * Edit deal page
 */

"use client"

import { useParams, useRouter } from "next/navigation"

import { DealForm } from "@/components/deals/deal-form"
import { useDeal } from "@/lib/hooks/use-deals"

export default function EditDealPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string

  const { data: deal, isLoading } = useDeal(dealId)

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
      <DealForm initialDeal={deal} />
    </div>
  )
}

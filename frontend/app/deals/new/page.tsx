/**
 * Create new deal page
 */

"use client"

import { DealForm } from "@/components/deals/deal-form"

export default function NewDealPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Deal</h1>
        <p className="text-gray-600 mt-1">Add a new deal to the system</p>
      </div>
      <DealForm />
    </div>
  )
}

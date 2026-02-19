"use client"

import { CustomerPoForm } from "@/components/customer-pos/customer-po-form"
import { useCustomerPo } from "@/lib/hooks/use-customer-pos"
import { useParams } from "next/navigation"

export default function EditCustomerPoPage() {
  const params = useParams()
  const id = params.id as string
  const { data: customerPo } = useCustomerPo(id)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Edit Customer PO</h1>
        {customerPo && <CustomerPoForm initialCustomerPo={customerPo} />}
      </div>
    </div>
  )
}

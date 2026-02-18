"use client"

import { CustomerPoForm } from "@/components/customer-pos/customer-po-form"
import { useCustomerPo } from "@/lib/hooks/use-customer-pos"

interface EditCustomerPoPageProps {
  params: {
    id: string
  }
}

export default function EditCustomerPoPage({ params }: EditCustomerPoPageProps) {
  const { data: customerPo } = useCustomerPo(params.id)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Edit Customer PO</h1>
        {customerPo && <CustomerPoForm initialCustomerPo={customerPo} />}
      </div>
    </div>
  )
}

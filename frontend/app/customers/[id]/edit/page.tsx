"use client"

import { CustomerForm } from "@/components/customers/customer-form"
import { useCustomer } from "@/lib/hooks/use-customers"
import { useParams } from "next/navigation"

export default function EditCustomerPage() {
  const params = useParams()
  const id = params.id as string
  const { data: customer } = useCustomer(id)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Edit Customer</h1>
        {customer && <CustomerForm initialCustomer={customer} />}
      </div>
    </div>
  )
}

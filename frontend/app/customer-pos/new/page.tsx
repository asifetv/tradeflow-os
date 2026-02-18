"use client"

import { CustomerPoForm } from "@/components/customer-pos/customer-po-form"

export default function NewCustomerPoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Create New Customer PO</h1>
        <CustomerPoForm />
      </div>
    </div>
  )
}

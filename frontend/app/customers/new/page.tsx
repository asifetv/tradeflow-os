"use client"

import { CustomerForm } from "@/components/customers/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Create New Customer</h1>
        <CustomerForm />
      </div>
    </div>
  )
}

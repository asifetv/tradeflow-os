"use client"

import { CustomerPoForm } from "@/components/customer-pos/customer-po-form"

export default function NewCustomerPoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Create New Customer PO
          </h1>
          <p className="text-muted-foreground mt-2">Record a purchase order received from your customer</p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <CustomerPoForm />
        </div>
      </div>
    </div>
  )
}

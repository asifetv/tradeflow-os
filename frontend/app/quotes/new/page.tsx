"use client"

import { QuoteForm } from "@/components/quotes/quote-form"

export default function NewQuotePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            Create New Quote
          </h1>
          <p className="text-muted-foreground mt-2">Generate a formal price quotation for your customer</p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <QuoteForm />
        </div>
      </div>
    </div>
  )
}

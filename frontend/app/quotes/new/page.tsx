"use client"

import { QuoteForm } from "@/components/quotes/quote-form"

export default function NewQuotePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Create New Quote</h1>
        <QuoteForm />
      </div>
    </div>
  )
}

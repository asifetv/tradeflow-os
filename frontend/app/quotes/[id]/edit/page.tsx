"use client"

import { QuoteForm } from "@/components/quotes/quote-form"
import { useQuote } from "@/lib/hooks/use-quotes"
import { useParams } from "next/navigation"

export default function EditQuotePage() {
  const params = useParams()
  const id = params.id as string
  const { data: quote } = useQuote(id)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Edit Quote</h1>
        {quote && <QuoteForm initialQuote={quote} />}
      </div>
    </div>
  )
}

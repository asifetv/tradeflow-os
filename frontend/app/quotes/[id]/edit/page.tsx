"use client"

import { QuoteForm } from "@/components/quotes/quote-form"
import { useQuote } from "@/lib/hooks/use-quotes"

interface EditQuotePageProps {
  params: {
    id: string
  }
}

export default function EditQuotePage({ params }: EditQuotePageProps) {
  const { data: quote } = useQuote(params.id)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Edit Quote</h1>
        {quote && <QuoteForm initialQuote={quote} />}
      </div>
    </div>
  )
}

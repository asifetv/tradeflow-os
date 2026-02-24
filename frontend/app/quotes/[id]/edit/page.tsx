/**
 * Edit quote page
 * Handles updating quote details with optional extracted data from documents
 */

"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useQuote } from "@/lib/hooks/use-quotes"
import { QuoteForm } from "@/components/quotes/quote-form"

export default function EditQuotePage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string

  const { data: quote, isLoading } = useQuote(quoteId as string)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [showDataAppliedAlert, setShowDataAppliedAlert] = useState(false)

  // Retrieve extracted data from sessionStorage on mount
  useEffect(() => {
    const storageKey = `quote_extracted_data_${quoteId}`
    console.log(`[EditQuotePage] Looking for sessionStorage key: ${storageKey}`)
    const stored = sessionStorage.getItem(storageKey)
    console.log(`[EditQuotePage] sessionStorage value:`, stored ? JSON.parse(stored) : "NOT FOUND")

    if (stored) {
      try {
        const parsedData = JSON.parse(stored)
        console.log(`[EditQuotePage] Successfully parsed extracted data:`, parsedData)
        setExtractedData(parsedData)
        setShowDataAppliedAlert(true)
        setTimeout(() => setShowDataAppliedAlert(false), 5000)

        // Clear it after retrieving so it doesn't persist across navigations
        sessionStorage.removeItem(storageKey)
      } catch (e) {
        console.error("Failed to parse extracted data:", e)
      }
    } else {
      console.log(`[EditQuotePage] No extracted data found in sessionStorage`)
    }
  }, [quoteId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading quote...
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quote not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/quotes/${quoteId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Quote</h1>
            <p className="text-gray-600 mt-1">{quote.quote_number}</p>
          </div>
        </div>
      </div>

      {/* Extracted Data Applied Alert */}
      {showDataAppliedAlert && extractedData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">✅ Document Data Applied</h3>
                <p className="text-sm text-blue-700">
                  Extracted data from the quote document has been automatically populated into the form fields below.
                  Please verify and edit as needed before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quote Form with extracted data */}
      <QuoteForm initialQuote={quote} extractedQuoteData={extractedData} />
    </div>
  )
}

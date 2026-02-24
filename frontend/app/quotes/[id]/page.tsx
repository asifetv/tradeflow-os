"use client"

import { Button } from "@/components/ui/button"
import { Home, ChevronDown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useQuote, useDeleteQuote, useUpdateQuoteStatus, useQuoteActivity } from "@/lib/hooks/use-quotes"
import { useRouter, useParams } from "next/navigation"
import { QuoteCard } from "@/components/quotes/quote-card"
import { ActivityTimeline } from "@/components/deals/activity-timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuoteStatus } from "@/lib/types/quote"
import { DocumentUpload } from "@/components/documents/document-upload"
import { DocumentList } from "@/components/documents/document-list"
import { DocumentCategory } from "@/lib/types/document"

const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.SENT, QuoteStatus.EXPIRED],
  [QuoteStatus.SENT]: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.REVISED, QuoteStatus.EXPIRED],
  [QuoteStatus.ACCEPTED]: [],
  [QuoteStatus.REJECTED]: [QuoteStatus.REVISED],
  [QuoteStatus.EXPIRED]: [QuoteStatus.REVISED],
  [QuoteStatus.REVISED]: [QuoteStatus.SENT],
}

export default function QuoteDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: quote } = useQuote(id)
  const { data: activityData, isLoading: isActivityLoading } = useQuoteActivity(id)
  const deleteQuote = useDeleteQuote()
  const updateQuoteStatus = useUpdateQuoteStatus(id)

  const handleDelete = async () => {
    await deleteQuote.mutateAsync(id)
    router.push("/quotes")
  }

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    await updateQuoteStatus.mutateAsync({ status: newStatus })
  }

  const handleUseExtractedData = (extractedData: any, category: DocumentCategory | string) => {
    console.log("[QuoteDetailPage] Extracted data received:", extractedData)

    // Store in sessionStorage with quoteId key
    const storageKey = `quote_extracted_data_${id}`
    sessionStorage.setItem(storageKey, JSON.stringify(extractedData))

    // Navigate to edit page
    router.push(`/quotes/${id}/edit`)
  }

  const validTransitions = quote ? VALID_TRANSITIONS[quote.status] : []

  return (
    <div className="container mx-auto py-8">
      <Link href="/quotes" className="inline-block mb-4">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Button>
      </Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex justify-between items-center flex-1">
          <h1 className="text-3xl font-bold">{quote?.title || "Quote"}</h1>
          <div className="flex gap-2">
            {/* Show "Send Quote" button for DRAFT status */}
            {quote?.status === QuoteStatus.DRAFT && (
              <Button
                onClick={() => handleStatusChange(QuoteStatus.SENT)}
                className="bg-green-600 hover:bg-green-700"
              >
                Send Quote
              </Button>
            )}

            {/* Show "Accept Quote" button for SENT status */}
            {quote?.status === QuoteStatus.SENT && (
              <Button
                onClick={() => handleStatusChange(QuoteStatus.ACCEPTED)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Accept Quote
              </Button>
            )}

            {/* Show status dropdown for other transitions */}
            {validTransitions.length > 0 && quote?.status !== QuoteStatus.DRAFT && quote?.status !== QuoteStatus.SENT && (
              <Select onValueChange={(value) => handleStatusChange(value as QuoteStatus)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  {validTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Link href={`/quotes/${id}/edit`}>
              <Button>Edit</Button>
            </Link>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this quote? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Quote Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <QuoteCard quoteId={id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Quote Documents</h3>
            <DocumentUpload
              category={DocumentCategory.INVOICE}
              entityType="Quote"
              entityId={id}
              onUploadSuccess={() => {
                // List will auto-refresh via React Query
              }}
            />
            <DocumentList
              entityType="Quote"
              entityId={id}
              category={DocumentCategory.INVOICE}
              onUseExtractedData={handleUseExtractedData}
            />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <ActivityTimeline
              activityLogs={activityData?.activity_logs || []}
              isLoading={isActivityLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

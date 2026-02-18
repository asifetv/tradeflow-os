"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useQuote, useDeleteQuote, useUpdateQuoteStatus } from "@/lib/hooks/use-quotes"
import { useRouter } from "next/navigation"
import { QuoteCard } from "@/components/quotes/quote-card"
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

interface QuoteDetailPageProps {
  params: {
    id: string
  }
}

const VALID_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.SENT, QuoteStatus.EXPIRED],
  [QuoteStatus.SENT]: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.REVISED, QuoteStatus.EXPIRED],
  [QuoteStatus.ACCEPTED]: [],
  [QuoteStatus.REJECTED]: [QuoteStatus.REVISED],
  [QuoteStatus.EXPIRED]: [QuoteStatus.REVISED],
  [QuoteStatus.REVISED]: [QuoteStatus.SENT],
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const router = useRouter()
  const { data: quote } = useQuote(params.id)
  const deleteQuote = useDeleteQuote()
  const updateQuoteStatus = useUpdateQuoteStatus(params.id)

  const handleDelete = async () => {
    await deleteQuote.mutateAsync(params.id)
    router.push("/quotes")
  }

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    await updateQuoteStatus.mutateAsync({ status: newStatus })
  }

  const validTransitions = quote ? VALID_TRANSITIONS[quote.status] : []

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{quote?.title || "Quote"}</h1>
        <div className="flex gap-2">
          {validTransitions.length > 0 && (
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

          <Link href={`/quotes/${params.id}/edit`}>
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

      <QuoteCard quoteId={params.id} />
    </div>
  )
}

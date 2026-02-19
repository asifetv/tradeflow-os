import { Button } from "@/components/ui/button"
import { QuotesTable } from "@/components/quotes/quotes-table"
import Link from "next/link"

export default function QuotesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quotes</h1>
        <Link href="/quotes/new">
          <Button>New Quote</Button>
        </Link>
      </div>

      <QuotesTable />
    </div>
  )
}

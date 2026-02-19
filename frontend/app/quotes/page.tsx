import { Button } from "@/components/ui/button"
import { QuotesTable } from "@/components/quotes/quotes-table"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function QuotesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Quotes
              </h1>
              <p className="text-muted-foreground mt-2">Generate and manage price quotations</p>
            </div>
            <Link href="/quotes/new">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4" />
                New Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <QuotesTable />
        </div>
      </div>
    </div>
  )
}

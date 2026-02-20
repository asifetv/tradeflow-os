"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { QuotesTable } from "@/components/quotes/quotes-table"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Plus, X } from "lucide-react"
import { CustomerSelector } from "@/components/customers/customer-selector"

export default function QuotesPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
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
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Customer Filter */}
        <Card className="bg-card border border-border shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Customer:</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CustomerSelector
                    value={selectedCustomerId}
                    onChange={(customerId) => {
                      setSelectedCustomerId(customerId || null)
                    }}
                  />
                </div>
                {selectedCustomerId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerId(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <QuotesTable customerId={selectedCustomerId} />
        </div>
      </div>
    </div>
  )
}

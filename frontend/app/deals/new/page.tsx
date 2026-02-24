/**
 * Create new deal page
 */

"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DealForm } from "@/components/deals/deal-form"

export default function NewDealPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/deals">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            Create New Deal
          </h1>
          <p className="text-muted-foreground mt-2">Add a new deal to the system</p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <DealForm />
        </div>
      </div>
    </div>
  )
}

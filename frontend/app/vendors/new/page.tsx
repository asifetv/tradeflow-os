"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { VendorForm } from "@/components/vendors/vendor-form"

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendors">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Vendor</h1>
          <p className="text-gray-600">Register a new vendor in your network</p>
        </div>
      </div>

      {/* Form */}
      <VendorForm />
    </div>
  )
}

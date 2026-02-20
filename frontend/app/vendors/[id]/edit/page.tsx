"use client"

import { VendorForm } from "@/components/vendors/vendor-form"
import { useVendor } from "@/lib/hooks/use-vendors"
import { useParams } from "next/navigation"

export default function EditVendorPage() {
  const params = useParams()
  const id = params.id as string
  const { data: vendor } = useVendor(id)

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Edit Vendor</h1>
        {vendor && <VendorForm initialVendor={vendor} />}
      </div>
    </div>
  )
}

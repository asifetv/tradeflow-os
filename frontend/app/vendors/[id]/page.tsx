"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useVendor, useDeleteVendor } from "@/lib/hooks/use-vendors"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DocumentUpload } from "@/components/documents/document-upload"
import { DocumentList } from "@/components/documents/document-list"
import { DocumentCategory } from "@/lib/types/document"
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

export default function VendorDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: vendor, isLoading } = useVendor(id)
  const deleteVendor = useDeleteVendor()

  const handleDelete = async () => {
    await deleteVendor.mutateAsync(id)
    router.push("/vendors")
  }

  if (isLoading) return <div className="text-center py-8">Loading vendor...</div>
  if (!vendor) return <div className="text-center py-8 text-red-600">Vendor not found</div>

  return (
    <div className="container mx-auto py-8">
      <Link href="/vendors" className="inline-block mb-4">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Vendors
        </Button>
      </Link>
      <div className="flex items-center gap-4 justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{vendor.company_name}</h1>
          <p className="text-gray-600">{vendor.vendor_code}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/vendors/${id}/edit`}>
            <Button>Edit</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this vendor? This action cannot be undone.
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

      <div className="grid grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="font-semibold">{vendor.company_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendor Code</p>
              <p className="font-semibold">{vendor.vendor_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Country</p>
              <p className="font-semibold">{vendor.country}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={vendor.is_active ? "default" : "secondary"}>
                {vendor.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendor.primary_contact_name && (
              <div>
                <p className="text-sm text-gray-600">Contact Name</p>
                <p className="font-semibold">{vendor.primary_contact_name}</p>
              </div>
            )}
            {vendor.primary_contact_email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <a href={`mailto:${vendor.primary_contact_email}`} className="font-semibold text-blue-600">
                  {vendor.primary_contact_email}
                </a>
              </div>
            )}
            {vendor.primary_contact_phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold">{vendor.primary_contact_phone}</p>
              </div>
            )}
            {!vendor.primary_contact_name && !vendor.primary_contact_email && !vendor.primary_contact_phone && (
              <p className="text-gray-500">No contact information provided</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Credibility Score</p>
              <p className="font-semibold">{vendor.credibility_score}/100</p>
            </div>
            {vendor.quality_score !== null && (
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="font-semibold">{vendor.quality_score}/100</p>
              </div>
            )}
            {vendor.on_time_delivery_rate !== undefined && vendor.on_time_delivery_rate !== null && (
              <div>
                <p className="text-sm text-gray-600">On-Time Delivery Rate</p>
                <p className="font-semibold">{(vendor.on_time_delivery_rate * 100).toFixed(1)}%</p>
              </div>
            )}
            {vendor.avg_lead_time_days !== null && (
              <div>
                <p className="text-sm text-gray-600">Avg. Lead Time</p>
                <p className="font-semibold">{vendor.avg_lead_time_days} days</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Business Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendor.payment_terms && (
              <div>
                <p className="text-sm text-gray-600">Payment Terms</p>
                <p className="font-semibold">{vendor.payment_terms}</p>
              </div>
            )}
            {!vendor.payment_terms && (
              <p className="text-gray-500">No payment terms specified</p>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        {vendor.certifications && vendor.certifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {vendor.certifications.map((cert) => (
                  <Badge key={cert} variant="outline">
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Categories */}
        {vendor.product_categories && vendor.product_categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {vendor.product_categories.map((category) => (
                  <Badge key={category} variant="outline">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {vendor.notes && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{vendor.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documents Section */}
      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">Certifications & Documents</h2>
        <div className="grid grid-cols-1 gap-6">
          <DocumentUpload
            category={DocumentCategory.CERTIFICATE}
            entityType="Vendor"
            entityId={id}
            onUploadSuccess={() => {
              // List will auto-refresh via React Query
            }}
          />
          <DocumentList
            entityType="Vendor"
            entityId={id}
            category={DocumentCategory.CERTIFICATE}
          />
        </div>
      </div>
    </div>
  )
}

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { vendorApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import Link from "next/link"
import { Plus, Trash2, Star, Globe, User, Mail, Phone } from "lucide-react"

export default function VendorsPage() {
  const queryClient = useQueryClient()

  const { data: vendorsData, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const response = await vendorApi.list({ skip: 0, limit: 100 })
      return response.data
    },
  })

  const deleteVendorMutation = useMutation({
    mutationFn: (vendorId: string) => vendorApi.delete(vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] })
      toast.success("Vendor deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete vendor")
    },
  })

  const getCredibilityColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800"
    if (score >= 40) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Network</h1>
          <p className="text-gray-600">Manage your suppliers and partners</p>
        </div>
        <Link href="/vendors/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vendorsData?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">High Credibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {vendorsData?.items?.filter((v) => v.credibility_score >= 70).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vendorsData?.items?.filter((v) => v.is_active).length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">Loading vendors...</CardContent>
        </Card>
      ) : !vendorsData?.items?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>No vendors yet. Create your first vendor to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendorsData.items.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-2">{vendor.company_name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{vendor.vendor_code}</p>
                  </div>
                  {vendor.is_active ? (
                    <Badge variant="outline" className="bg-green-50">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50">
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Credibility Score */}
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <Badge className={getCredibilityColor(vendor.credibility_score)}>
                    Credibility: {vendor.credibility_score}/100
                  </Badge>
                </div>

                {/* Country */}
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span>{vendor.country}</span>
                </div>

                {/* Contact Info */}
                {vendor.primary_contact_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{vendor.primary_contact_name}</span>
                  </div>
                )}

                {vendor.primary_contact_email && (
                  <div className="flex items-start gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{vendor.primary_contact_email}</span>
                  </div>
                )}

                {vendor.primary_contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{vendor.primary_contact_phone}</span>
                  </div>
                )}

                {vendor.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded line-clamp-2">
                    {vendor.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        disabled={deleteVendorMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {vendor.company_name}? This action cannot be undone.
                      </AlertDialogDescription>
                      <div className="flex gap-3 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteVendorMutation.mutate(vendor.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

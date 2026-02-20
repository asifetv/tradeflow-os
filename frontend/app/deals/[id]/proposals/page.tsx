"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { vendorProposalApi, vendorApi, dealApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, ArrowRight, TrendingDown, Clock, FileText } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const requestProposalSchema = z.object({
  vendor_id: z.string().min(1, "Please select a vendor"),
})

type RequestProposalFormValues = z.infer<typeof requestProposalSchema>

export default function ProposalsPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
  const queryClient = useQueryClient()

  const { data: deal } = useQuery({
    queryKey: ["deals", dealId],
    queryFn: async () => {
      const response = await dealApi.get(dealId)
      return response.data
    },
  })

  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ["proposals", dealId],
    queryFn: async () => {
      const response = await vendorProposalApi.list({ deal_id: dealId, limit: 100 })
      return response.data
    },
  })

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const response = await vendorApi.list({ skip: 0, limit: 100 })
      return response.data
    },
  })

  const form = useForm<RequestProposalFormValues>({
    resolver: zodResolver(requestProposalSchema),
    defaultValues: {
      vendor_id: "",
    },
  })

  const requestProposalMutation = useMutation({
    mutationFn: async (values: RequestProposalFormValues) => {
      await vendorProposalApi.create({
        deal_id: dealId,
        vendor_id: values.vendor_id,
        status: "requested",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", dealId] })
      form.reset()
      toast.success("Proposal request sent to vendor")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to request proposal")
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-green-100 text-green-800"
      case "selected":
        return "bg-blue-100 text-blue-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "requested":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const requestedVendorIds = new Set(proposalsData?.items?.map(p => p.vendor_id) || [])
  const availableVendors = vendorsData?.items?.filter(v => !requestedVendorIds.has(v.id)) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Proposals</h1>
          <p className="text-gray-600 mt-1">
            Deal: {deal?.deal_number || "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          {proposalsData?.items && proposalsData.items.length > 0 && (
            <Link href={`/deals/${dealId}/proposals/compare`}>
              <Button className="gap-2">
                <TrendingDown className="w-4 h-4" />
                Compare Proposals
              </Button>
            </Link>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Request Proposal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Vendor Proposal</DialogTitle>
                <DialogDescription>
                  Select a vendor to request a proposal for this deal
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((values) =>
                    requestProposalMutation.mutate(values)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="vendor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Vendor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a vendor..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableVendors.length > 0 ? (
                              availableVendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{vendor.company_name}</span>
                                    <Badge variant="outline" className="ml-2">
                                      {vendor.credibility_score}/100
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                All vendors already have proposals
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={requestProposalMutation.isPending || availableVendors.length === 0}
                  >
                    {requestProposalMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{proposalsData?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {proposalsData?.items?.filter(p => p.status === "received").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {proposalsData?.items?.filter(p => p.status === "selected").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {proposalsData?.items?.filter(p => p.status === "requested").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals List */}
      {proposalsLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">Loading proposals...</CardContent>
        </Card>
      ) : !proposalsData?.items?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No proposals yet. Request proposals from vendors to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposalsData.items.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {proposal.vendor?.company_name || "Unknown Vendor"}
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Requested: {new Date(proposal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Score: {proposal.vendor?.credibility_score || 0}/100
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Price */}
                  <div>
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="text-lg font-bold mt-1">
                      {proposal.total_price
                        ? `${proposal.total_price.toLocaleString()} ${proposal.currency}`
                        : "Not provided"}
                    </p>
                  </div>

                  {/* Lead Time */}
                  <div>
                    <p className="text-sm text-gray-600">Lead Time</p>
                    <p className="text-lg font-bold mt-1 flex items-center gap-1">
                      {proposal.lead_time_days ? (
                        <>
                          <Clock className="w-4 h-4 text-blue-600" />
                          {proposal.lead_time_days} days
                        </>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>

                  {/* Specs Match */}
                  <div>
                    <p className="text-sm text-gray-600">Specs Match</p>
                    <p className="text-lg font-bold mt-1">
                      {proposal.specs_match === true ? (
                        <span className="text-green-600">✓ Match</span>
                      ) : proposal.specs_match === false ? (
                        <span className="text-red-600">✗ No Match</span>
                      ) : (
                        <span className="text-gray-400">Not evaluated</span>
                      )}
                    </p>
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <p className="text-sm text-gray-600">Payment Terms</p>
                    <p className="text-sm mt-1 font-medium">
                      {proposal.payment_terms || "Not specified"}
                    </p>
                  </div>
                </div>

                {proposal.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700">{proposal.notes}</p>
                  </div>
                )}

                {proposal.discrepancies && Object.keys(proposal.discrepancies).length > 0 && (
                  <div className="mt-3 pt-3 border-t bg-yellow-50 p-3 rounded">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">Discrepancies:</p>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {Object.entries(proposal.discrepancies).map(([key, value]) => (
                        <li key={key}>• {key}: {String(value)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {proposalsData.items.length > 0 && proposalsData.items.some(p => p.status === "received") && (
            <div className="pt-4">
              <Link href={`/deals/${dealId}/proposals/compare`}>
                <Button className="w-full gap-2 py-6">
                  <TrendingDown className="w-5 h-5" />
                  View Proposal Comparison Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { vendorProposalApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { CheckCircle2, XCircle, AlertCircle, TrendingDown, Clock, Star } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ProposalComparisonPage() {
  const params = useParams()
  const dealId = params.id as string
  const queryClient = useQueryClient()

  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ["proposals", "compare", dealId],
    queryFn: async () => {
      const response = await vendorProposalApi.compare(dealId)
      return response.data
    },
  })

  const selectVendorMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await vendorProposalApi.select(proposalId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals", "compare", dealId] })
      toast.success("Vendor selected successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to select vendor")
    },
  })

  const getCredibilityColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50"
    if (score >= 40) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getPriceColor = (proposal: any, bestPrice?: number) => {
    if (proposal.is_best_price) return "bg-green-100 text-green-900 font-bold"
    if (proposal.is_worst_price) return "bg-red-100 text-red-900"
    return ""
  }

  const getLeadTimeColor = (proposal: any) => {
    if (proposal.is_best_lead_time) return "bg-green-100 text-green-900 font-bold"
    return ""
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Proposal Comparison</h1>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Loading proposals...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Proposal Comparison</h1>
        <Card>
          <CardContent className="py-8 text-center text-red-500">
            Failed to load proposals
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!comparison?.proposals || comparison.proposals.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Proposal Comparison</h1>
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No proposals to compare yet. Request proposals from vendors to get started.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Proposal Comparison</h1>
        <p className="text-gray-600 mt-1">
          Compare vendor proposals side-by-side to make the best decision
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comparison.proposals.length}</div>
          </CardContent>
        </Card>

        {comparison.best_price && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Best Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {comparison.best_price.toLocaleString()} AED
              </div>
            </CardContent>
          </Card>
        )}

        {comparison.worst_price && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Highest Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {comparison.worst_price.toLocaleString()} AED
              </div>
            </CardContent>
          </Card>
        )}

        {comparison.best_lead_time && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Fastest Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {comparison.best_lead_time} days
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="text-center font-semibold">Credibility</TableHead>
                  <TableHead className="text-right font-semibold">Total Price</TableHead>
                  <TableHead className="text-center font-semibold">Lead Time</TableHead>
                  <TableHead className="text-center font-semibold">Specs Match</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                  <TableHead className="text-center font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.proposals.map((proposal) => (
                  <TableRow key={proposal.id} className="border-b">
                    {/* Vendor Name */}
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {proposal.vendor_name.charAt(0).toUpperCase()}
                        </div>
                        <span>{proposal.vendor_name}</span>
                      </div>
                    </TableCell>

                    {/* Credibility Score */}
                    <TableCell className="text-center">
                      <Badge className={`${getCredibilityColor(proposal.vendor_credibility)}`}>
                        <Star className="w-3 h-3 mr-1" />
                        {proposal.vendor_credibility}/100
                      </Badge>
                    </TableCell>

                    {/* Price */}
                    <TableCell className={`text-right font-semibold ${getPriceColor(proposal)}`}>
                      {proposal.total_price ? (
                        <div className="flex items-center justify-end gap-2">
                          <TrendingDown className="w-4 h-4" />
                          {proposal.total_price.toLocaleString()} AED
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>

                    {/* Lead Time */}
                    <TableCell className={`text-center ${getLeadTimeColor(proposal)}`}>
                      {proposal.lead_time_days ? (
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" />
                          {proposal.lead_time_days} days
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>

                    {/* Specs Match */}
                    <TableCell className="text-center">
                      {proposal.specs_match === true ? (
                        <div className="flex justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                      ) : proposal.specs_match === false ? (
                        <div className="flex justify-center">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="text-center">
                      {proposal.status === "selected" && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                      {proposal.status === "rejected" && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                      {proposal.status === "received" && (
                        <Badge variant="outline">Received</Badge>
                      )}
                      {proposal.status === "requested" && (
                        <Badge variant="outline" className="bg-yellow-50">
                          Requested
                        </Badge>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-center">
                      {proposal.status === "received" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => selectVendorMutation.mutate(proposal.id)}
                          disabled={selectVendorMutation.isPending}
                        >
                          Select
                        </Button>
                      )}
                      {proposal.status === "selected" && (
                        <Badge className="bg-green-100 text-green-800">Selected</Badge>
                      )}
                      {proposal.status === "rejected" && (
                        <Badge className="bg-gray-100 text-gray-800">Rejected</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparison Cards */}
      <div className="grid grid-cols-1 gap-4">
        {comparison.proposals.map((proposal) => (
          <Card key={`detailed-${proposal.id}`} className="overflow-hidden">
            <div className={`h-2 ${proposal.is_best_price ? "bg-green-500" : proposal.is_worst_price ? "bg-red-500" : "bg-gray-200"}`} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {proposal.vendor_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle>{proposal.vendor_name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Credibility: {proposal.vendor_credibility}/100
                    </p>
                  </div>
                </div>
                {proposal.status === "selected" && (
                  <Badge className="bg-green-100 text-green-800 h-fit">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className={`text-lg font-bold mt-1 ${proposal.is_best_price ? "text-green-600" : ""}`}>
                    {proposal.total_price
                      ? `${proposal.total_price.toLocaleString()} AED`
                      : "N/A"}
                  </p>
                  {proposal.is_best_price && (
                    <p className="text-xs text-green-600 mt-1">✓ Best Price</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Lead Time</p>
                  <p className={`text-lg font-bold mt-1 ${proposal.is_best_lead_time ? "text-green-600" : ""}`}>
                    {proposal.lead_time_days ? `${proposal.lead_time_days} days` : "N/A"}
                  </p>
                  {proposal.is_best_lead_time && (
                    <p className="text-xs text-green-600 mt-1">✓ Fastest</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Specs Match</p>
                  <div className="mt-2">
                    {proposal.specs_match === true ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : proposal.specs_match === false ? (
                      <XCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-2">
                    {proposal.status === "selected" && (
                      <Badge className="bg-green-100 text-green-800">Selected</Badge>
                    )}
                    {proposal.status === "rejected" && (
                      <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                    )}
                    {proposal.status === "received" && (
                      <Badge variant="outline">Received</Badge>
                    )}
                  </div>
                </div>
              </div>

              {proposal.discrepancies && Object.keys(proposal.discrepancies).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">Discrepancies Found</p>
                      <ul className="mt-2 space-y-1">
                        {Object.entries(proposal.discrepancies).map(([key, value]) => (
                          <li key={key} className="text-sm text-yellow-800">
                            • {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {proposal.status === "received" && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => selectVendorMutation.mutate(proposal.id)}
                    disabled={selectVendorMutation.isPending}
                  >
                    Select This Vendor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">How to Read This Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-3 h-3 bg-green-100 rounded mt-1" />
            <span>Green highlighting = Best offer in that category</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-3 h-3 bg-red-100 rounded mt-1" />
            <span>Red highlighting = Highest price (worst value)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0" />
            <span>Green checkmark = Specifications match your requirements</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0" />
            <span>Red X = Specifications don't match your requirements</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

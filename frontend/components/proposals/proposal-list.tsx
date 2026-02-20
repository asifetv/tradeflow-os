"use client"

import { useState } from "react"
import { useVendorProposals, useVendorProposal, useUpdateVendorProposal } from "@/lib/hooks/use-vendor-proposals"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"

interface ProposalListProps {
  dealId: string
}

export function ProposalList({ dealId }: ProposalListProps) {
  const { data: proposalsData, isLoading } = useVendorProposals({
    deal_id: dealId,
    skip: 0,
    limit: 100,
  })
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const handleStatusUpdate = async (proposalId: string, vendorName: string, newStatus: string) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(proposalId))
      const updateMutation = useUpdateVendorProposal(proposalId)

      await updateMutation.mutateAsync({
        status: newStatus as any,
      })

      toast.success(`✅ Proposal from ${vendorName} marked as ${newStatus}`)
    } catch (error) {
      toast.error("Failed to update proposal status")
      console.error(error)
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(proposalId)
        return next
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-blue-50"
      case "received":
        return "bg-green-50"
      case "selected":
        return "bg-green-100"
      case "rejected":
        return "bg-red-50"
      default:
        return "bg-gray-50"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <Badge variant="outline">Requested</Badge>
      case "received":
        return <Badge variant="secondary">Received</Badge>
      case "selected":
        return <Badge className="bg-green-600">Selected</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) return <div className="text-center py-8">Loading proposals...</div>

  if (!proposalsData?.items?.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">📬</div>
            <p className="text-gray-600">No proposals yet. Request proposals from vendors to get started.</p>
            <Link href={`/deals/${dealId}/request-proposals`}>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Request Proposals
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vendor Proposals ({proposalsData.items.length})</h3>
        <Link href={`/deals/${dealId}/request-proposals`}>
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Request More
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Specs Match</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposalsData.items.map((proposal) => (
              <TableRow key={proposal.id} className={getStatusColor(proposal.status)}>
                <TableCell className="font-semibold">
                  {proposal.vendor?.company_name || "Unknown Vendor"}
                </TableCell>
                <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                <TableCell>
                  {proposal.total_price ? `${proposal.total_price} ${proposal.currency}` : "-"}
                </TableCell>
                <TableCell>
                  {proposal.lead_time_days ? `${proposal.lead_time_days} days` : "-"}
                </TableCell>
                <TableCell>
                  {proposal.specs_match === true ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : proposal.specs_match === false ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/deals/${dealId}/proposals/${proposal.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>

                    {proposal.status === "requested" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(
                                proposal.id,
                                proposal.vendor?.company_name || "Vendor",
                                "received"
                              )
                            }
                            disabled={updatingIds.has(proposal.id)}
                          >
                            Mark as Received
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {proposal.status === "received" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            ⋮
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(
                                proposal.id,
                                proposal.vendor?.company_name || "Vendor",
                                "selected"
                              )
                            }
                            disabled={updatingIds.has(proposal.id)}
                          >
                            ✅ Select This Vendor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(
                                proposal.id,
                                proposal.vendor?.company_name || "Vendor",
                                "rejected"
                              )
                            }
                            disabled={updatingIds.has(proposal.id)}
                          >
                            ❌ Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {proposalsData.items.some((p) => p.status === "received") && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Link href={`/deals/${dealId}/proposals/compare`}>
            <Button className="w-full">
              Compare All Proposals
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

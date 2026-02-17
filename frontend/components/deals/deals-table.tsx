/**
 * Table view for deals
 */

"use client"

import Link from "next/link"

import { Deal } from "@/lib/types/deal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import { format } from "date-fns"

interface DealsTableProps {
  deals: Deal[]
  isLoading?: boolean
}

export function DealsTable({ deals, isLoading }: DealsTableProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deal Number</TableHead>
          <TableHead>Customer RFQ</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total Value</TableHead>
          <TableHead>Line Items</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal) => (
          <TableRow key={deal.id} className="cursor-pointer hover:bg-gray-50">
            <TableCell className="font-semibold">
              <Link href={`/deals/${deal.id}`} className="hover:underline">
                {deal.deal_number}
              </Link>
            </TableCell>
            <TableCell>{deal.customer_rfq_ref || "-"}</TableCell>
            <TableCell>
              <StatusBadge status={deal.status} />
            </TableCell>
            <TableCell>
              {deal.total_value !== null
                ? `${deal.currency} ${deal.total_value.toLocaleString()}`
                : "-"}
            </TableCell>
            <TableCell>{deal.line_items.length}</TableCell>
            <TableCell className="text-gray-500 text-sm">
              {format(new Date(deal.created_at), "MMM d, yyyy")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

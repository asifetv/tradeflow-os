"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCustomerPo, useDeleteCustomerPo, useUpdateCustomerPoStatus } from "@/lib/hooks/use-customer-pos"
import { useRouter, useParams } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CustomerPOStatus } from "@/lib/types/customer-po"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const VALID_TRANSITIONS: Record<CustomerPOStatus, CustomerPOStatus[]> = {
  [CustomerPOStatus.RECEIVED]: [CustomerPOStatus.ACKNOWLEDGED, CustomerPOStatus.CANCELLED],
  [CustomerPOStatus.ACKNOWLEDGED]: [CustomerPOStatus.IN_PROGRESS, CustomerPOStatus.CANCELLED],
  [CustomerPOStatus.IN_PROGRESS]: [CustomerPOStatus.FULFILLED, CustomerPOStatus.CANCELLED],
  [CustomerPOStatus.FULFILLED]: [],
  [CustomerPOStatus.CANCELLED]: [],
}

export default function CustomerPoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: customerPo } = useCustomerPo(id)
  const deleteCustomerPo = useDeleteCustomerPo()
  const updateCustomerPoStatus = useUpdateCustomerPoStatus(id)

  const handleDelete = async () => {
    await deleteCustomerPo.mutateAsync(id)
    router.push("/customer-pos")
  }

  const handleStatusChange = async (newStatus: CustomerPOStatus) => {
    await updateCustomerPoStatus.mutateAsync({ status: newStatus })
  }

  const validTransitions = customerPo ? VALID_TRANSITIONS[customerPo.status] : []

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{customerPo?.po_number || "PO"}</h1>
        <div className="flex gap-2">
          {validTransitions.length > 0 && (
            <Select onValueChange={(value) => handleStatusChange(value as CustomerPOStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                {validTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Link href={`/customer-pos/${id}/edit`}>
            <Button>Edit</Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete PO</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this PO? This action cannot be undone.
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

      {customerPo && (
        <Card>
          <CardHeader>
            <CardTitle>{customerPo.po_number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-sm">{customerPo.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-sm font-semibold">{customerPo.currency} {customerPo.total_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">PO Date</p>
                <p className="text-sm">{customerPo.po_date}</p>
              </div>
              {customerPo.delivery_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delivery Date</p>
                  <p className="text-sm">{customerPo.delivery_date}</p>
                </div>
              )}
            </div>

            {customerPo.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-sm">{customerPo.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

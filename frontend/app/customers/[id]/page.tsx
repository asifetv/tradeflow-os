"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { CustomerCard } from "@/components/customers/customer-card"
import { useCustomer, useDeleteCustomer } from "@/lib/hooks/use-customers"
import { useRouter } from "next/navigation"
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

interface CustomerDetailPageProps {
  params: {
    id: string
  }
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const router = useRouter()
  const { data: customer } = useCustomer(params.id)
  const deleteCustomer = useDeleteCustomer()

  const handleDelete = async () => {
    await deleteCustomer.mutateAsync(params.id)
    router.push("/customers")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{customer?.company_name || "Customer"}</h1>
        <div className="flex gap-2">
          <Link href={`/customers/${params.id}/edit`}>
            <Button>Edit</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this customer? This action cannot be undone.
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

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="pos">POs</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <CustomerCard customerId={params.id} />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <div className="text-muted-foreground">Deals linked to this customer will appear here.</div>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <div className="text-muted-foreground">Quotes linked to this customer will appear here.</div>
        </TabsContent>

        <TabsContent value="pos" className="mt-6">
          <div className="text-muted-foreground">Customer POs linked to this customer will appear here.</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

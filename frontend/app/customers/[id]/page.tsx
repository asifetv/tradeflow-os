"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CustomerCard } from "@/components/customers/customer-card"
import { CustomerDeals } from "@/components/customers/customer-deals"
import { CustomerQuotes } from "@/components/customers/customer-quotes"
import { CustomerPOs } from "@/components/customers/customer-pos"
import { useCustomer, useDeleteCustomer } from "@/lib/hooks/use-customers"
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

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { data: customer } = useCustomer(id)
  const deleteCustomer = useDeleteCustomer()

  const handleDelete = async () => {
    await deleteCustomer.mutateAsync(id)
    router.push("/customers")
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <Link href="/customers" className="inline-block mb-4">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Button>
        </Link>
        <div className="flex items-center gap-4 justify-between mb-6">
          <h1 className="text-3xl font-bold">{customer?.company_name || "Customer"}</h1>
        <div className="flex gap-2">
          <Link href={`/customers/${id}/edit`}>
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
          <CustomerCard customerId={id} />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <CustomerDeals customerId={id} />
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <CustomerQuotes customerId={id} />
        </TabsContent>

        <TabsContent value="pos" className="mt-6">
          <CustomerPOs customerId={id} />
        </TabsContent>
      </Tabs>
      </div>
    </>
  )
}

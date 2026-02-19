import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CustomerTable } from "@/components/customers/customer-table"

export default function CustomersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Link href="/customers/new">
          <Button>New Customer</Button>
        </Link>
      </div>

      <CustomerTable />
    </div>
  )
}

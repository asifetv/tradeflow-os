import { Button } from "@/components/ui/button"
import { CustomerPosTable } from "@/components/customer-pos/customer-pos-table"
import Link from "next/link"

export default function CustomerPosPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customer POs</h1>
        <Link href="/customer-pos/new">
          <Button>New PO</Button>
        </Link>
      </div>

      <CustomerPosTable />
    </div>
  )
}

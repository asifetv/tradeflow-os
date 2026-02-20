import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CustomerTable } from "@/components/customers/customer-table"
import { Plus } from "lucide-react"

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Customers
              </h1>
              <p className="text-muted-foreground mt-2">Manage your customer relationships</p>
            </div>
            <Link href="/customers/new">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4" />
                New Customer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <CustomerTable />
        </div>
      </div>
    </div>
  )
}

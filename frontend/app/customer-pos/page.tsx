import { Button } from "@/components/ui/button"
import { CustomerPosTable } from "@/components/customer-pos/customer-pos-table"
import Link from "next/link"
import { Plus, ArrowLeft } from "lucide-react"

export default function CustomerPosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                Purchase Orders
              </h1>
              <p className="text-muted-foreground mt-2">Track customer purchase orders</p>
            </div>
            <Link href="/customer-pos/new">
              <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4" />
                New PO
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <CustomerPosTable />
        </div>
      </div>
    </div>
  )
}

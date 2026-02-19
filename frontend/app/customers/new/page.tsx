import { CustomerForm } from "@/components/customers/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Create New Customer
          </h1>
          <p className="text-muted-foreground mt-2">Add a new customer to the system</p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <CustomerForm />
        </div>
      </div>
    </div>
  )
}

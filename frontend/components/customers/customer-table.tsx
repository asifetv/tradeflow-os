"use client"

import Link from "next/link"
import { useCustomers } from "@/lib/hooks/use-customers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CustomerTable() {
  const { data, isLoading } = useCustomers(0, 50)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const customers = data?.customers || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {customers.length} Customer{customers.length !== 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <p className="text-muted-foreground">No customers found. Create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold">Code</th>
                  <th className="text-left py-2 px-4 font-semibold">Company</th>
                  <th className="text-left py-2 px-4 font-semibold">Country</th>
                  <th className="text-left py-2 px-4 font-semibold">Contact</th>
                  <th className="text-left py-2 px-4 font-semibold">Status</th>
                  <th className="text-left py-2 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-2 px-4 font-mono text-sm">{customer.customer_code}</td>
                    <td className="py-2 px-4">{customer.company_name}</td>
                    <td className="py-2 px-4">{customer.country}</td>
                    <td className="py-2 px-4 text-sm">
                      {customer.primary_contact_name ? (
                        <div>
                          <div>{customer.primary_contact_name}</div>
                          <div className="text-gray-500">{customer.primary_contact_email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        customer.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <Link href={`/customers/${customer.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

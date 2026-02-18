"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Customer } from "@/lib/types/customer"
import { customerFormSchema, type CustomerFormValues } from "@/lib/validations/customer"
import { useCreateCustomer, useUpdateCustomer } from "@/lib/hooks/use-customers"

interface CustomerFormProps {
  initialCustomer?: Customer
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Saudi Arabia",
  "UAE",
  "Kuwait",
  "Qatar",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
]

export function CustomerForm({ initialCustomer }: CustomerFormProps) {
  const router = useRouter()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer(initialCustomer?.id || "")

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialCustomer || {
      customer_code: "",
      company_name: "",
      country: "",
      is_active: true,
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function onSubmit(data: CustomerFormValues) {
    try {
      if (initialCustomer) {
        await updateMutation.mutateAsync(data)
        router.push(`/customers/${initialCustomer.id}`)
      } else {
        const newCustomer = await createMutation.mutateAsync(data)
        router.push(`/customers/${newCustomer.id}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialCustomer ? "Edit Customer" : "Create New Customer"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Code */}
            <FormField
              control={form.control}
              name="customer_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CUST-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name */}
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New York" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Street address..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Name */}
            <FormField
              control={form.control}
              name="primary_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Email */}
            <FormField
              control={form.control}
              name="primary_contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Phone */}
            <FormField
              control={form.control}
              name="primary_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1-555-0123" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Terms */}
            <FormField
              control={form.control}
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Net 60"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Limit */}
            <FormField
              control={form.control}
              name="credit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Active */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Active Customer</FormLabel>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : initialCustomer ? "Update Customer" : "Create Customer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

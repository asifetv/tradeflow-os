"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { vendorApi } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const vendorSchema = z.object({
  vendor_code: z.string().min(2, "Vendor code is required"),
  company_name: z.string().min(2, "Company name is required"),
  country: z.string().min(2, "Country is required"),
  credibility_score: z.coerce.number().min(0).max(100).optional(),
  primary_contact_name: z.string().optional(),
  primary_contact_email: z.string().email().optional().or(z.literal("")),
  primary_contact_phone: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})

type VendorFormValues = z.infer<typeof vendorSchema>

export default function NewVendorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      vendor_code: "",
      company_name: "",
      country: "",
      credibility_score: 50,
      primary_contact_name: "",
      primary_contact_email: "",
      primary_contact_phone: "",
      payment_terms: "",
      notes: "",
    },
  })

  async function onSubmit(values: VendorFormValues) {
    setIsLoading(true)
    try {
      await vendorApi.create({
        ...values,
        primary_contact_email: values.primary_contact_email || undefined,
      })
      toast.success("Vendor created successfully")
      router.push("/vendors")
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create vendor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendors">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Vendor</h1>
          <p className="text-gray-600">Register a new vendor in your network</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>

                <FormField
                  control={form.control}
                  name="vendor_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Code</FormLabel>
                      <FormControl>
                        <Input placeholder="VND-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ARAMCO Trading" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Saudi Arabia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credibility_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credibility Score (0-100)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" placeholder="75" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">Contact Information</h3>

                <FormField
                  control={form.control}
                  name="primary_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primary_contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@vendor.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primary_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+966 12 345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Business Terms */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">Business Terms</h3>

                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="Net 30, 2/10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional information about this vendor..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Vendor"}
                </Button>
                <Link href="/vendors">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

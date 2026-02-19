"use client"

import { useRouter } from "next/navigation"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"

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

import { CustomerPO } from "@/lib/types/customer-po"
import { customerPoFormSchema, type CustomerPoFormValues } from "@/lib/validations/customer-po"
import { useCreateCustomerPo, useUpdateCustomerPo } from "@/lib/hooks/use-customer-pos"
import { CustomerSelector } from "@/components/customers/customer-selector"
import { DealSelector } from "@/components/deals/deal-selector"

interface CustomerPoFormProps {
  initialCustomerPo?: CustomerPO
}

export function CustomerPoForm({ initialCustomerPo }: CustomerPoFormProps) {
  const router = useRouter()
  const createMutation = useCreateCustomerPo()
  const updateMutation = useUpdateCustomerPo(initialCustomerPo?.id || "")

  const form = useForm<CustomerPoFormValues>({
    resolver: zodResolver(customerPoFormSchema),
    defaultValues: initialCustomerPo || {
      internal_ref: "",
      po_number: "",
      customer_id: "",
      deal_id: undefined,
      quote_id: undefined,
      line_items: [],
      total_amount: 0,
      currency: "AED",
      po_date: new Date().toISOString().split("T")[0],
      delivery_date: undefined,
      notes: undefined,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function onSubmit(data: CustomerPoFormValues) {
    try {
      // Transform form data to match backend schema
      const payload = {
        ...data,
        deal_id: data.deal_id || undefined,
        quote_id: data.quote_id || undefined,
        delivery_date: data.delivery_date || undefined,
        notes: data.notes || undefined,
      }

      console.log("CustomerPO form payload:", JSON.stringify(payload, null, 2))

      if (initialCustomerPo) {
        await updateMutation.mutateAsync(payload as any)
        router.push(`/customer-pos/${initialCustomerPo.id}`)
      } else {
        const newCustomerPo = await createMutation.mutateAsync(payload as any)
        router.push(`/customer-pos/${newCustomerPo.id}`)
      }
    } catch (error: any) {
      console.error("Error submitting form:", error)
      if (error.response?.data) {
        console.error("Backend validation error details:", error.response.data)
      }
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="internal_ref"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Reference *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CPO-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="po_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Customer PO number..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <FormControl>
                        <CustomerSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deal_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal (Optional)</FormLabel>
                      <FormControl>
                        <DealSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="quote_id"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Quote (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Link to a quote..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Line Items</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name={`line_items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Input placeholder="Item description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., MT" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`line_items.${index}.total_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    description: "",
                    quantity: 0,
                    unit: "",
                    unit_price: 0,
                    total_price: 0,
                  })
                }
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>

            {/* Financial Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="total_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="AED" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dates Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dates</h3>
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="po_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : initialCustomerPo ? "Update PO" : "Create PO"}
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

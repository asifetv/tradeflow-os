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
      line_items: [],
      total_amount: 0,
      currency: "AED",
      po_date: new Date().toISOString().split("T")[0],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function onSubmit(data: CustomerPoFormValues) {
    try {
      if (initialCustomerPo) {
        await updateMutation.mutateAsync(data)
        router.push(`/customer-pos/${initialCustomerPo.id}`)
      } else {
        const newCustomerPo = await createMutation.mutateAsync(data)
        router.push(`/customer-pos/${newCustomerPo.id}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialCustomerPo ? "Edit Customer PO" : "Create New Customer PO"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Internal Reference */}
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

            {/* PO Number */}
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

            {/* Customer */}
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

            {/* Deal ID */}
            <FormField
              control={form.control}
              name="deal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Link to a deal..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quote ID */}
            <FormField
              control={form.control}
              name="quote_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Link to a quote..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Line Items */}
            <div>
              <FormLabel>Line Items</FormLabel>
              <div className="space-y-4 mt-2">
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
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
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

            {/* Total Amount */}
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
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency */}
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

            {/* PO Date */}
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

            {/* Delivery Date */}
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

            {/* Notes */}
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

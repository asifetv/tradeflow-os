"use client"

import { useRouter } from "next/navigation"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import { useQuotes } from "@/lib/hooks/use-quotes"
import { CustomerSelector } from "@/components/customers/customer-selector"
import { DealSelector } from "@/components/deals/deal-selector"
import { QuoteSelector } from "@/components/quotes/quote-selector"

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

  // Watch form fields for auto-population
  const customerId = useWatch({ control: form.control, name: "customer_id" })
  const dealId = useWatch({ control: form.control, name: "deal_id" })
  const quoteId = useWatch({ control: form.control, name: "quote_id" })

  // Fetch quotes filtered by customer and deal
  const { data: quotesData } = useQuotes(
    0,
    50,
    customerId || undefined,
    dealId || undefined,
    undefined
  )
  const quotes = quotesData?.quotes || []

  // Auto-populate when quote is selected - only when we have quotes loaded and a quoteId
  useEffect(() => {
    if (quoteId && quotes && quotes.length > 0) {
      const selectedQuote = quotes.find(q => q.id === quoteId)
      if (selectedQuote) {
        console.log("Auto-populating from quote:", selectedQuote)

        // Auto-populate line items from quote
        if (selectedQuote.line_items && selectedQuote.line_items.length > 0) {
          form.setValue("line_items", selectedQuote.line_items.map((item: any) => ({
            description: item.description,
            material_spec: item.material_spec || null,
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
            unit: item.unit,
            unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
            total_price: typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price,
          })), { shouldValidate: false })
        }

        // Auto-populate amount and currency
        const amount = typeof selectedQuote.total_amount === 'string'
          ? parseFloat(selectedQuote.total_amount)
          : selectedQuote.total_amount

        form.setValue("total_amount", amount, { shouldValidate: false })
        form.setValue("currency", selectedQuote.currency, { shouldValidate: false })

        console.log("Auto-populated total_amount:", amount)
      }
    }
  }, [quoteId, quotes, form])

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
        // Exclude auto-generated internal_ref on creation
        const { internal_ref, ...createData } = payload
        const newCustomerPo = await createMutation.mutateAsync(createData as any)
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
              {initialCustomerPo && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Internal Reference</p>
                  <p className="text-lg font-semibold text-slate-900">{initialCustomerPo.internal_ref}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
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
                    <FormDescription>
                      Select a quote to auto-populate line items and amount
                    </FormDescription>
                    <FormControl>
                      <QuoteSelector
                        value={field.value}
                        onChange={field.onChange}
                        customerId={customerId || undefined}
                        dealId={dealId || undefined}
                      />
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

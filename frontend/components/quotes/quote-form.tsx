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

import { Quote } from "@/lib/types/quote"
import { quoteFormSchema, type QuoteFormValues } from "@/lib/validations/quote"
import { useCreateQuote, useUpdateQuote } from "@/lib/hooks/use-quotes"
import { CustomerSelector } from "@/components/customers/customer-selector"

interface QuoteFormProps {
  initialQuote?: Quote
}

export function QuoteForm({ initialQuote }: QuoteFormProps) {
  const router = useRouter()
  const createMutation = useCreateQuote()
  const updateMutation = useUpdateQuote(initialQuote?.id || "")

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: initialQuote || {
      quote_number: "",
      customer_id: "",
      title: "",
      line_items: [],
      total_amount: 0,
      currency: "AED",
      validity_days: 30,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function onSubmit(data: QuoteFormValues) {
    try {
      if (initialQuote) {
        await updateMutation.mutateAsync(data)
        router.push(`/quotes/${initialQuote.id}`)
      } else {
        const newQuote = await createMutation.mutateAsync(data)
        router.push(`/quotes/${newQuote.id}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialQuote ? "Edit Quote" : "Create New Quote"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Quote Number */}
            <FormField
              control={form.control}
              name="quote_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., QT-2024-001" {...field} />
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

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Quote title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Quote description..." {...field} value={field.value ?? ""} />
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

                    <FormField
                      control={form.control}
                      name={`line_items.${index}.material_spec`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Spec</FormLabel>
                          <FormControl>
                            <Input placeholder="Material specification..." {...field} value={field.value ?? ""} />
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

            {/* Payment Terms */}
            <FormField
              control={form.control}
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Net 30" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Validity Days */}
            <FormField
              control={form.control}
              name="validity_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validity Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : initialQuote ? "Update Quote" : "Create Quote"}
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

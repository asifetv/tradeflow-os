"use client"

import { useRouter } from "next/navigation"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X, Check } from "lucide-react"
import { useEffect, useState } from "react"

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
import { useDeal } from "@/lib/hooks/use-deals"
import { CustomerSelector } from "@/components/customers/customer-selector"
import { DealSelector } from "@/components/deals/deal-selector"

interface QuoteFormProps {
  initialQuote?: Quote
  extractedQuoteData?: any
}

export function QuoteForm({ initialQuote, extractedQuoteData }: QuoteFormProps) {
  const router = useRouter()
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showDataAppliedAlert, setShowDataAppliedAlert] = useState(false)
  const createMutation = useCreateQuote()
  const updateMutation = useUpdateQuote(initialQuote?.id || "")

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: initialQuote || {
      customer_id: "",
      deal_id: undefined,
      title: "",
      description: undefined,
      line_items: [],
      total_amount: 0,
      currency: "AED",
      payment_terms: undefined,
      delivery_terms: undefined,
      validity_days: 30,
      issue_date: undefined,
      expiry_date: undefined,
      notes: undefined,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  })

  // Watch for changes to auto-populate
  const customerId = useWatch({ control: form.control, name: "customer_id" })
  const dealId = useWatch({ control: form.control, name: "deal_id" })

  // Fetch deal details to auto-populate customer when deal is selected
  const { data: dealData } = useDeal(dealId || "")

  // Auto-populate customer when deal is selected
  useEffect(() => {
    if (dealId && dealData && dealData.customer_id) {
      // Auto-populate customer from deal
      form.setValue("customer_id", dealData.customer_id, { shouldValidate: false })
    }
  }, [dealId, dealData, form])

  // Clear deal if customer is cleared
  useEffect(() => {
    if (!customerId && dealId) {
      form.setValue("deal_id", undefined, { shouldValidate: false })
    }
  }, [customerId, dealId, form])

  // Apply extracted data to form if available
  useEffect(() => {
    if (extractedQuoteData && initialQuote) {
      console.log("[QuoteForm] Applying extracted data:", extractedQuoteData)

      // Update title
      if (extractedQuoteData.title) {
        form.setValue("title", extractedQuoteData.title)
      }

      // Update financial fields
      if (extractedQuoteData.total_amount !== undefined) {
        form.setValue("total_amount", extractedQuoteData.total_amount)
      }
      if (extractedQuoteData.currency) {
        form.setValue("currency", extractedQuoteData.currency)
      }

      // Update other fields
      if (extractedQuoteData.payment_terms) {
        form.setValue("payment_terms", extractedQuoteData.payment_terms)
      }
      if (extractedQuoteData.delivery_terms) {
        form.setValue("delivery_terms", extractedQuoteData.delivery_terms)
      }
      if (extractedQuoteData.validity_days) {
        form.setValue("validity_days", extractedQuoteData.validity_days)
      }

      // Update line items if provided
      if (extractedQuoteData.line_items && Array.isArray(extractedQuoteData.line_items)) {
        // Clear existing line items
        while (fields.length > 0) {
          remove(0)
        }
        // Add extracted line items
        extractedQuoteData.line_items.forEach((item: any) => {
          append({
            description: item.description || "",
            material_spec: item.material_spec,
            quantity: item.quantity || 0,
            unit: item.unit || "",
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
          })
        })
      }

      setShowDataAppliedAlert(true)
      setTimeout(() => setShowDataAppliedAlert(false), 5000)
    }
  }, [extractedQuoteData, initialQuote, form, fields, append, remove])

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function onSubmit(data: QuoteFormValues) {
    try {
      // Send data directly - backend will handle partial updates
      const payload = {
        ...data,
        // Convert empty strings to undefined for optional fields
        deal_id: data.deal_id || undefined,
        description: data.description || undefined,
        payment_terms: data.payment_terms || undefined,
        delivery_terms: data.delivery_terms || undefined,
        issue_date: data.issue_date || undefined,
        expiry_date: data.expiry_date || undefined,
        notes: data.notes || undefined,
      }

      console.log("Quote form payload:", JSON.stringify(payload, null, 2))

      if (initialQuote) {
        await updateMutation.mutateAsync(payload as any)
        setSuccessMessage("Quote updated successfully!")
        setShowSuccessAlert(true)
      } else {
        // Exclude auto-generated quote_number on creation
        const { quote_number, ...createData } = payload
        const newQuote = await createMutation.mutateAsync(createData as any)
        setSuccessMessage("Quote created successfully!")
        setShowSuccessAlert(true)
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
        {showSuccessAlert && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg flex items-start gap-3 animate-in fade-in">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Success</p>
              <p className="text-sm text-green-800 mt-1">{successMessage}</p>
            </div>
          </div>
        )}
        {showDataAppliedAlert && extractedQuoteData && (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg flex items-start gap-3 animate-in fade-in">
            <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">✅ Document Data Applied</p>
              <p className="text-sm text-blue-700 mt-1">
                Extracted data from the quote document has been automatically populated. Please verify and edit as needed.
              </p>
            </div>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              {initialQuote && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Quote Number</p>
                  <p className="text-lg font-semibold text-slate-900">{initialQuote.quote_number}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
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
                          customerId={customerId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Quote description..." {...field} value={field.value ?? ""} />
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

                    <div className="grid grid-cols-2 gap-3">
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
                                onChange={(e) => {
                                  const qty = e.target.value ? parseFloat(e.target.value) : 0
                                  field.onChange(qty)
                                  // Auto-calculate total
                                  const unitPrice = form.getValues(`line_items.${index}.unit_price`) || 0
                                  form.setValue(`line_items.${index}.total_price`, qty * unitPrice)
                                }}
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
                              <Input placeholder="e.g., MT, Barrels" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
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
                                onChange={(e) => {
                                  const price = e.target.value ? parseFloat(e.target.value) : 0
                                  field.onChange(price)
                                  // Auto-calculate total
                                  const qty = form.getValues(`line_items.${index}.quantity`) || 0
                                  form.setValue(`line_items.${index}.total_price`, qty * price)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`line_items.${index}.total_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Price *</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                  className="flex-1"
                                />
                                <div className="text-xs text-gray-500 pt-2 whitespace-nowrap">
                                  {(form.watch(`line_items.${index}.quantity`) || 0) > 0 &&
                                   (form.watch(`line_items.${index}.unit_price`) || 0) > 0 ? (
                                    <span className="text-blue-600 font-semibold">
                                      Auto: {((form.watch(`line_items.${index}.quantity`) || 0) * (form.watch(`line_items.${index}.unit_price`) || 0)).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span>Manual entry</span>
                                  )}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 30)}
                        />
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
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="delivery_terms"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Delivery Terms</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., FOB, CIF, DDP..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

/**
 * Deal form component for create/edit operations
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2, Check } from "lucide-react"

import { Deal } from "@/lib/types/deal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { dealFormSchema, DealFormValues } from "@/lib/validations/deal"
import { useCreateDeal, useUpdateDeal } from "@/lib/hooks/use-deals"
import { CustomerSelector } from "@/components/customers/customer-selector"
import { mapRFQToDeal, applyExtractedDataToForm } from "@/lib/utils/extract-to-form"

interface DealFormProps {
  initialDeal?: Deal
  onSubmit?: (data: DealFormValues) => void
  extractedRFQData?: any
}

export function DealForm({ initialDeal, onSubmit: onSubmitCallback, extractedRFQData }: DealFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDataAppliedAlert, setShowDataAppliedAlert] = useState(false)

  const createDealMutation = useCreateDeal()
  const updateDealMutation = useUpdateDeal(initialDeal?.id || "")

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: initialDeal
      ? {
          deal_number: initialDeal.deal_number,
          customer_id: initialDeal.customer_id,
          customer_rfq_ref: initialDeal.customer_rfq_ref,
          description: initialDeal.description,
          currency: initialDeal.currency,
          line_items: initialDeal.line_items,
          total_value: initialDeal.total_value,
          total_cost: initialDeal.total_cost,
          estimated_margin_pct: initialDeal.estimated_margin_pct,
          notes: initialDeal.notes,
        }
      : {
          customer_id: undefined,
          customer_rfq_ref: undefined,
          description: "",
          currency: "AED",
          line_items: [],
          total_value: undefined,
          total_cost: undefined,
          estimated_margin_pct: undefined,
          notes: undefined,
        },
  })

  const { control, handleSubmit, formState: { errors }, setValue } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  })

  // Apply extracted RFQ data to form
  useEffect(() => {
    if (extractedRFQData) {
      const mappedData = mapRFQToDeal(extractedRFQData)
      const currentValues = form.getValues()
      const updatedValues = applyExtractedDataToForm(currentValues, mappedData)

      // Update all form fields
      Object.keys(mappedData).forEach((key) => {
        const value = (mappedData as any)[key]
        if (key === "line_items" && Array.isArray(value)) {
          // Clear existing line items and add new ones
          while (fields.length > 0) {
            remove(0)
          }
          value.forEach((item) => {
            append(item)
          })
        } else {
          setValue(key as keyof DealFormValues, value)
        }
      })

      setShowDataAppliedAlert(true)
      setTimeout(() => setShowDataAppliedAlert(false), 5000)
    }
  }, [extractedRFQData])

  const handleFormSubmit = async (data: DealFormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Form data being sent:", JSON.stringify(data, null, 2))
      if (onSubmitCallback) {
        onSubmitCallback(data)
      } else if (initialDeal) {
        await updateDealMutation.mutateAsync(data)
        router.push(`/deals/${initialDeal.id}`)
      } else {
        // Exclude auto-generated deal_number on creation
        const { deal_number, ...createData } = data
        const newDeal = await createDealMutation.mutateAsync(createData)
        router.push(`/deals/${newDeal.id}`)
      }
    } catch (error: any) {
      console.error("Error submitting deal form:", error)
      if (error.response?.data) {
        console.error("Backend validation error:", JSON.stringify(error.response.data, null, 2))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {showDataAppliedAlert && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Data Applied Successfully</p>
              <p className="text-sm text-green-800 mt-1">
                Extracted data has been applied to the form. Please review and adjust as needed.
              </p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

            {initialDeal && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">Deal Number</p>
                <p className="text-lg font-semibold text-slate-900">{initialDeal.deal_number}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  placeholder="AED"
                  {...form.register("currency")}
                />
                {errors.currency && (
                  <p className="text-sm text-red-600 mt-1">{errors.currency.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_rfq_ref">Customer RFQ Reference</Label>
                <Input
                  id="customer_rfq_ref"
                  placeholder="e.g., RFQ-2024-001"
                  {...form.register("customer_rfq_ref", {
                    setValueAs: (value) => value === "" ? null : value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="customer_id">Customer</Label>
                <CustomerSelector
                  value={form.watch("customer_id") || undefined}
                  onChange={(value) => form.setValue("customer_id", value || null)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description*</Label>
              <Textarea
                id="description"
                placeholder="Deal description and details..."
                rows={4}
                {...form.register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Financial Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Financial Information</h3>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <Label htmlFor="total_value">Total Value</Label>
                <Input
                  id="total_value"
                  type="number"
                  placeholder="0"
                  step="0.01"
                  {...form.register("total_value", {
                    setValueAs: (value) => value === "" ? null : Number(value)
                  })}
                />
              </div>

              <div>
                <Label htmlFor="total_cost">Total Cost</Label>
                <Input
                  id="total_cost"
                  type="number"
                  placeholder="0"
                  step="0.01"
                  {...form.register("total_cost", {
                    setValueAs: (value) => value === "" ? null : Number(value)
                  })}
                />
              </div>

              <div>
                <Label htmlFor="estimated_margin_pct">Est. Margin %</Label>
                <Input
                  id="estimated_margin_pct"
                  type="number"
                  placeholder="0"
                  step="0.01"
                  {...form.register("estimated_margin_pct", {
                    setValueAs: (value) => value === "" ? null : Number(value)
                  })}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Line Items</h3>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Description</Label>
                      <Input
                        placeholder="Item description"
                        {...form.register(`line_items.${index}.description`)}
                      />
                    </div>
                    <div>
                      <Label>Material Spec</Label>
                      <Input
                        placeholder="e.g., API 5L, Grade X52"
                        {...form.register(`line_items.${index}.material_spec`)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...form.register(`line_items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        onChange={(e) => {
                          form.setValue(`line_items.${index}.quantity`, parseFloat(e.target.value) || 0)
                          const unitPrice = form.getValues(`line_items.${index}.unit_price`) || 0
                          const quantity = parseFloat(e.target.value) || 0
                          form.setValue(`line_items.${index}.unit_total`, quantity * unitPrice)
                        }}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        placeholder="e.g., MT, KM, Barrels"
                        {...form.register(`line_items.${index}.unit`)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...form.register(`line_items.${index}.unit_price`, {
                          valueAsNumber: true,
                        })}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0
                          form.setValue(`line_items.${index}.unit_price`, price)
                          const quantity = form.getValues(`line_items.${index}.quantity`) || 0
                          form.setValue(`line_items.${index}.unit_total`, quantity * price)
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter price per unit
                      </p>
                    </div>
                    <div>
                      <Label>Total Price</Label>
                      <div className="space-y-2">
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-semibold text-blue-700">
                          {(form.watch(`line_items.${index}.unit_total`) || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <p className="text-xs text-gray-500">
                          {(form.watch(`line_items.${index}.quantity`) || 0) > 0 &&
                           (form.watch(`line_items.${index}.unit_price`) || 0) > 0
                            ? `Auto: ${(form.watch(`line_items.${index}.quantity`) || 0)} × ${(form.watch(`line_items.${index}.unit_price`) || 0)}`
                            : 'Qty × Unit Price'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <Label>Delivery Date</Label>
                      <Input
                        type="date"
                        {...form.register(`line_items.${index}.required_delivery_date`)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  description: "",
                  material_spec: "",
                  quantity: 0,
                  unit: "",
                  unit_price: 0,
                  unit_total: 0,
                  required_delivery_date: "",
                })
              }
            >
              Add Line Item
            </Button>
          </div>

          {/* Additional Information Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this deal..."
              rows={3}
              {...form.register("notes", {
                setValueAs: (value) => value === "" ? null : value
              })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : initialDeal ? "Update Deal" : "Create Deal"}
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
      </CardContent>
    </Card>
  )
}

/**
 * Deal form component for create/edit operations
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2 } from "lucide-react"

import { Deal } from "@/lib/types/deal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { dealFormSchema, DealFormValues } from "@/lib/validations/deal"
import { useCreateDeal, useUpdateDeal } from "@/lib/hooks/use-deals"

interface DealFormProps {
  initialDeal?: Deal
  onSubmit?: (data: DealFormValues) => void
}

export function DealForm({ initialDeal, onSubmit: onSubmitCallback }: DealFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          deal_number: "",
          description: "",
          currency: "AED",
          line_items: [],
        },
  })

  const { control, handleSubmit, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  })

  const handleFormSubmit = async (data: DealFormValues) => {
    setIsSubmitting(true)
    try {
      if (onSubmitCallback) {
        onSubmitCallback(data)
      } else if (initialDeal) {
        await updateDealMutation.mutateAsync(data)
      } else {
        const newDeal = await createDealMutation.mutateAsync(data)
        router.push(`/deals/${newDeal.id}`)
      }
    } catch (error) {
      console.error("Error submitting deal form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialDeal ? "Edit Deal" : "Create New Deal"}</CardTitle>
        <CardDescription>
          {initialDeal ? "Modify deal details" : "Add a new deal to the system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deal_number">Deal Number*</Label>
                <Input
                  id="deal_number"
                  placeholder="e.g., DEAL-001"
                  {...form.register("deal_number")}
                  disabled={!!initialDeal}
                />
                {errors.deal_number && (
                  <p className="text-sm text-red-600 mt-1">{errors.deal_number.message}</p>
                )}
              </div>

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
                  {...form.register("customer_rfq_ref")}
                />
              </div>

              <div>
                <Label htmlFor="customer_id">Customer ID</Label>
                <Input
                  id="customer_id"
                  placeholder="Customer UUID"
                  {...form.register("customer_id")}
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>

            <div className="grid grid-cols-3 gap-4">
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Line Items</h3>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...form.register(`line_items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        placeholder="e.g., MT, KM"
                        {...form.register(`line_items.${index}.unit`)}
                      />
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
                  required_delivery_date: "",
                })
              }
            >
              Add Line Item
            </Button>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this deal..."
              rows={3}
              {...form.register("notes")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : initialDeal ? "Update Deal" : "Create Deal"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

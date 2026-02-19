/**
 * Zod validation schemas for deals
 */

import { z } from "zod"
import { DealStatus } from "@/lib/types/deal"

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  material_spec: z.string().min(1, "Material spec is required"),
  quantity: z.number().nonnegative("Quantity must be non-negative"),
  unit: z.string().min(1, "Unit is required"),
  unit_price: z.number().optional().nullable(),
  unit_total: z.number().optional().nullable(),
  required_delivery_date: z.string().min(1, "Delivery date is required"),
})

export const dealFormSchema = z.object({
  deal_number: z.string().optional().or(z.literal("")),
  customer_id: z.string().optional().nullable(),
  customer_rfq_ref: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  currency: z.string().min(1, "Currency is required").default("AED"),
  line_items: z.array(lineItemSchema).optional().default([]),
  total_value: z.number().optional().nullable(),
  total_cost: z.number().optional().nullable(),
  estimated_margin_pct: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type DealFormValues = z.infer<typeof dealFormSchema>

export const dealStatusUpdateSchema = z.object({
  status: z.nativeEnum(DealStatus),
})

export type DealStatusUpdateValues = z.infer<typeof dealStatusUpdateSchema>

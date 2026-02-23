/**
 * Zod validation schemas for customer POs
 */

import { z } from "zod"
import { CustomerPOStatus } from "@/lib/types/customer-po"

export const customerPoLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  material_spec: z.string().optional().nullable(),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().optional().nullable(),
  unit_price: z.number().nonnegative("Unit price must be non-negative"),
  total_price: z.number().nonnegative("Total price must be non-negative"),
})

export const customerPoFormSchema = z.object({
  internal_ref: z
    .string()
    .max(50, "Internal reference must be 50 characters or less")
    .optional()
    .or(z.literal("")),
  po_number: z
    .string()
    .min(1, "PO number is required")
    .max(100, "PO number must be 100 characters or less"),
  customer_id: z.string().uuid("Customer must be a valid UUID"),
  deal_id: z.string().uuid("Deal must be a valid UUID").optional().nullable(),
  quote_id: z.string().uuid("Quote must be a valid UUID").optional().nullable(),
  line_items: z.array(customerPoLineItemSchema).optional().default([]),
  total_amount: z.number().nonnegative("Total amount must be non-negative"),
  currency: z.string().min(1, "Currency is required").default("AED"),
  po_date: z.string().min(1, "PO date is required"),
  delivery_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CustomerPoFormValues = z.infer<typeof customerPoFormSchema>

export const customerPoStatusUpdateSchema = z.object({
  status: z.nativeEnum(CustomerPOStatus),
})

export type CustomerPoStatusUpdateValues = z.infer<typeof customerPoStatusUpdateSchema>

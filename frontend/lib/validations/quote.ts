/**
 * Zod validation schemas for quotes
 */

import { z } from "zod"
import { QuoteStatus } from "@/lib/types/quote"

export const quoteLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  material_spec: z.string().optional().nullable(),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().optional().nullable(),
  unit_price: z.number().nonnegative("Unit price must be non-negative"),
  total_price: z.number().nonnegative("Total price must be non-negative"),
})

export const quoteFormSchema = z.object({
  quote_number: z
    .string()
    .max(50, "Quote number must be 50 characters or less")
    .optional()
    .or(z.literal("")),
  customer_id: z.string().uuid("Customer must be a valid UUID"),
  deal_id: z.string().uuid("Deal must be a valid UUID").optional().nullable(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z.string().optional().nullable(),
  line_items: z.array(quoteLineItemSchema).optional().default([]),
  total_amount: z.number().nonnegative("Total amount must be non-negative"),
  currency: z.string().min(1, "Currency is required").default("AED"),
  payment_terms: z
    .string()
    .max(200, "Payment terms must be 200 characters or less")
    .optional()
    .nullable(),
  delivery_terms: z
    .string()
    .max(200, "Delivery terms must be 200 characters or less")
    .optional()
    .nullable(),
  validity_days: z.number().positive("Validity days must be positive").default(30),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type QuoteFormValues = z.infer<typeof quoteFormSchema>

export const quoteStatusUpdateSchema = z.object({
  status: z.nativeEnum(QuoteStatus),
})

export type QuoteStatusUpdateValues = z.infer<typeof quoteStatusUpdateSchema>

/**
 * Zod validation schemas for customers
 */

import { z } from "zod"

export const customerFormSchema = z.object({
  customer_code: z
    .string()
    .max(50, "Customer code must be 50 characters or less")
    .optional()
    .or(z.literal("")),
  company_name: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name must be 200 characters or less"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country must be 100 characters or less"),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .nullable(),
  address: z.string().optional().nullable(),
  primary_contact_name: z
    .string()
    .max(200, "Contact name must be 200 characters or less")
    .optional()
    .nullable(),
  primary_contact_email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  primary_contact_phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .optional()
    .nullable(),
  payment_terms: z
    .string()
    .max(100, "Payment terms must be 100 characters or less")
    .optional()
    .nullable(),
  credit_limit: z.number().nonnegative("Credit limit must be non-negative").optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

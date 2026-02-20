/**
 * Zod validation schemas for vendor forms
 */

import * as z from "zod"

export const vendorFormSchema = z.object({
  vendor_code: z.string().optional(),
  company_name: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
  certifications: z.array(z.string()).optional(),
  product_categories: z.array(z.string()).optional(),
  credibility_score: z.number().min(0).max(100).optional(),
  on_time_delivery_rate: z.number().min(0).max(100).optional(),
  quality_score: z.number().min(0).max(100).optional(),
  avg_lead_time_days: z.number().min(0).optional(),
  primary_contact_name: z.string().optional(),
  primary_contact_email: z.string().email().optional().or(z.literal("")),
  primary_contact_phone: z.string().optional(),
  payment_terms: z.string().optional(),
  is_active: z.boolean().optional(),
  notes: z.string().optional(),
})

export type VendorFormValues = z.infer<typeof vendorFormSchema>

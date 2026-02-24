/**
 * Utilities to map extracted document data to form fields
 */

import { DealFormValues } from "@/lib/validations/deal"
import { DocumentCategory } from "@/lib/types/document"

/**
 * Extract currency with fallback logic
 * Priority: top-level > first line item (if consistent) > default
 *
 * @param extractedData - Extracted data object
 * @param defaultCurrency - Default currency if none found (default: "AED")
 * @returns Object with currency and optional warning message
 */
function extractCurrency(
  extractedData: any,
  defaultCurrency: string = "AED"
): { currency: string; warning?: string } {
  // Check top-level currency
  if (extractedData.currency) {
    return { currency: extractedData.currency }
  }

  // Fallback to line items
  if (extractedData.line_items?.length > 0) {
    const currencies = new Set(
      extractedData.line_items
        .map((item: any) => item.currency)
        .filter(Boolean)
    )

    if (currencies.size === 1) {
      const currency = Array.from(currencies)[0] as string
      console.warn("[extractCurrency] Using currency from line items:", currency)
      return {
        currency,
        warning: "Currency extracted from line items (top-level missing)",
      }
    } else if (currencies.size > 1) {
      console.warn("[extractCurrency] Mixed currencies detected:", Array.from(currencies))
      return {
        currency: defaultCurrency,
        warning: `Mixed currencies in line items (${Array.from(currencies).join(", ")}), using default: ${defaultCurrency}`,
      }
    }
  }

  console.warn("[extractCurrency] No currency found, using default:", defaultCurrency)
  return {
    currency: defaultCurrency,
    warning: "No currency found, using default",
  }
}

/**
 * Map extracted RFQ data to Deal form values
 * Returns both mapped data and any warnings encountered
 */
export function mapRFQToDeal(extractedData: any): {
  data: Partial<DealFormValues>
  warnings: string[]
} {
  const warnings: string[] = []

  // Extract currency with fallback
  const { currency, warning } = extractCurrency(extractedData)
  if (warning) warnings.push(warning)

  // Map line items with validation
  // Note: Field names must match lineItemSchema in frontend/lib/validations/deal.ts
  const lineItems = extractedData.line_items?.map((item: any, idx: number) => {
    // Fallback: unit_price_requested → unit_price
    const unitPrice = item.unit_price_requested ?? item.unit_price ?? 0

    if (unitPrice === 0) {
      warnings.push(`Line item ${idx + 1}: Missing unit price`)
    }

    return {
      description: item.description || "",
      material_spec: item.specification || item.material_spec || "",
      quantity: item.quantity || 0,
      unit: item.unit || "",
      unit_price: unitPrice,
      unit_total: unitPrice * (item.quantity || 0),
      required_delivery_date: item.required_delivery_date || extractedData.delivery_date_requested || "",
    }
  }) || []

  return {
    data: {
      customer_rfq_ref: extractedData.rfq_number || extractedData.rfq_date || "",
      description: extractedData.special_requirements || "",
      currency,
      line_items: lineItems,
      total_value: extractedData.total_value_requested || 0,
      notes: `RFQ Date: ${extractedData.rfq_date || "N/A"}\nPayment Terms: ${
        extractedData.payment_terms || "N/A"
      }\nDelivery: ${extractedData.delivery_date_requested || "N/A"}`,
    },
    warnings,
  }
}

/**
 * Map extracted Vendor Proposal data to Quote form values
 * Returns both mapped data and any warnings encountered
 */
export function mapVendorProposalToQuote(extractedData: any): {
  data: Partial<any>
  warnings: string[]
} {
  const warnings: string[] = []

  // Extract currency with fallback
  const { currency, warning } = extractCurrency(extractedData)
  if (warning) warnings.push(warning)

  // Map line items
  // Note: Field names must match quoteLineItemSchema in frontend/lib/validations/quote.ts
  const lineItems = extractedData.line_items?.map((item: any, idx: number) => {
    const unitPrice = item.unit_price ?? 0
    if (unitPrice === 0) {
      warnings.push(`Line item ${idx + 1}: Missing unit price`)
    }

    return {
      description: item.description || "",
      material_spec: item.specification || item.material_spec || "",
      quantity: item.quantity || 0,
      unit: item.unit || "",
      unit_price: unitPrice,
      total_price: item.total_price || unitPrice * (item.quantity || 0),
    }
  }) || []

  return {
    data: {
      title: extractedData.proposal_number || "Vendor Proposal",
      description: extractedData.quality_guarantees || "",
      line_items: lineItems,
      total_amount: extractedData.total_price || 0,
      currency,
      payment_terms: extractedData.payment_terms || "",
      delivery_terms: extractedData.delivery_terms || "",
      notes: `Lead Time: ${extractedData.lead_time_days || "N/A"} days\nValidity: ${
        extractedData.validity_date || "N/A"
      }`,
    },
    warnings,
  }
}

/**
 * Map extracted Invoice data to CustomerPO form values
 * Returns both mapped data and any warnings encountered
 */
export function mapInvoiceToCustomerPO(extractedData: any): {
  data: Partial<any>
  warnings: string[]
} {
  const warnings: string[] = []

  // Extract currency with fallback
  const { currency, warning } = extractCurrency(extractedData)
  if (warning) warnings.push(warning)

  // Map line items
  // Note: Field names must match customerPoLineItemSchema in frontend/lib/validations/customer-po.ts
  const lineItems = extractedData.line_items?.map((item: any, idx: number) => {
    const unitPrice = item.unit_price ?? 0
    if (unitPrice === 0) {
      warnings.push(`Line item ${idx + 1}: Missing unit price`)
    }

    return {
      description: item.description || "",
      material_spec: item.material_spec || item.specification || "",
      quantity: item.quantity || 0,
      unit: item.unit || "",
      unit_price: unitPrice,
      total_price: item.total || unitPrice * (item.quantity || 0),
    }
  }) || []

  return {
    data: {
      po_number: extractedData.invoice_number || "",
      line_items: lineItems,
      total_amount: extractedData.total_amount || 0,
      currency,
      notes: `Invoice Date: ${extractedData.invoice_date || "N/A"}\nFrom: ${
        extractedData.invoice_from || "N/A"
      }`,
    },
    warnings,
  }
}

/**
 * Main function to map any extracted data to appropriate form based on category
 * Returns both mapped data and warnings for any issues encountered
 */
export function mapExtractedDataToForm(
  extractedData: any,
  category: DocumentCategory | string
): { data: Partial<any>; warnings: string[] } {
  switch (category) {
    case DocumentCategory.RFQ:
    case "RFQ":
      return mapRFQToDeal(extractedData)
    case DocumentCategory.VENDOR_PROPOSAL:
    case "VENDOR_PROPOSAL":
      return mapVendorProposalToQuote(extractedData)
    case DocumentCategory.INVOICE:
    case "INVOICE":
      return mapInvoiceToCustomerPO(extractedData)
    default:
      return {
        data: {},
        warnings: [`Unknown category: ${category}`],
      }
  }
}

/**
 * Apply extracted data to a form object
 * Shallow merges extracted values with existing form values
 */
export function applyExtractedDataToForm<T extends Record<string, any>>(
  currentFormData: T,
  extractedData: Partial<T>,
  fieldsToUpdate?: (keyof T)[]
): T {
  if (fieldsToUpdate) {
    // Only update specified fields
    const updated = { ...currentFormData }
    fieldsToUpdate.forEach((field) => {
      if (field in extractedData && extractedData[field] !== undefined) {
        updated[field as keyof T] = extractedData[field] as T[keyof T]
      }
    })
    return updated
  }

  // Update all fields from extracted data
  return {
    ...currentFormData,
    ...extractedData,
  }
}

/**
 * Utilities to map extracted document data to form fields
 */

import { DealFormValues } from "@/lib/validations/deal"
import { DocumentCategory } from "@/lib/types/document"

/**
 * Map extracted RFQ data to Deal form values
 */
export function mapRFQToDeal(extractedData: any): Partial<DealFormValues> {
  const lineItems = extractedData.line_items?.map((item: any) => ({
    description: item.description || "",
    specification: item.specification || "",
    quantity: item.quantity || 0,
    unit: item.unit || "",
    unit_price: item.unit_price_requested || 0,
    total_price: (item.unit_price_requested || 0) * (item.quantity || 0),
  })) || []

  return {
    customer_rfq_ref: extractedData.rfq_number || extractedData.rfq_date || "",
    description: extractedData.special_requirements || "",
    currency: extractedData.currency || "AED",
    line_items: lineItems,
    total_value: extractedData.total_value_requested || 0,
    notes: `RFQ Date: ${extractedData.rfq_date || "N/A"}\nPayment Terms: ${
      extractedData.payment_terms || "N/A"
    }\nDelivery: ${extractedData.delivery_date_requested || "N/A"}`,
  }
}

/**
 * Map extracted Vendor Proposal data to Quote form values
 */
export function mapVendorProposalToQuote(extractedData: any): Partial<any> {
  const lineItems = extractedData.line_items?.map((item: any) => ({
    description: item.description || "",
    specification: item.specification || "",
    quantity: item.quantity || 0,
    unit: item.unit || "",
    unit_price: item.unit_price || 0,
    total_price: item.total_price || item.unit_price * item.quantity || 0,
  })) || []

  return {
    title: extractedData.proposal_number || "Vendor Proposal",
    description: extractedData.quality_guarantees || "",
    line_items: lineItems,
    total_amount: extractedData.total_price || 0,
    currency: extractedData.currency || "AED",
    payment_terms: extractedData.payment_terms || "",
    delivery_terms: extractedData.delivery_terms || "",
    notes: `Lead Time: ${extractedData.lead_time_days || "N/A"} days\nValidity: ${
      extractedData.validity_date || "N/A"
    }`,
  }
}

/**
 * Map extracted Invoice data to CustomerPO form values
 */
export function mapInvoiceToCustomerPO(extractedData: any): Partial<any> {
  const lineItems = extractedData.line_items?.map((item: any) => ({
    description: item.description || "",
    quantity: item.quantity || 0,
    unit_price: item.unit_price || 0,
    total_price: item.total || item.unit_price * item.quantity || 0,
  })) || []

  return {
    po_number: extractedData.invoice_number || "",
    line_items: lineItems,
    total_amount: extractedData.total_amount || 0,
    currency: extractedData.currency || "AED",
    notes: `Invoice Date: ${extractedData.invoice_date || "N/A"}\nFrom: ${
      extractedData.invoice_from || "N/A"
    }`,
  }
}

/**
 * Main function to map any extracted data to appropriate form based on category
 */
export function mapExtractedDataToForm(
  extractedData: any,
  category: DocumentCategory | string
): Partial<any> {
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
      return {}
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
      if (field in extractedData) {
        updated[field] = extractedData[field]
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

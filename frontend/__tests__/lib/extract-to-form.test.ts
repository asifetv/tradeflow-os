import {
  mapRFQToDeal,
  mapVendorProposalToQuote,
  mapInvoiceToCustomerPO,
  mapExtractedDataToForm,
} from "@/lib/utils/extract-to-form"
import { DocumentCategory } from "@/lib/types/document"

describe("extract-to-form utilities", () => {
  describe("mapRFQToDeal", () => {
    it("should extract top-level currency", () => {
      const result = mapRFQToDeal({
        currency: "USD",
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [
          {
            description: "Item 1",
            quantity: 10,
            unit_price_requested: 100,
            currency: "USD",
          },
        ],
        total_value_requested: 1000,
      })

      expect(result.data.currency).toBe("USD")
      expect(result.warnings).toEqual([])
    })

    it("should fallback to line item currency when top-level missing", () => {
      const result = mapRFQToDeal({
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [
          {
            description: "Item 1",
            quantity: 10,
            unit_price_requested: 100,
            currency: "EUR",
          },
        ],
        total_value_requested: 1000,
      })

      expect(result.data.currency).toBe("EUR")
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(
        result.warnings.some((w) => w.includes("top-level missing"))
      ).toBe(true)
    })

    it("should detect mixed currencies in line items", () => {
      const result = mapRFQToDeal({
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [
          {
            description: "Item 1",
            quantity: 10,
            unit_price_requested: 100,
            currency: "USD",
          },
          {
            description: "Item 2",
            quantity: 5,
            unit_price_requested: 50,
            currency: "EUR",
          },
        ],
        total_value_requested: 1000,
      })

      expect(result.data.currency).toBe("AED")
      expect(result.warnings.some((w) => w.includes("Mixed currencies"))).toBe(
        true
      )
    })

    it("should use default currency when none found", () => {
      const result = mapRFQToDeal({
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [
          {
            description: "Item 1",
            quantity: 10,
            unit_price_requested: 100,
          },
        ],
        total_value_requested: 1000,
      })

      expect(result.data.currency).toBe("AED")
      expect(result.warnings.some((w) => w.includes("default"))).toBe(true)
    })

    it("should map line items correctly", () => {
      const result = mapRFQToDeal({
        currency: "USD",
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [
          {
            description: "Steel Coil",
            specification: "Hot rolled, 2mm",
            quantity: 100,
            unit: "kg",
            unit_price_requested: 5.5,
            currency: "USD",
          },
        ],
        total_value_requested: 550,
      })

      expect(result.data.line_items).toHaveLength(1)
      expect(result.data.line_items![0].description).toBe("Steel Coil")
      expect(result.data.line_items![0].specification).toBe("Hot rolled, 2mm")
      expect(result.data.line_items![0].quantity).toBe(100)
      expect(result.data.line_items![0].unit).toBe("kg")
      expect(result.data.line_items![0].unit_price).toBe(5.5)
      expect(result.data.line_items![0].total_price).toBe(550)
    })

    it("should fallback to unit_price if unit_price_requested missing", () => {
      const result = mapRFQToDeal({
        currency: "USD",
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [
          {
            description: "Item 1",
            quantity: 10,
            unit_price: 100,
            currency: "USD",
          },
        ],
        total_value_requested: 1000,
      })

      expect(result.data.line_items![0].unit_price).toBe(100)
    })

    it("should warn about missing line item prices", () => {
      const result = mapRFQToDeal({
        currency: "USD",
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [
          {
            description: "Item 1",
            quantity: 10,
            currency: "USD",
          },
        ],
        total_value_requested: 0,
      })

      expect(result.warnings.some((w) => w.includes("Missing unit price"))).toBe(
        true
      )
    })

    it("should include RFQ date and payment terms in notes", () => {
      const result = mapRFQToDeal({
        currency: "USD",
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        payment_terms: "Net 30",
        delivery_date_requested: "2026-03-24",
        line_items: [],
        total_value_requested: 0,
      })

      expect(result.data.notes).toContain("2026-02-24")
      expect(result.data.notes).toContain("Net 30")
      expect(result.data.notes).toContain("2026-03-24")
    })
  })

  describe("mapVendorProposalToQuote", () => {
    it("should map vendor proposal with top-level currency", () => {
      const result = mapVendorProposalToQuote({
        currency: "USD",
        proposal_number: "VP-001",
        proposal_date: "2026-02-24",
        line_items: [
          {
            description: "Supply Item",
            quantity: 50,
            unit_price: 25,
            currency: "USD",
          },
        ],
        total_price: 1250,
      })

      expect(result.data.currency).toBe("USD")
      expect(result.data.title).toBe("VP-001")
      expect(result.data.line_items).toHaveLength(1)
      expect(result.warnings).toEqual([])
    })

    it("should fallback to line item currency", () => {
      const result = mapVendorProposalToQuote({
        proposal_number: "VP-001",
        proposal_date: "2026-02-24",
        line_items: [
          {
            description: "Supply Item",
            quantity: 50,
            unit_price: 25,
            currency: "EUR",
          },
        ],
        total_price: 1250,
      })

      expect(result.data.currency).toBe("EUR")
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe("mapInvoiceToCustomerPO", () => {
    it("should map invoice with top-level currency", () => {
      const result = mapInvoiceToCustomerPO({
        currency: "USD",
        invoice_number: "INV-001",
        invoice_date: "2026-02-24",
        line_items: [
          {
            description: "Invoice Item",
            quantity: 100,
            unit_price: 10,
            currency: "USD",
          },
        ],
        total_amount: 1000,
      })

      expect(result.data.currency).toBe("USD")
      expect(result.data.po_number).toBe("INV-001")
      expect(result.data.line_items).toHaveLength(1)
      expect(result.warnings).toEqual([])
    })

    it("should fallback to line item currency", () => {
      const result = mapInvoiceToCustomerPO({
        invoice_number: "INV-001",
        invoice_date: "2026-02-24",
        line_items: [
          {
            description: "Invoice Item",
            quantity: 100,
            unit_price: 10,
            currency: "GBP",
          },
        ],
        total_amount: 1000,
      })

      expect(result.data.currency).toBe("GBP")
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe("mapExtractedDataToForm", () => {
    it("should route RFQ category to mapRFQToDeal", () => {
      const data = {
        currency: "USD",
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [],
        total_value_requested: 0,
      }

      const result = mapExtractedDataToForm(data, DocumentCategory.RFQ)
      expect(result.data.customer_rfq_ref).toBe("RFQ-001")
      expect(result.data.currency).toBe("USD")
    })

    it("should route VENDOR_PROPOSAL category to mapVendorProposalToQuote", () => {
      const data = {
        currency: "USD",
        proposal_number: "VP-001",
        proposal_date: "2026-02-24",
        line_items: [],
        total_price: 0,
      }

      const result = mapExtractedDataToForm(data, DocumentCategory.VENDOR_PROPOSAL)
      expect(result.data.title).toBe("VP-001")
      expect(result.data.currency).toBe("USD")
    })

    it("should route INVOICE category to mapInvoiceToCustomerPO", () => {
      const data = {
        currency: "USD",
        invoice_number: "INV-001",
        invoice_date: "2026-02-24",
        line_items: [],
        total_amount: 0,
      }

      const result = mapExtractedDataToForm(data, DocumentCategory.INVOICE)
      expect(result.data.po_number).toBe("INV-001")
      expect(result.data.currency).toBe("USD")
    })

    it("should handle unknown category", () => {
      const result = mapExtractedDataToForm({}, "UNKNOWN")
      expect(result.data).toEqual({})
      expect(result.warnings.some((w) => w.includes("Unknown category"))).toBe(
        true
      )
    })

    it("should work with string category names", () => {
      const data = {
        currency: "USD",
        rfq_number: "RFQ-001",
        rfq_date: "2026-02-24",
        line_items: [],
        total_value_requested: 0,
      }

      const result = mapExtractedDataToForm(data, "RFQ")
      expect(result.data.currency).toBe("USD")
      expect(result.data.customer_rfq_ref).toBe("RFQ-001")
    })
  })
})

import { UUID } from "crypto"

export enum QuoteStatus {
  DRAFT = "draft",
  SENT = "sent",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
  REVISED = "revised",
}

export type QuoteLineItem = {
  description: string
  material_spec?: string | null
  quantity: number
  unit: string
  unit_price: number
  total_price: number
}

export type Quote = {
  id: UUID
  quote_number: string
  customer_id: UUID
  deal_id?: UUID | null
  status: QuoteStatus
  title: string
  description?: string | null
  line_items: QuoteLineItem[]
  total_amount: number
  currency: string
  payment_terms?: string | null
  delivery_terms?: string | null
  validity_days: number
  issue_date?: string | null
  expiry_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type QuoteCreate = {
  quote_number: string
  customer_id: UUID
  deal_id?: UUID | null
  title: string
  description?: string | null
  line_items?: QuoteLineItem[]
  total_amount: number
  currency?: string
  payment_terms?: string | null
  delivery_terms?: string | null
  validity_days?: number
  issue_date?: string | null
  expiry_date?: string | null
  notes?: string | null
}

export type QuoteUpdate = Partial<QuoteCreate>

export type QuoteStatusUpdate = {
  status: QuoteStatus
}

export type QuotesListResponse = {
  quotes: Quote[]
  total: number
  skip: number
  limit: number
}

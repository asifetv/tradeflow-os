import { UUID } from "crypto"

export enum CustomerPOStatus {
  RECEIVED = "received",
  ACKNOWLEDGED = "acknowledged",
  IN_PROGRESS = "in_progress",
  FULFILLED = "fulfilled",
  CANCELLED = "cancelled",
}

export type CustomerPOLineItem = {
  description: string
  material_spec?: string | null
  quantity: number
  unit: string
  unit_price: number
  total_price: number
}

export type CustomerPO = {
  id: UUID
  internal_ref: string
  po_number: string
  customer_id: UUID
  deal_id?: UUID | null
  quote_id?: UUID | null
  status: CustomerPOStatus
  line_items: CustomerPOLineItem[]
  total_amount: number
  currency: string
  po_date: string
  delivery_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type CustomerPOCreate = {
  internal_ref: string
  po_number: string
  customer_id: UUID
  deal_id?: UUID | null
  quote_id?: UUID | null
  line_items?: CustomerPOLineItem[]
  total_amount: number
  currency?: string
  po_date: string
  delivery_date?: string | null
  notes?: string | null
}

export type CustomerPOUpdate = Partial<CustomerPOCreate>

export type CustomerPOStatusUpdate = {
  status: CustomerPOStatus
}

export type CustomerPOsListResponse = {
  customer_pos: CustomerPO[]
  total: number
  skip: number
  limit: number
}

/**
 * TypeScript types for Deal Hub functionality
 */

export enum DealStatus {
  RFQ_RECEIVED = "rfq_received",
  SOURCING = "sourcing",
  QUOTED = "quoted",
  PO_RECEIVED = "po_received",
  ORDERED = "ordered",
  IN_PRODUCTION = "in_production",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  INVOICED = "invoiced",
  PAID = "paid",
  CLOSED = "closed",
  CANCELLED = "cancelled",
}

export interface LineItem {
  description: string
  material_spec: string
  quantity: number
  unit: string
  unit_price?: number | null
  unit_total?: number | null
  required_delivery_date: string
}

export interface Deal {
  id: string
  deal_number: string
  status: DealStatus
  customer_id: string | null
  customer_rfq_ref: string | null
  description: string
  currency: string
  line_items: LineItem[]
  total_value: number | null
  total_cost: number | null
  estimated_margin_pct: number | null
  actual_margin_pct: number | null
  notes: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DealCreate {
  deal_number?: string
  customer_id?: string | null
  customer_rfq_ref?: string | null
  description: string
  currency?: string
  line_items?: LineItem[]
  total_value?: number | null
  total_cost?: number | null
  estimated_margin_pct?: number | null
  notes?: string | null
}

export interface DealUpdate {
  deal_number?: string
  customer_id?: string | null
  customer_rfq_ref?: string | null
  description?: string
  currency?: string
  line_items?: LineItem[]
  total_value?: number | null
  total_cost?: number | null
  estimated_margin_pct?: number | null
  notes?: string | null
}

export interface DealStatusUpdate {
  status: DealStatus
}

export interface DealsListResponse {
  deals: Deal[]
  total: number
  skip: number
  limit: number
}

export interface ChangeDetail {
  field: string
  old_value: string | null
  new_value: string | null
}

export interface ActivityLog {
  id: string
  deal_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  changes: ChangeDetail[]
  created_at: string
}

export interface DealActivityListResponse {
  activity_logs: ActivityLog[]
  total: number
}

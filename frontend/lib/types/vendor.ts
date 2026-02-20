export interface Vendor {
  id: string
  vendor_code: string
  company_name: string
  country: string
  certifications?: string[]
  product_categories?: string[]
  credibility_score: number
  on_time_delivery_rate?: number
  quality_score?: number
  avg_lead_time_days?: number
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  payment_terms?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface VendorCreate {
  vendor_code?: string
  company_name: string
  country: string
  certifications?: string[]
  product_categories?: string[]
  credibility_score?: number
  on_time_delivery_rate?: number
  quality_score?: number
  avg_lead_time_days?: number
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  payment_terms?: string
  is_active?: boolean
  notes?: string
}

export interface VendorUpdate {
  vendor_code?: string
  company_name?: string
  country?: string
  certifications?: string[]
  product_categories?: string[]
  credibility_score?: number
  on_time_delivery_rate?: number
  quality_score?: number
  avg_lead_time_days?: number
  primary_contact_name?: string
  primary_contact_email?: string
  primary_contact_phone?: string
  payment_terms?: string
  is_active?: boolean
  notes?: string
}

export interface VendorsListResponse {
  items: Vendor[]
  total: number
  skip: number
  limit: number
}

export interface VendorProposal {
  id: string
  deal_id: string
  vendor_id: string
  vendor?: Vendor
  status: "requested" | "received" | "selected" | "rejected"
  total_price?: number
  currency: string
  lead_time_days?: number
  payment_terms?: string
  specs_match?: boolean
  discrepancies?: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
}

export interface VendorProposalCreate {
  deal_id: string
  vendor_id: string
  status?: "requested" | "received" | "selected" | "rejected"
  total_price?: number
  currency?: string
  lead_time_days?: number
  payment_terms?: string
  specs_match?: boolean
  discrepancies?: Record<string, any>
  notes?: string
}

export interface VendorProposalUpdate {
  status?: "requested" | "received" | "selected" | "rejected"
  total_price?: number
  currency?: string
  lead_time_days?: number
  payment_terms?: string
  specs_match?: boolean
  discrepancies?: Record<string, any>
  notes?: string
}

export interface VendorProposalsListResponse {
  items: VendorProposal[]
  total: number
  skip: number
  limit: number
}

export interface ProposalComparisonItem {
  id: string
  vendor_name: string
  vendor_credibility: number
  total_price?: number
  lead_time_days?: number
  specs_match?: boolean
  discrepancies?: Record<string, any>
  status: string
  is_best_price?: boolean
  is_worst_price?: boolean
  is_best_lead_time?: boolean
}

export interface ProposalComparisonResponse {
  deal_id: string
  proposals: ProposalComparisonItem[]
  best_price?: number
  worst_price?: number
  best_lead_time?: number
  worst_lead_time?: number
}

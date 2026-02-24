import { UUID } from "crypto"

export type Customer = {
  id: UUID
  customer_code: string
  company_name: string
  country: string
  city?: string | null
  address?: string | null
  primary_contact_name?: string | null
  primary_contact_email?: string | null
  primary_contact_phone?: string | null
  payment_terms?: string | null
  credit_limit?: number | null
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type CustomerCreate = {
  customer_code: string
  company_name: string
  country: string
  city?: string | null
  address?: string | null
  primary_contact_name?: string | null
  primary_contact_email?: string | null
  primary_contact_phone?: string | null
  payment_terms?: string | null
  credit_limit?: number | null
  is_active?: boolean
  notes?: string | null
}

export type CustomerUpdate = Partial<CustomerCreate>

export type CustomersListResponse = {
  customers: Customer[]
  total: number
  skip: number
  limit: number
}

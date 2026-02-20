/**
 * HTTP API client setup with axios
 */

import axios, { AxiosInstance } from "axios"

import {
  Deal,
  DealActivityListResponse,
  DealCreate,
  DealsListResponse,
  DealStatusUpdate,
  DealUpdate,
} from "./types/deal"
import {
  Customer,
  CustomerCreate,
  CustomersListResponse,
  CustomerUpdate,
} from "./types/customer"
import {
  Quote,
  QuoteCreate,
  QuotesListResponse,
  QuoteStatusUpdate,
  QuoteUpdate,
} from "./types/quote"
import {
  CustomerPO,
  CustomerPOCreate,
  CustomerPOsListResponse,
  CustomerPOStatusUpdate,
  CustomerPOUpdate,
} from "./types/customer-po"
import {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  User,
} from "./types/auth"
import {
  Vendor,
  VendorCreate,
  VendorUpdate,
  VendorsListResponse,
  VendorProposal,
  VendorProposalCreate,
  VendorProposalUpdate,
  VendorProposalsListResponse,
  ProposalComparisonResponse,
} from "./types/vendor"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Create axios instance with base configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor: add JWT token and subdomain
if (axiosInstance && axiosInstance.interceptors) {
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token")
    const subdomain = localStorage.getItem("company_subdomain")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Only set subdomain from localStorage if not already set by form/request
    // This prevents overwriting subdomain for login requests
    if (subdomain && !config.headers["X-Subdomain"]) {
      config.headers["X-Subdomain"] = subdomain
    }

    return config
  })

  // Response interceptor: handle 401
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token")
        window.location.href = "/auth/login"
      }
      return Promise.reject(error)
    }
  )
}

/**
 * Deal API methods
 */
export const dealApi = {
  /**
   * List deals with optional filters
   */
  list: (params?: {
    skip?: number
    limit?: number
    status?: string
    customer_id?: string
  }) => axiosInstance.get<DealsListResponse>("/api/deals", { params }),

  /**
   * Get a single deal
   */
  get: (dealId: string) => axiosInstance.get<Deal>(`/api/deals/${dealId}`),

  /**
   * Create a new deal
   */
  create: (data: DealCreate) => axiosInstance.post<Deal>("/api/deals", data),

  /**
   * Update a deal
   */
  update: (dealId: string, data: DealUpdate) =>
    axiosInstance.patch<Deal>(`/api/deals/${dealId}`, data),

  /**
   * Update deal status
   */
  updateStatus: (dealId: string, data: DealStatusUpdate) =>
    axiosInstance.patch<Deal>(`/api/deals/${dealId}/status`, data),

  /**
   * Delete a deal (soft delete)
   */
  delete: (dealId: string) => axiosInstance.delete(`/api/deals/${dealId}`),

  /**
   * Get activity logs for a deal
   */
  getActivity: (dealId: string, params?: { skip?: number; limit?: number }) =>
    axiosInstance.get<DealActivityListResponse>(`/api/deals/${dealId}/activity`, {
      params,
    }),
}

/**
 * Customer API methods
 */
export const customerApi = {
  /**
   * List customers with optional filters
   */
  list: (params?: {
    skip?: number
    limit?: number
    is_active?: boolean
    country?: string
    search?: string
  }) => axiosInstance.get<CustomersListResponse>("/api/customers", { params }),

  /**
   * Get a single customer
   */
  get: (customerId: string) =>
    axiosInstance.get<Customer>(`/api/customers/${customerId}`),

  /**
   * Create a new customer
   */
  create: (data: CustomerCreate) =>
    axiosInstance.post<Customer>("/api/customers", data),

  /**
   * Update a customer
   */
  update: (customerId: string, data: CustomerUpdate) =>
    axiosInstance.patch<Customer>(`/api/customers/${customerId}`, data),

  /**
   * Delete a customer (soft delete)
   */
  delete: (customerId: string) =>
    axiosInstance.delete(`/api/customers/${customerId}`),
}

/**
 * Quote API methods
 */
export const quoteApi = {
  /**
   * List quotes with optional filters
   */
  list: (params?: {
    skip?: number
    limit?: number
    customer_id?: string
    deal_id?: string
    status?: string
  }) => axiosInstance.get<QuotesListResponse>("/api/quotes", { params }),

  /**
   * Get a single quote
   */
  get: (quoteId: string) =>
    axiosInstance.get<Quote>(`/api/quotes/${quoteId}`),

  /**
   * Create a new quote
   */
  create: (data: QuoteCreate) =>
    axiosInstance.post<Quote>("/api/quotes", data),

  /**
   * Update a quote
   */
  update: (quoteId: string, data: QuoteUpdate) =>
    axiosInstance.patch<Quote>(`/api/quotes/${quoteId}`, data),

  /**
   * Update quote status
   */
  updateStatus: (quoteId: string, data: QuoteStatusUpdate) =>
    axiosInstance.patch<Quote>(`/api/quotes/${quoteId}/status`, data),

  /**
   * Delete a quote (soft delete)
   */
  delete: (quoteId: string) =>
    axiosInstance.delete(`/api/quotes/${quoteId}`),

  /**
   * Get activity logs for a quote
   */
  getActivity: (quoteId: string, params?: { skip?: number; limit?: number }) =>
    axiosInstance.get<DealActivityListResponse>(`/api/quotes/${quoteId}/activity`, {
      params,
    }),
}

/**
 * CustomerPO API methods
 */
export const customerPoApi = {
  /**
   * List customer POs with optional filters
   */
  list: (params?: {
    skip?: number
    limit?: number
    customer_id?: string
    deal_id?: string
    quote_id?: string
    status?: string
  }) => axiosInstance.get<CustomerPOsListResponse>("/api/customer-pos", { params }),

  /**
   * Get a single customer PO
   */
  get: (poId: string) =>
    axiosInstance.get<CustomerPO>(`/api/customer-pos/${poId}`),

  /**
   * Create a new customer PO
   */
  create: (data: CustomerPOCreate) =>
    axiosInstance.post<CustomerPO>("/api/customer-pos", data),

  /**
   * Update a customer PO
   */
  update: (poId: string, data: CustomerPOUpdate) =>
    axiosInstance.patch<CustomerPO>(`/api/customer-pos/${poId}`, data),

  /**
   * Update customer PO status
   */
  updateStatus: (poId: string, data: CustomerPOStatusUpdate) =>
    axiosInstance.patch<CustomerPO>(`/api/customer-pos/${poId}/status`, data),

  /**
   * Delete a customer PO (soft delete)
   */
  delete: (poId: string) =>
    axiosInstance.delete(`/api/customer-pos/${poId}`),
}

/**
 * Auth API methods
 */
export const authApi = {
  /**
   * Register a new company and user
   */
  register: (data: RegisterRequest) =>
    axiosInstance.post<AuthResponse>("/api/auth/register", data),

  /**
   * Login a user
   */
  login: (data: LoginRequest) =>
    axiosInstance.post<AuthResponse>("/api/auth/login", data),

  /**
   * Get current user info
   */
  me: () => axiosInstance.get<User>("/api/auth/me"),
}

/**
 * Vendor API methods
 */
export const vendorApi = {
  /**
   * List vendors with optional filters
   */
  list: (params?: {
    skip?: number
    limit?: number
    search?: string
    is_active?: boolean
  }) => axiosInstance.get<VendorsListResponse>("/api/vendors", { params }),

  /**
   * Advanced search vendors with smart filtering
   */
  searchAdvanced: (params?: {
    q?: string
    min_credibility?: number
    max_credibility?: number
    country?: string
    category?: string
    certification?: string
    skip?: number
    limit?: number
  }) => axiosInstance.get<VendorsListResponse>("/api/vendors/advanced", { params }),

  /**
   * Get a single vendor
   */
  get: (vendorId: string) =>
    axiosInstance.get<Vendor>(`/api/vendors/${vendorId}`),

  /**
   * Create a new vendor
   */
  create: (data: VendorCreate) =>
    axiosInstance.post<Vendor>("/api/vendors", data),

  /**
   * Update a vendor
   */
  update: (vendorId: string, data: VendorUpdate) =>
    axiosInstance.put<Vendor>(`/api/vendors/${vendorId}`, data),

  /**
   * Delete a vendor
   */
  delete: (vendorId: string) =>
    axiosInstance.delete(`/api/vendors/${vendorId}`),
}

/**
 * Vendor Proposal API methods
 */
export const vendorProposalApi = {
  /**
   * List vendor proposals with optional filters
   */
  list: (params?: {
    skip?: number
    limit?: number
    deal_id?: string
    vendor_id?: string
    status?: string
  }) => axiosInstance.get<VendorProposalsListResponse>("/api/vendor-proposals", { params }),

  /**
   * Get a single vendor proposal
   */
  get: (proposalId: string) =>
    axiosInstance.get<VendorProposal>(`/api/vendor-proposals/${proposalId}`),

  /**
   * Create a new vendor proposal
   */
  create: (data: VendorProposalCreate) =>
    axiosInstance.post<VendorProposal>("/api/vendor-proposals", data),

  /**
   * Update a vendor proposal
   */
  update: (proposalId: string, data: VendorProposalUpdate) =>
    axiosInstance.put<VendorProposal>(`/api/vendor-proposals/${proposalId}`, data),

  /**
   * Delete a vendor proposal
   */
  delete: (proposalId: string) =>
    axiosInstance.delete(`/api/vendor-proposals/${proposalId}`),

  /**
   * Get proposal comparison for a deal (HERO FEATURE)
   */
  compare: (dealId: string) =>
    axiosInstance.get<ProposalComparisonResponse>(
      `/api/vendor-proposals/compare/${dealId}`
    ),

  /**
   * Select a vendor for a deal
   */
  select: (proposalId: string) =>
    axiosInstance.post<VendorProposal>(
      `/api/vendor-proposals/${proposalId}/select`,
      {}
    ),
}

export { axiosInstance }

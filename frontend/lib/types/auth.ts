export interface RegisterRequest {
  company_name: string
  subdomain: string
  email: string
  password: string
  full_name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  email_verified: boolean
  last_login_at?: string
  created_at: string
}

export interface Company {
  id: string
  company_name: string
  subdomain: string
  plan_tier: string
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
  company: Company
}

export interface AuthState {
  user: User | null
  company: Company | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthState, User, Company } from "@/lib/types/auth"

interface AuthStore extends AuthState {
  setAuth: (user: User, company: Company, token: string) => void
  clearAuth: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user: User, company: Company, token: string) => {
        set({
          user,
          company,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      clearAuth: () => {
        set({
          user: null,
          company: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
        localStorage.removeItem("access_token")
        localStorage.removeItem("company_subdomain")
        localStorage.removeItem("auth-storage")
        // Clear the access token cookie
        document.cookie = "access_token=; path=/; max-age=0"
      },

      setUser: (user: User) => {
        set({ user })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: "auth-storage",
    }
  )
)

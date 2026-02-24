/**
 * React Query hooks for customer management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { customerApi } from "@/lib/api"
import {
  Customer,
  CustomerCreate,
  CustomersListResponse,
  CustomerUpdate,
} from "@/lib/types/customer"

// Query keys for React Query cache
const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters?: {
    skip?: number
    limit?: number
    is_active?: boolean
    country?: string
    search?: string
  }) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
}

/**
 * Hook to list customers with optional filters
 */
export function useCustomers(
  skip?: number,
  limit?: number,
  is_active?: boolean,
  country?: string,
  search?: string
) {
  return useQuery<CustomersListResponse>({
    queryKey: customerKeys.list({ skip: skip ?? 0, limit: limit ?? 50, is_active, country, search }),
    queryFn: async () => {
      const response = await customerApi.list({
        skip: skip ?? 0,
        limit: limit ?? 50,
        is_active,
        country,
        search,
      })
      return response.data
    },
    enabled: skip !== undefined && limit !== undefined,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchInterval: false,
  })
}

/**
 * Hook to get a single customer
 */
export function useCustomer(customerId: string) {
  return useQuery<Customer>({
    queryKey: customerKeys.detail(customerId),
    queryFn: async () => {
      const response = await customerApi.get(customerId)
      return response.data
    },
    enabled: !!customerId,
  })
}

/**
 * Mutation to create a customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CustomerCreate) => {
      const response = await customerApi.create(data)
      return response.data
    },
    onSuccess: (newCustomer) => {
      // Invalidate and refetch customers list immediately
      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
        refetchType: 'all'
      })

      // Add new customer to cache
      queryClient.setQueryData<Customer>(
        customerKeys.detail(newCustomer.id),
        newCustomer
      )
    },
  })
}

/**
 * Mutation to update a customer
 */
export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CustomerUpdate) => {
      const response = await customerApi.update(customerId, data)
      return response.data
    },
    onSuccess: (updatedCustomer) => {
      // Update cache for this customer
      queryClient.setQueryData<Customer>(
        customerKeys.detail(customerId),
        updatedCustomer
      )

      // Invalidate lists and refetch immediately
      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
        refetchType: 'all'
      })
    },
  })
}

/**
 * Mutation to delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerId: string) => {
      const response = await customerApi.delete(customerId)
      return response
    },
    onSuccess: (data, customerId) => {
      // Invalidate customers list and refetch immediately
      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
        refetchType: "all",
      })

      // Clear all customer details from cache
      queryClient.removeQueries({ queryKey: customerKeys.details() })
    },
  })
}

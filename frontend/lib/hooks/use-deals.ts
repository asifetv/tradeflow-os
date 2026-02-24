/**
 * React Query hooks for deal management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { dealApi } from "@/lib/api"
import {
  Deal,
  DealActivityListResponse,
  DealCreate,
  DealsListResponse,
  DealStatus,
  DealStatusUpdate,
  DealUpdate,
} from "@/lib/types/deal"

// Query keys for React Query cache
const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  list: (filters?: {
    skip?: number
    limit?: number
    status?: DealStatus
    customer_id?: string
  }) => [...dealKeys.lists(), filters] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  activities: () => [...dealKeys.all, "activity"] as const,
  activity: (dealId: string, skip?: number, limit?: number) => [
    ...dealKeys.activities(),
    dealId,
    { skip, limit },
  ] as const,
}

/**
 * Hook to list deals with optional filters
 */
export function useDeals(
  skip?: number,
  limit?: number,
  status?: DealStatus,
  customer_id?: string
) {
  return useQuery<DealsListResponse>({
    queryKey: dealKeys.list({ skip: skip ?? 0, limit: limit ?? 50, status, customer_id }),
    queryFn: async () => {
      console.log("Fetching deals list with params:", { skip, limit, status, customer_id })
      const response = await dealApi.list({
        skip: skip ?? 0,
        limit: limit ?? 50,
        status,
        customer_id,
      })
      console.log("Deals list fetched:", response.data)
      return response.data
    },
    enabled: skip !== undefined && limit !== undefined,
    staleTime: 60000, // Data is fresh for 60 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: false, // Prevent refetch on reconnect
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchInterval: false, // Disable polling
  })
}

/**
 * Hook to get a single deal
 */
export function useDeal(dealId: string) {
  return useQuery<Deal>({
    queryKey: dealKeys.detail(dealId),
    queryFn: async () => {
      const response = await dealApi.get(dealId)
      return response.data
    },
    enabled: !!dealId,
    staleTime: 60000, // Data is fresh for 60 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}

/**
 * Hook to get activity logs for a deal
 */
export function useDealActivity(dealId: string, skip: number = 0, limit: number = 50) {
  return useQuery<DealActivityListResponse>({
    queryKey: dealKeys.activity(dealId, skip, limit),
    queryFn: async () => {
      const response = await dealApi.getActivity(dealId, { skip, limit })
      return response.data
    },
    enabled: !!dealId,
    staleTime: 60000, // Data is fresh for 60 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}

/**
 * Mutation to create a deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DealCreate) => {
      const response = await dealApi.create(data)
      return response.data
    },
    onSuccess: (newDeal) => {
      // Invalidate and refetch all deal lists immediately
      queryClient.invalidateQueries({
        queryKey: dealKeys.lists(),
        exact: false,
        refetchType: 'all',
      })

      // Add new deal to cache
      queryClient.setQueryData<Deal>(dealKeys.detail(newDeal.id), newDeal)
    },
  })
}

/**
 * Mutation to update a deal
 */
export function useUpdateDeal(dealId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DealUpdate) => {
      const response = await dealApi.update(dealId, data)
      return response.data
    },
    onSuccess: (updatedDeal) => {
      // Update cache for this deal
      queryClient.setQueryData<Deal>(dealKeys.detail(dealId), updatedDeal)

      // Invalidate and refetch all deal lists immediately
      queryClient.invalidateQueries({
        queryKey: dealKeys.lists(),
        exact: false,
        refetchType: 'all',
      })
      queryClient.invalidateQueries({ queryKey: dealKeys.activity(dealId, 0, 50), refetchType: 'all' })
    },
  })
}

/**
 * Mutation to update deal status
 */
export function useUpdateDealStatus(dealId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DealStatusUpdate) => {
      const response = await dealApi.updateStatus(dealId, data)
      return response.data
    },
    onSuccess: (updatedDeal) => {
      // Update cache for this deal
      queryClient.setQueryData<Deal>(dealKeys.detail(dealId), updatedDeal)

      // Invalidate and refetch all deal lists immediately
      queryClient.invalidateQueries({
        queryKey: dealKeys.lists(),
        exact: false,
        refetchType: 'all',
      })
      queryClient.invalidateQueries({ queryKey: dealKeys.activity(dealId, 0, 50), refetchType: 'all' })
    },
  })
}

/**
 * Mutation to delete a deal
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dealId: string) => {
      console.log("Deleting deal:", dealId)
      const response = await dealApi.delete(dealId)
      console.log("Delete response:", response)
      return response
    },
    onSuccess: (data, dealId) => {
      console.log("Delete successful for deal:", dealId)
      // Invalidate deals list and refetch immediately
      queryClient.invalidateQueries({
        queryKey: dealKeys.lists(),
        refetchType: 'all'
      })

      // Clear all deal details from cache
      queryClient.removeQueries({ queryKey: dealKeys.details() })

      console.log("Cache invalidated and refetch triggered")
    },
    onError: (error: any) => {
      console.error("Delete failed:", error)
      if (error.response?.data) {
        console.error("Error details:", error.response.data)
      }
    },
  })
}

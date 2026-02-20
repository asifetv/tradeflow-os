/**
 * React Query hooks for vendor management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { vendorApi } from "@/lib/api"
import {
  Vendor,
  VendorCreate,
  VendorsListResponse,
  VendorUpdate,
} from "@/lib/types/vendor"

// Query keys for React Query cache
const vendorKeys = {
  all: ["vendors"] as const,
  lists: () => [...vendorKeys.all, "list"] as const,
  list: (filters?: {
    skip?: number
    limit?: number
    search?: string
    is_active?: boolean
  }) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, "detail"] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
}

/**
 * Hook to list vendors with optional filters
 */
export function useVendors(
  skip?: number,
  limit?: number,
  search?: string,
  is_active?: boolean
) {
  return useQuery<VendorsListResponse>({
    queryKey: vendorKeys.list({ skip: skip ?? 0, limit: limit ?? 50, search, is_active }),
    queryFn: async () => {
      const response = await vendorApi.list({
        skip: skip ?? 0,
        limit: limit ?? 50,
        search,
        is_active,
      })
      return response.data
    },
    enabled: skip !== undefined && limit !== undefined,
  })
}

/**
 * Hook to get a single vendor
 */
export function useVendor(vendorId: string) {
  return useQuery<Vendor>({
    queryKey: vendorKeys.detail(vendorId),
    queryFn: async () => {
      const response = await vendorApi.get(vendorId)
      return response.data
    },
    enabled: !!vendorId,
  })
}

/**
 * Mutation to create a vendor
 */
export function useCreateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VendorCreate) => {
      const response = await vendorApi.create(data)
      return response.data
    },
    onSuccess: (newVendor) => {
      // Invalidate and refetch vendors list
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() })

      // Add new vendor to cache
      queryClient.setQueryData<Vendor>(vendorKeys.detail(newVendor.id), newVendor)
    },
  })
}

/**
 * Mutation to update a vendor
 */
export function useUpdateVendor(vendorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VendorUpdate) => {
      const response = await vendorApi.update(vendorId, data)
      return response.data
    },
    onSuccess: (updatedVendor) => {
      // Update cache for this vendor
      queryClient.setQueryData<Vendor>(vendorKeys.detail(vendorId), updatedVendor)

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() })
    },
  })
}

/**
 * Mutation to delete a vendor
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await vendorApi.delete(vendorId)
      return response
    },
    onSuccess: (data, vendorId) => {
      // Invalidate vendors list and refetch immediately
      queryClient.invalidateQueries({
        queryKey: vendorKeys.lists(),
        refetchType: "all",
      })

      // Clear vendor details from cache
      queryClient.removeQueries({ queryKey: vendorKeys.detail(vendorId) })
    },
  })
}

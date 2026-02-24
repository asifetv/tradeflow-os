/**
 * React Query hooks for customer PO management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { customerPoApi } from "@/lib/api"
import {
  CustomerPO,
  CustomerPOCreate,
  CustomerPOsListResponse,
  CustomerPOStatus,
  CustomerPOStatusUpdate,
  CustomerPOUpdate,
} from "@/lib/types/customer-po"

// Query keys for React Query cache
const customerPoKeys = {
  all: ["customer-pos"] as const,
  lists: () => [...customerPoKeys.all, "list"] as const,
  list: (filters?: {
    skip?: number
    limit?: number
    customer_id?: string
    deal_id?: string
    quote_id?: string
    status?: CustomerPOStatus
  }) => [...customerPoKeys.lists(), filters] as const,
  details: () => [...customerPoKeys.all, "detail"] as const,
  detail: (id: string) => [...customerPoKeys.details(), id] as const,
}

/**
 * Hook to list customer POs with optional filters
 */
export function useCustomerPos(
  skip?: number,
  limit?: number,
  customer_id?: string,
  deal_id?: string,
  quote_id?: string,
  status?: CustomerPOStatus
) {
  return useQuery<CustomerPOsListResponse>({
    queryKey: customerPoKeys.list({
      skip: skip ?? 0,
      limit: limit ?? 50,
      customer_id,
      deal_id,
      quote_id,
      status,
    }),
    queryFn: async () => {
      const response = await customerPoApi.list({
        skip: skip ?? 0,
        limit: limit ?? 50,
        customer_id,
        deal_id,
        quote_id,
        status,
      })
      return response.data
    },
    enabled: skip !== undefined && limit !== undefined,
  })
}

/**
 * Hook to get a single customer PO
 */
export function useCustomerPo(poId: string) {
  return useQuery<CustomerPO>({
    queryKey: customerPoKeys.detail(poId),
    queryFn: async () => {
      const response = await customerPoApi.get(poId)
      return response.data
    },
    enabled: !!poId,
  })
}

/**
 * Mutation to create a customer PO
 */
export function useCreateCustomerPo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CustomerPOCreate) => {
      const response = await customerPoApi.create(data)
      return response.data
    },
    onSuccess: (newPo) => {
      // Invalidate and refetch customer POs list immediately
      queryClient.invalidateQueries({
        queryKey: customerPoKeys.lists(),
        refetchType: 'all'
      })

      // Add new customer PO to cache
      queryClient.setQueryData<CustomerPO>(
        customerPoKeys.detail(newPo.id),
        newPo
      )
    },
  })
}

/**
 * Mutation to update a customer PO
 */
export function useUpdateCustomerPo(poId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CustomerPOUpdate) => {
      const response = await customerPoApi.update(poId, data)
      return response.data
    },
    onSuccess: (updatedPo) => {
      // Update cache for this customer PO
      queryClient.setQueryData<CustomerPO>(
        customerPoKeys.detail(poId),
        updatedPo
      )

      // Invalidate lists and refetch immediately
      queryClient.invalidateQueries({
        queryKey: customerPoKeys.lists(),
        refetchType: 'all'
      })
    },
  })
}

/**
 * Mutation to update customer PO status
 */
export function useUpdateCustomerPoStatus(poId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CustomerPOStatusUpdate) => {
      const response = await customerPoApi.updateStatus(poId, data)
      return response.data
    },
    onSuccess: (updatedPo) => {
      // Update cache for this customer PO
      queryClient.setQueryData<CustomerPO>(
        customerPoKeys.detail(poId),
        updatedPo
      )

      // Invalidate lists and deals (since deal status may have changed)
      queryClient.invalidateQueries({ queryKey: customerPoKeys.lists() })
      if (updatedPo.deal_id) {
        queryClient.invalidateQueries({ queryKey: ["deals"] })
      }
    },
  })
}

/**
 * Mutation to delete a customer PO
 */
export function useDeleteCustomerPo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (poId: string) => {
      const response = await customerPoApi.delete(poId)
      return response
    },
    onSuccess: (data, poId) => {
      // Invalidate customer POs list and refetch immediately
      queryClient.invalidateQueries({
        queryKey: customerPoKeys.lists(),
        refetchType: "all",
      })

      // Clear all customer PO details from cache
      queryClient.removeQueries({ queryKey: customerPoKeys.details() })
    },
  })
}

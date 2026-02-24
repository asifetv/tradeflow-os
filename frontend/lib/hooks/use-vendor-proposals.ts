/**
 * React Query hooks for vendor proposal management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { vendorProposalApi } from "@/lib/api"
import {
  VendorProposal,
  VendorProposalCreate,
  VendorProposalUpdate,
  VendorProposalsListResponse,
} from "@/lib/types/vendor"

// Query keys for React Query cache
const vendorProposalKeys = {
  all: ["vendor-proposals"] as const,
  lists: () => [...vendorProposalKeys.all, "list"] as const,
  list: (filters?: {
    skip?: number
    limit?: number
    deal_id?: string
    vendor_id?: string
    status?: string
  }) => [...vendorProposalKeys.lists(), filters] as const,
  details: () => [...vendorProposalKeys.all, "detail"] as const,
  detail: (id: string) => [...vendorProposalKeys.details(), id] as const,
  compare: (dealId: string) => [...vendorProposalKeys.all, "compare", dealId] as const,
}

/**
 * Hook to list vendor proposals with optional filters
 */
export function useVendorProposals(filters?: {
  skip?: number
  limit?: number
  deal_id?: string
  vendor_id?: string
  status?: string
}) {
  return useQuery<VendorProposalsListResponse>({
    queryKey: vendorProposalKeys.list(filters),
    queryFn: async () => {
      const response = await vendorProposalApi.list({
        skip: filters?.skip ?? 0,
        limit: filters?.limit ?? 100,
        deal_id: filters?.deal_id,
        vendor_id: filters?.vendor_id,
        status: filters?.status,
      })
      return response.data
    },
  })
}

/**
 * Hook to get a single vendor proposal
 */
export function useVendorProposal(proposalId: string) {
  return useQuery<VendorProposal>({
    queryKey: vendorProposalKeys.detail(proposalId),
    queryFn: async () => {
      const response = await vendorProposalApi.get(proposalId)
      return response.data
    },
    enabled: !!proposalId,
  })
}

/**
 * Mutation to create a vendor proposal
 */
export function useCreateVendorProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VendorProposalCreate) => {
      console.log("[useCreateVendorProposal] Creating proposal with data:", data)
      try {
        const response = await vendorProposalApi.create(data)
        console.log("[useCreateVendorProposal] Success:", response.data)
        return response.data
      } catch (error: any) {
        console.error("[useCreateVendorProposal] Error:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        })
        throw error
      }
    },
    onSuccess: (newProposal) => {
      // Invalidate proposals list and compare view
      queryClient.invalidateQueries({ queryKey: vendorProposalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendorProposalKeys.compare(newProposal.deal_id) })

      // Add new proposal to cache
      queryClient.setQueryData<VendorProposal>(
        vendorProposalKeys.detail(newProposal.id),
        newProposal
      )
    },
  })
}

/**
 * Mutation to update a vendor proposal
 */
export function useUpdateVendorProposal(proposalId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: VendorProposalUpdate
    }) => {
      console.log("🔄 Mutation calling API with:", { id, data })
      try {
        const response = await vendorProposalApi.update(id, data)
        console.log("✅ API response:", response.data)
        return response.data
      } catch (error: any) {
        console.error("🔴 API error:", error.response?.status, error.response?.data)
        throw error
      }
    },
    onSuccess: (updatedProposal) => {
      // Update cache for this proposal
      queryClient.setQueryData<VendorProposal>(
        vendorProposalKeys.detail(updatedProposal.id),
        updatedProposal
      )

      // Invalidate lists and compare view
      queryClient.invalidateQueries({ queryKey: vendorProposalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendorProposalKeys.compare(updatedProposal.deal_id) })
    },
  })
}

/**
 * Mutation to delete a vendor proposal
 */
export function useDeleteVendorProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (proposalId: string) => {
      const response = await vendorProposalApi.delete(proposalId)
      return response
    },
    onSuccess: () => {
      // Invalidate proposals list
      queryClient.invalidateQueries({
        queryKey: vendorProposalKeys.lists(),
        refetchType: "all",
      })
    },
  })
}

/**
 * Hook to compare proposals for a deal
 */
export function useProposalComparison(dealId: string) {
  return useQuery({
    queryKey: vendorProposalKeys.compare(dealId),
    queryFn: async () => {
      const response = await vendorProposalApi.compare(dealId)
      return response.data
    },
    enabled: !!dealId,
  })
}

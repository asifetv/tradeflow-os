/**
 * React Query hooks for quote management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { quoteApi } from "@/lib/api"
import { ActivityLog } from "@/lib/types/deal"
import {
  Quote,
  QuoteCreate,
  QuotesListResponse,
  QuoteStatus,
  QuoteStatusUpdate,
  QuoteUpdate,
} from "@/lib/types/quote"

export interface QuoteActivityListResponse {
  activity_logs: ActivityLog[]
  total: number
  skip: number
  limit: number
}

// Query keys for React Query cache
const quoteKeys = {
  all: ["quotes"] as const,
  lists: () => [...quoteKeys.all, "list"] as const,
  list: (filters?: {
    skip?: number
    limit?: number
    customer_id?: string
    deal_id?: string
    status?: QuoteStatus
  }) => [...quoteKeys.lists(), filters] as const,
  details: () => [...quoteKeys.all, "detail"] as const,
  detail: (id: string) => [...quoteKeys.details(), id] as const,
  activities: () => [...quoteKeys.all, "activity"] as const,
  activity: (quoteId: string, skip?: number, limit?: number) => [
    ...quoteKeys.activities(),
    quoteId,
    { skip, limit },
  ] as const,
}

/**
 * Hook to list quotes with optional filters
 */
export function useQuotes(
  skip?: number,
  limit?: number,
  customer_id?: string,
  deal_id?: string,
  status?: QuoteStatus
) {
  return useQuery<QuotesListResponse>({
    queryKey: quoteKeys.list({ skip: skip ?? 0, limit: limit ?? 50, customer_id, deal_id, status }),
    queryFn: async () => {
      const response = await quoteApi.list({
        skip: skip ?? 0,
        limit: limit ?? 50,
        customer_id,
        deal_id,
        status,
      })
      return response.data
    },
    enabled: skip !== undefined && limit !== undefined,
  })
}

/**
 * Hook to get a single quote
 */
export function useQuote(quoteId: string) {
  return useQuery<Quote>({
    queryKey: quoteKeys.detail(quoteId),
    queryFn: async () => {
      const response = await quoteApi.get(quoteId)
      return response.data
    },
    enabled: !!quoteId,
  })
}

/**
 * Hook to get activity logs for a quote
 */
export function useQuoteActivity(quoteId: string, skip: number = 0, limit: number = 50) {
  return useQuery<QuoteActivityListResponse>({
    queryKey: quoteKeys.activity(quoteId, skip, limit),
    queryFn: async () => {
      const response = await quoteApi.getActivity(quoteId, { skip, limit })
      return response.data as QuoteActivityListResponse
    },
    enabled: !!quoteId,
  })
}

/**
 * Mutation to create a quote
 */
export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: QuoteCreate) => {
      const response = await quoteApi.create(data)
      return response.data
    },
    onSuccess: (newQuote) => {
      // Invalidate and refetch quotes list immediately
      queryClient.invalidateQueries({
        queryKey: quoteKeys.lists(),
        refetchType: 'all'
      })

      // Add new quote to cache
      queryClient.setQueryData<Quote>(quoteKeys.detail(newQuote.id), newQuote)

      // Invalidate deals list if quote has a deal_id (since deal status may have changed)
      if (newQuote.deal_id) {
        queryClient.invalidateQueries({
          queryKey: ["deals"],
          refetchType: 'all'
        })
      }
    },
  })
}

/**
 * Mutation to update a quote
 */
export function useUpdateQuote(quoteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: QuoteUpdate) => {
      const response = await quoteApi.update(quoteId, data)
      return response.data
    },
    onSuccess: (updatedQuote) => {
      // Update cache for this quote
      queryClient.setQueryData<Quote>(quoteKeys.detail(quoteId), updatedQuote)

      // Invalidate lists and refetch immediately
      queryClient.invalidateQueries({
        queryKey: quoteKeys.lists(),
        refetchType: 'all'
      })
    },
  })
}

/**
 * Mutation to update quote status
 */
export function useUpdateQuoteStatus(quoteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: QuoteStatusUpdate) => {
      const response = await quoteApi.updateStatus(quoteId, data)
      return response.data
    },
    onSuccess: (updatedQuote) => {
      // Update cache for this quote
      queryClient.setQueryData<Quote>(quoteKeys.detail(quoteId), updatedQuote)

      // Invalidate lists and activity logs
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: quoteKeys.activity(quoteId, 0, 50) })
    },
  })
}

/**
 * Mutation to delete a quote
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const response = await quoteApi.delete(quoteId)
      return response
    },
    onSuccess: (data, quoteId) => {
      // Invalidate quotes list and refetch immediately
      queryClient.invalidateQueries({
        queryKey: quoteKeys.lists(),
        refetchType: "all",
      })

      // Clear all quote details from cache
      queryClient.removeQueries({ queryKey: quoteKeys.details() })
    },
  })
}

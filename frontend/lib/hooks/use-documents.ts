/**
 * React Query hooks for document management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { documentApi } from "../api"
import {
  Document,
  DocumentCategory,
  DocumentDownloadUrlResponse,
  DocumentListResponse,
} from "../types/document"

// Query key factory
const documentQueryKeys = {
  all: ["documents"] as const,
  lists: () => [...documentQueryKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...documentQueryKeys.lists(), filters] as const,
  companyDocs: () => [...documentQueryKeys.all, "company"] as const,
  companyDocsList: (filters: Record<string, unknown>) =>
    [...documentQueryKeys.companyDocs(), filters] as const,
  details: () => [...documentQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...documentQueryKeys.details(), id] as const,
  downloadUrl: (id: string) => [...documentQueryKeys.detail(id), "download"] as const,
}

/**
 * Hook to list documents attached to entities
 */
export function useDocuments(
  entityType?: string,
  entityId?: string,
  category?: DocumentCategory,
  skip: number = 0,
  limit: number = 50,
  enabled: boolean = true
) {
  const filters = { entity_type: entityType, entity_id: entityId, category, skip, limit }

  return useQuery<DocumentListResponse>({
    queryKey: documentQueryKeys.list(filters),
    queryFn: () =>
      documentApi
        .list({
          skip,
          limit,
          entity_type: entityType,
          entity_id: entityId,
          category,
        })
        .then((res) => res.data),
    enabled:
      enabled && Boolean(entityType !== undefined && entityId !== undefined),
    staleTime: 60 * 1000, // 60 seconds
  })
}

/**
 * Hook to list company-level documents
 */
export function useCompanyDocuments(
  category?: DocumentCategory,
  skip: number = 0,
  limit: number = 50,
  enabled: boolean = true
) {
  const filters = { category, skip, limit }

  return useQuery<DocumentListResponse>({
    queryKey: documentQueryKeys.companyDocsList(filters),
    queryFn: () =>
      documentApi
        .listCompanyDocuments({
          skip,
          limit,
          category,
        })
        .then((res) => res.data),
    enabled,
    staleTime: 60 * 1000, // 60 seconds
  })
}

/**
 * Hook to get single document
 */
export function useDocument(documentId: string, enabled: boolean = true) {
  return useQuery<Document>({
    queryKey: documentQueryKeys.detail(documentId),
    queryFn: () =>
      documentApi.get(documentId).then((res) => res.data),
    enabled: enabled && Boolean(documentId),
    staleTime: 60 * 1000, // 60 seconds
  })
}

/**
 * Hook to get presigned download URL
 */
export function useDownloadUrl(documentId: string, enabled: boolean = false) {
  return useQuery<DocumentDownloadUrlResponse>({
    queryKey: documentQueryKeys.downloadUrl(documentId),
    queryFn: () =>
      documentApi.getDownloadUrl(documentId).then((res) => res.data),
    enabled: enabled && Boolean(documentId),
    staleTime: 60 * 1000, // 60 seconds (URL is valid for 60 minutes)
  })
}

/**
 * Hook to upload a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await documentApi.upload(formData)
      return response.data
    },
    onSuccess: (document) => {
      // Invalidate related document lists based on entity
      if (document.entity_type && document.entity_id) {
        queryClient.invalidateQueries({
          queryKey: documentQueryKeys.list({
            entity_type: document.entity_type,
            entity_id: document.entity_id,
          }),
        })
      } else {
        // Invalidate company documents
        queryClient.invalidateQueries({
          queryKey: documentQueryKeys.companyDocsList({}),
        })
      }

      // Add to cache
      queryClient.setQueryData(
        documentQueryKeys.detail(document.id),
        document
      )
    },
    onError: (error: any) => {
      console.error("Document upload failed:", error)
    },
  })
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      await documentApi.delete(documentId)
    },
    onSuccess: (_data, documentId) => {
      // Invalidate all document queries
      queryClient.invalidateQueries({
        queryKey: documentQueryKeys.all,
      })

      // Remove from cache
      queryClient.removeQueries({
        queryKey: documentQueryKeys.detail(documentId),
      })
    },
    onError: (error: any) => {
      console.error("Document deletion failed:", error)
    },
  })
}

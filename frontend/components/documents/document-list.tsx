"use client"

import { useState } from "react"
import {
  DownloadIcon,
  Trash2Icon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  FileIcon,
  Eye,
  Import,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Document,
  DocumentListItem,
  DocumentCategory,
  DocumentStatus,
  formatFileSize,
  getCategoryLabel,
  getStatusLabel,
} from "@/lib/types/document"
import { useDocuments, useDeleteDocument } from "@/lib/hooks/use-documents"
import { documentApi } from "@/lib/api"
import { ExtractedDataModal } from "./extracted-data-modal"

interface DocumentListProps {
  entityType?: string
  entityId?: string
  category?: DocumentCategory
  disabled?: boolean
  onUseExtractedData?: (data: any, category: DocumentCategory | string) => void
  currentCustomerName?: string
}

export function DocumentList({
  entityType,
  entityId,
  category,
  disabled = false,
  onUseExtractedData,
  currentCustomerName,
}: DocumentListProps) {
  const [skip, setSkip] = useState(0)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingExtractedData, setPendingExtractedData] = useState<any>(null)
  const [showCustomerMismatchDialog, setShowCustomerMismatchDialog] = useState(false)
  const limit = 10

  const {
    data: listData,
    isLoading,
    isError,
  } = useDocuments(entityType, entityId, category, skip, limit, true)

  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument()

  const documents = listData?.items || []
  const total = listData?.total || 0

  const handleDelete = (documentId: string) => {
    deleteDocument(documentId)
  }

  const handleDownload = async (doc: DocumentListItem) => {
    try {
      const response = await documentApi.getDownloadUrl(doc.id)
      const downloadUrl = response.data.url
      // Open the download URL in a new tab
      window.open(downloadUrl, "_blank")
    } catch (error) {
      console.error("Failed to get download URL:", error)
    }
  }

  const handleViewData = (doc: Document) => {
    setSelectedDocument(doc)
    setIsModalOpen(true)
  }

  const handleUseData = (extractedData: any) => {
    // Check for customer name mismatch
    const extractedCustomerName = extractedData.customer_name?.trim().toLowerCase()
    const currentCustomer = currentCustomerName?.trim().toLowerCase()

    if (
      extractedCustomerName &&
      currentCustomer &&
      extractedCustomerName !== currentCustomer
    ) {
      // Store the data and show confirmation dialog
      setPendingExtractedData(extractedData)
      setShowCustomerMismatchDialog(true)
    } else {
      // No mismatch, proceed immediately
      if (selectedDocument && onUseExtractedData) {
        onUseExtractedData(extractedData, selectedDocument.category)
      }
    }
  }

  const handleConfirmMismatch = (proceed: boolean) => {
    try {
      if (proceed && pendingExtractedData && selectedDocument && onUseExtractedData) {
        console.log("Proceeding with extracted data despite mismatch:", pendingExtractedData)
        onUseExtractedData(pendingExtractedData, selectedDocument.category)
      }
    } finally {
      setShowCustomerMismatchDialog(false)
      setPendingExtractedData(null)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2">
          <LoaderIcon className="h-5 w-5 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load documents</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <FileIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
        <p className="text-gray-600">No documents yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Upload a document to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold">Documents ({total})</h3>

      <div className="space-y-3">
        {documents.map((doc) => {
          const status = doc.status as DocumentStatus
          const statusLabel = getStatusLabel(status)
          const hasConfidence = doc.ai_confidence_score !== null

          return (
            <div
              key={doc.id}
              className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex-1 min-w-0">
                {/* File info */}
                <div className="flex items-start gap-3">
                  <FileIcon className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {doc.original_filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.file_size_bytes)} •{" "}
                      {getCategoryLabel(doc.category)} •{" "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>

                    {doc.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {doc.description}
                      </p>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status and confidence */}
                <div className="mt-3 flex items-center gap-2">
                  <div className={`rounded-full px-2 py-1 text-xs font-medium ${statusLabel.color}`}>
                    <div className="flex items-center gap-1">
                      {status === DocumentStatus.COMPLETED && (
                        <CheckCircleIcon className="h-3 w-3" />
                      )}
                      {status === DocumentStatus.PROCESSING && (
                        <LoaderIcon className="h-3 w-3 animate-spin" />
                      )}
                      {status === DocumentStatus.FAILED && (
                        <AlertCircleIcon className="h-3 w-3" />
                      )}
                      {statusLabel.label}
                    </div>
                  </div>

                  {hasConfidence && (
                    <div className="text-xs text-gray-600">
                      Confidence: {(doc.ai_confidence_score! * 100).toFixed(0)}%
                    </div>
                  )}

                  {doc.error_message && (
                    <div
                      className="text-xs text-red-600"
                      title={doc.error_message}
                    >
                      Error: {doc.error_message.slice(0, 30)}...
                    </div>
                  )}
                </div>

                {/* Parsed data preview */}
                {doc.parsed_data && Object.keys(doc.parsed_data).length > 0 && (
                  <div className="mt-2 rounded-sm bg-white p-2 text-xs text-gray-600">
                    <p className="font-medium text-gray-700">Extracted data:</p>
                    <p className="truncate">
                      {JSON.stringify(doc.parsed_data).slice(0, 100)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="ml-4 flex flex-shrink-0 gap-2">
                {doc.status === DocumentStatus.COMPLETED &&
                  doc.parsed_data &&
                  Object.keys(doc.parsed_data).length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewData(doc as Document)}
                        disabled={disabled}
                        title="View extracted data"
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>

                      {onUseExtractedData && (
                        <Button
                          size="sm"
                          onClick={() => {
                            handleUseData(doc.parsed_data)
                          }}
                          disabled={disabled}
                          title="Use extracted data to populate form"
                          className="gap-1"
                        >
                          <Import className="h-4 w-4" />
                          Use Data
                        </Button>
                      )}
                    </>
                  )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={disabled}
                  title="Download document"
                >
                  <DownloadIcon className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={disabled || isDeleting}
                      title="Delete document"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete {doc.original_filename}. This action cannot
                      be undone.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-3">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(doc.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSkip(skip + limit)}
              disabled={skip + limit >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Customer Mismatch Confirmation Dialog */}
      {showCustomerMismatchDialog && (
        <AlertDialog open={showCustomerMismatchDialog} onOpenChange={setShowCustomerMismatchDialog}>
          <AlertDialogContent>
            <AlertDialogTitle className="text-yellow-900 flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5 text-yellow-600" />
              Customer Name Mismatch
            </AlertDialogTitle>
            <div className="space-y-3 text-sm text-yellow-800">
              <p>
                The customer name extracted from the document does not match the customer for this deal:
              </p>
              <div className="bg-yellow-50 p-3 rounded space-y-2">
                <div>
                  <span className="font-semibold">Extracted from document:</span>
                  <p className="text-yellow-900">
                    {pendingExtractedData?.customer_name}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Deal customer:</span>
                  <p className="text-yellow-900">{currentCustomerName}</p>
                </div>
              </div>
              <p className="text-xs">
                Please verify that you want to proceed with this data. You can edit the customer name in the form if needed.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                onClick={() => {
                  handleConfirmMismatch(true)
                  setShowCustomerMismatchDialog(false)
                }}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Proceed Anyway
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Extracted Data Modal */}
      {selectedDocument && (
        <ExtractedDataModal
          document={selectedDocument}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedDocument(null)
          }}
          onUseData={handleUseData}
        />
      )}
    </div>
  )
}

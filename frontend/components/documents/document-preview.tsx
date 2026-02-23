"use client"

import { LoaderIcon } from "lucide-react"
import { Document, DocumentStatus } from "@/lib/types/document"
import { useDocument, useDownloadUrl } from "@/lib/hooks/use-documents"

interface DocumentPreviewProps {
  documentId: string
}

export function DocumentPreview({ documentId }: DocumentPreviewProps) {
  const { data: document, isLoading, isError } = useDocument(documentId)
  const { data: downloadUrl } = useDownloadUrl(
    documentId,
    document?.status === DocumentStatus.COMPLETED
  )

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <LoaderIcon className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (isError || !document) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load document</p>
      </div>
    )
  }

  if (document.status === DocumentStatus.PROCESSING) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50">
        <div className="flex flex-col items-center gap-2">
          <LoaderIcon className="h-8 w-8 animate-spin text-yellow-600" />
          <p className="text-yellow-800">Processing document...</p>
        </div>
      </div>
    )
  }

  if (document.status === DocumentStatus.FAILED) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">
          Document processing failed
        </p>
        {document.error_message && (
          <p className="mt-1 text-sm text-red-700">{document.error_message}</p>
        )}
      </div>
    )
  }

  // PDF Preview
  if (document.mime_type === "application/pdf" && downloadUrl) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <iframe
          src={`${downloadUrl.url}#toolbar=1`}
          title={document.original_filename}
          width="100%"
          height="600"
          className="border-0"
        />
        <div className="bg-gray-50 p-4 text-sm text-gray-600">
          <a
            href={downloadUrl.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open in new tab →
          </a>
        </div>
      </div>
    )
  }

  // Text Preview (for extracted text or other document types)
  if (document.extracted_text) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap break-words text-sm text-gray-700">
            {document.extracted_text}
          </pre>
        </div>
      </div>
    )
  }

  // Extracted Data Preview
  if (document.parsed_data && Object.keys(document.parsed_data).length > 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="mb-3 font-semibold text-gray-900">Extracted Data</h4>
        <div className="max-h-96 overflow-y-auto">
          <pre className="text-sm text-gray-700">
            {JSON.stringify(document.parsed_data, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  // No preview available
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
      <p className="text-gray-600">
        Preview not available for {document.mime_type}
      </p>
      {downloadUrl && (
        <a
          href={downloadUrl.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-blue-600 hover:underline"
        >
          Download file →
        </a>
      )}
    </div>
  )
}

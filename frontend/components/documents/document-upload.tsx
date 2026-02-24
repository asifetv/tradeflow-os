"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { CloudUploadIcon, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DocumentCategory, formatFileSize } from "@/lib/types/document"
import { useUploadDocument } from "@/lib/hooks/use-documents"
import { getCategoryLabel } from "@/lib/types/document"
import { toast } from "sonner"

interface DocumentUploadProps {
  category: DocumentCategory
  entityType?: string
  entityId?: string
  onUploadSuccess?: () => void
  disabled?: boolean
}

const ALLOWED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/tiff": [".tiff", ".tif"],
  "image/webp": [".webp"],
}

export function DocumentUpload({
  category,
  entityType,
  entityId,
  onUploadSuccess,
  disabled = false,
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const { mutate: uploadDocument, isPending, isError, error } = useUploadDocument()

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 1,
    disabled: disabled || isPending,
  })

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("category", category)
    if (entityType) formData.append("entity_type", entityType)
    if (entityId) formData.append("entity_id", entityId)
    if (description) formData.append("description", description)
    if (tags.length > 0) formData.append("tags", tags.join(","))

    console.log("[DocumentUpload] Starting upload for:", selectedFile.name)

    uploadDocument(formData, {
      onSuccess: (data) => {
        console.log("[DocumentUpload] Upload successful:", data)
        // Show success notification
        toast.success(`✅ ${selectedFile.name} uploaded and processing started`, {
          description: "Document is being analyzed by AI. This may take 5-15 seconds.",
          duration: 5000,
        })

        // Show success state briefly
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)

        // Reset form
        setSelectedFile(null)
        setDescription("")
        setTags([])
        setTagInput("")
        onUploadSuccess?.()
      },
      onError: (error: any) => {
        console.error("[DocumentUpload] Upload error:", error)
        const errorMsg = error.response?.data?.detail || error.message || "Upload failed"
        toast.error("❌ Upload failed", {
          description: errorMsg,
          duration: 5000,
        })
      },
    })
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">
        Upload {getCategoryLabel(category)}
      </h3>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`mb-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        } ${disabled || isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <p className="mb-2 text-sm font-medium text-gray-700">
          {isDragActive
            ? "Drop the file here"
            : "Drag and drop a file here, or click to select"}
        </p>
        <p className="text-xs text-gray-500">
          PDF, Excel, Word, or Image (max 25MB)
        </p>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Description Field */}
      <div className="mb-4">
        <Label htmlFor="description" className="mb-2 block text-sm">
          Description (optional)
        </Label>
        <Input
          id="description"
          placeholder="e.g., RFQ from ABC Company"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          disabled={disabled || isPending}
        />
        <p className="mt-1 text-xs text-gray-500">
          {description.length}/500 characters
        </p>
      </div>

      {/* Tags Field */}
      <div className="mb-4">
        <Label htmlFor="tag-input" className="mb-2 block text-sm">
          Tags (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            id="tag-input"
            placeholder="Enter a tag and press Add"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddTag()
              }
            }}
            disabled={disabled || isPending}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || disabled || isPending}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-green-50 p-3">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Upload successful!</p>
            <p className="text-xs text-green-700 mt-1">
              Document is being processed by AI for data extraction.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {isError && (
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Upload failed</p>
            <p className="text-xs text-red-700 mt-1">
              {error instanceof Error ? error.message : "An error occurred during upload"}
            </p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || disabled || isPending}
        className="w-full"
      >
        {isPending ? "Uploading and processing..." : "Upload and Process"}
      </Button>

      {isPending && (
        <p className="mt-2 text-center text-sm text-blue-600 font-medium">
          ⏳ This may take 5-15 seconds while we extract and analyze the document...
        </p>
      )}
    </div>
  )
}

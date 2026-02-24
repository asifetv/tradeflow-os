/**
 * Document management types for M4 AI Document Management
 */

export enum DocumentCategory {
  RFQ = "rfq",
  VENDOR_PROPOSAL = "vendor_proposal",
  CERTIFICATE = "certificate",
  MATERIAL_CERTIFICATE = "material_certificate",
  SPEC_SHEET = "spec_sheet",
  INVOICE = "invoice",
  PACKING_LIST = "packing_list",
  TEST_REPORT = "test_report",
  COMPANY_POLICY = "company_policy",
  TEMPLATE = "template",
  OTHER = "other",
}

export enum DocumentStatus {
  UPLOADING = "uploading",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface Document {
  id: string;
  company_id: string;
  entity_type: string | null;
  entity_id: string | null;
  category: DocumentCategory;
  storage_bucket: string;
  storage_key: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  extracted_text?: string; // May be large, excluded from list responses
  parsed_data?: Record<string, unknown> | null;
  status: DocumentStatus;
  ai_confidence_score?: number | null;
  error_message?: string | null;
  description?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DocumentListItem {
  id: string;
  company_id: string;
  entity_type: string | null;
  entity_id: string | null;
  category: DocumentCategory;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  parsed_data?: Record<string, unknown> | null;
  status: DocumentStatus;
  ai_confidence_score?: number | null;
  error_message?: string | null;
  description?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: DocumentListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface DocumentDownloadUrlResponse {
  url: string;
  expires_in_minutes: number;
  filename: string;
}

export interface DocumentUploadFormData {
  file: File;
  category: DocumentCategory;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  tags?: string[];
}

/**
 * Helper to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Helper to get category display name
 */
export function getCategoryLabel(category: DocumentCategory): string {
  const labels: Record<DocumentCategory, string> = {
    [DocumentCategory.RFQ]: "Request for Quote",
    [DocumentCategory.VENDOR_PROPOSAL]: "Vendor Proposal",
    [DocumentCategory.CERTIFICATE]: "Certificate",
    [DocumentCategory.MATERIAL_CERTIFICATE]: "Material Certificate",
    [DocumentCategory.SPEC_SHEET]: "Specification Sheet",
    [DocumentCategory.INVOICE]: "Invoice",
    [DocumentCategory.PACKING_LIST]: "Packing List",
    [DocumentCategory.TEST_REPORT]: "Test Report",
    [DocumentCategory.COMPANY_POLICY]: "Company Policy",
    [DocumentCategory.TEMPLATE]: "Template",
    [DocumentCategory.OTHER]: "Other",
  };

  return labels[category] || category;
}

/**
 * Helper to get status display name with color
 */
export function getStatusLabel(
  status: DocumentStatus
): { label: string; color: string } {
  const statusMap: Record<
    DocumentStatus,
    { label: string; color: string }
  > = {
    [DocumentStatus.UPLOADING]: {
      label: "Uploading",
      color: "bg-blue-100 text-blue-800",
    },
    [DocumentStatus.PROCESSING]: {
      label: "Processing",
      color: "bg-yellow-100 text-yellow-800",
    },
    [DocumentStatus.COMPLETED]: {
      label: "Completed",
      color: "bg-green-100 text-green-800",
    },
    [DocumentStatus.FAILED]: { label: "Failed", color: "bg-red-100 text-red-800" },
  };

  return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}

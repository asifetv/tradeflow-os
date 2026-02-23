"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/documents/document-upload"
import { DocumentList } from "@/components/documents/document-list"
import { DocumentCategory } from "@/lib/types/document"

export default function CompanyDocumentsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Company Documents</h1>
          <p className="text-gray-600 mt-2">
            Manage company-wide documents, policies, and templates
          </p>
        </div>
        <Link href="/deals">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>
        </Link>
      </div>

      {/* Tabs for Different Document Types */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="policies">Company Policies</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        {/* All Documents Tab */}
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
              <DocumentUpload
                category={DocumentCategory.COMPANY_POLICY}
                onUploadSuccess={() => {
                  // List will auto-refresh via React Query
                }}
              />
            </div>

            {/* Documents List */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">All Company Documents</h2>
              <DocumentList />
            </div>
          </div>
        </TabsContent>

        {/* Company Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Upload Policy</h2>
              <DocumentUpload
                category={DocumentCategory.COMPANY_POLICY}
                onUploadSuccess={() => {
                  // List will auto-refresh via React Query
                }}
              />
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Company Policies</h2>
              <DocumentList category={DocumentCategory.COMPANY_POLICY} />
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Upload Template</h2>
              <DocumentUpload
                category={DocumentCategory.TEMPLATE}
                onUploadSuccess={() => {
                  // List will auto-refresh via React Query
                }}
              />
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Templates</h2>
              <DocumentList category={DocumentCategory.TEMPLATE} />
            </div>
          </div>
        </TabsContent>

        {/* Other Tab */}
        <TabsContent value="other" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
              <DocumentUpload
                category={DocumentCategory.OTHER}
                onUploadSuccess={() => {
                  // List will auto-refresh via React Query
                }}
              />
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Other Documents</h2>
              <DocumentList />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supported Formats</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <ul className="list-disc list-inside space-y-1">
              <li>PDF files</li>
              <li>Microsoft Excel (XLSX, XLS)</li>
              <li>Microsoft Word (DOCX, DOC)</li>
              <li>Images (JPG, PNG, GIF, TIFF, WebP)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">File Size Limit</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <p>
              Maximum file size is <strong>25 MB</strong>. Files are automatically processed
              with AI extraction to pull out key information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

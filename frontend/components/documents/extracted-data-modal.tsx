/**
 * Modal to display and use extracted document data
 */

"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

import { Document } from "@/lib/types/document"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ExtractedDataModalProps {
  document: Document
  isOpen: boolean
  onClose: () => void
  onUseData: (extractedData: any) => void
}

export function ExtractedDataModal({
  document,
  isOpen,
  onClose,
  onUseData,
}: ExtractedDataModalProps) {
  const [copied, setCopied] = useState(false)

  if (!document.parsed_data || Object.keys(document.parsed_data).length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extracted Data</DialogTitle>
            <DialogDescription>
              No data was extracted from this document.
            </DialogDescription>
          </DialogHeader>
          {document.error_message && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
              {document.error_message}
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(document.parsed_data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extracted Data from {document.original_filename}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {document.ai_confidence_score !== null && document.ai_confidence_score !== undefined && (
              <Badge variant={document.ai_confidence_score > 0.7 ? "default" : "secondary"}>
                Confidence: {(document.ai_confidence_score * 100).toFixed(0)}%
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{document.category}</span>
          </div>
        </DialogHeader>

        {/* Extracted Data Preview */}
        <div className="space-y-4">
          {renderExtractedData(document.parsed_data)}
        </div>

        {/* Copy JSON Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyJSON}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy JSON
              </>
            )}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              // Extract the actual data from the parsed_data wrapper
              const actualData = document.parsed_data?.data || document.parsed_data
              onUseData(actualData)
              onClose()
            }}
            className="gap-2"
          >
            Use This Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Recursively render extracted data as readable cards
 */
function renderExtractedData(data: any, depth = 0): JSX.Element[] {
  const elements: JSX.Element[] = []

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue

    if (Array.isArray(value)) {
      // Render array of line items
      elements.push(
        <Card key={key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium capitalize">
              {key.replace(/_/g, " ")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {value.map((item, idx) => (
                <div
                  key={idx}
                  className="border rounded p-3 text-sm bg-muted/50"
                >
                  {typeof item === "object" ? (
                    <div className="space-y-1">
                      {Object.entries(item).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4">
                          <span className="text-muted-foreground capitalize">
                            {k.replace(/_/g, " ")}:
                          </span>
                          <span className="font-medium text-right">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span>{String(item)}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )
    } else if (typeof value === "object") {
      // Render nested objects
      elements.push(
        <Card key={key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium capitalize">
              {key.replace(/_/g, " ")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(value).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-muted-foreground capitalize text-sm">
                  {k.replace(/_/g, " ")}:
                </span>
                <span className="font-medium text-right text-sm">
                  {String(v)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )
    } else {
      // Render simple key-value pairs
      elements.push(
        <div
          key={key}
          className="flex justify-between items-center p-3 border rounded bg-muted/50"
        >
          <span className="text-sm font-medium capitalize">
            {key.replace(/_/g, " ")}
          </span>
          <span className="text-sm font-mono">{String(value)}</span>
        </div>
      )
    }
  }

  return elements
}

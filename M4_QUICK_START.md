# M4 Quick Start Guide

## Current Status

✅ **Phase 1-2 COMPLETE** - All backend services and frontend components implemented
🔄 **Phase 3 TODO** - Integrate documents into entity pages
🔄 **Phase 4 TODO** - Testing and refinement

## Quick Verification

### Backend Setup

```bash
# 1. Install dependencies (if not already done)
cd backend
pip install openpyxl==3.1.2 python-docx==1.1.0

# 2. Start MinIO (required for document storage)
docker run -d -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# 3. Verify environment variables in .env
# Required:
# - MINIO_ENDPOINT=localhost:9000
# - MINIO_ACCESS_KEY=minioadmin
# - MINIO_SECRET_KEY=minioadmin
# - MINIO_BUCKET=documents
# - ANTHROPIC_API_KEY=sk-ant-...

# 4. Start backend
cd backend
uvicorn app.main:app --reload

# 5. Check API docs
# Open http://localhost:8000/docs
# Should see all /api/documents/* endpoints
```

### Frontend Setup

```bash
# 1. Frontend dependencies already installed
cd frontend
npm install  # Just to be safe

# 2. Start frontend
npm run dev

# 3. Open http://localhost:3000
```

### Test API Endpoint

```bash
# Using curl to upload a test PDF
curl -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Subdomain: demo" \
  -F "file=@test_rfq.pdf" \
  -F "category=rfq" \
  -F "description=Test RFQ from ABC Company"
```

## File References

### Backend Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `app/models/document.py` | Document model with polymorphic relationships | 95 |
| `app/services/storage.py` | MinIO file operations | 140 |
| `app/services/document_parsing.py` | Text extraction (PDF/Excel/Word/OCR) | 230 |
| `app/services/ai_extraction.py` | Claude AI extraction with category prompts | 200 |
| `app/services/document.py` | Main orchestration service | 330 |
| `app/schemas/document.py` | Pydantic validation schemas | 100 |
| `app/api/documents.py` | FastAPI routes (6 endpoints) | 210 |
| `alembic/versions/005_add_document_management.py` | Database migration | 40 |

### Frontend Component Files

| File | Purpose | Lines |
|------|---------|-------|
| `lib/types/document.ts` | TypeScript enums and interfaces | 150 |
| `lib/hooks/use-documents.ts` | React Query hooks (5 hooks) | 180 |
| `components/documents/document-upload.tsx` | Drag-drop file upload component | 210 |
| `components/documents/document-list.tsx` | Document list with pagination | 240 |
| `components/documents/document-preview.tsx` | PDF/text preview component | 120 |

## API Endpoints Reference

### Upload Document
```
POST /api/documents/upload
Content-Type: multipart/form-data

FormData:
  file: File
  category: DocumentCategory (required)
  entity_type: string (optional - "Deal", "Quote", "Vendor", etc.)
  entity_id: UUID (optional - must be set if entity_type is set)
  description: string (optional)
  tags: string (optional - comma-separated)

Response:
  {
    id: UUID,
    status: "processing" | "completed" | "failed",
    parsed_data: { ...extracted fields... },
    ai_confidence_score: 0.0-1.0,
    ...
  }
```

### List Documents
```
GET /api/documents
Query params:
  entity_type?: string
  entity_id?: UUID
  category?: DocumentCategory
  skip?: number (default 0)
  limit?: number (default 50)

Response:
  {
    items: Document[],
    total: number,
    skip: number,
    limit: number
  }
```

### Get Single Document
```
GET /api/documents/{document_id}

Response: Document (includes extracted_text)
```

### Get Download URL
```
GET /api/documents/{document_id}/download

Response:
  {
    url: "presigned_url",
    expires_in_minutes: 60,
    filename: "original_filename.pdf"
  }
```

### Delete Document
```
DELETE /api/documents/{document_id}

Response: 204 No Content
```

## Component Usage Examples

### Upload Component
```typescript
import { DocumentUpload } from "@/components/documents/document-upload"
import { DocumentCategory } from "@/lib/types/document"

export function DealDocuments({ dealId }: { dealId: string }) {
  return (
    <DocumentUpload
      category={DocumentCategory.RFQ}
      entityType="Deal"
      entityId={dealId}
      onUploadSuccess={() => {
        // Refresh deal or document list
      }}
    />
  )
}
```

### List Component
```typescript
import { DocumentList } from "@/components/documents/document-list"
import { DocumentCategory } from "@/lib/types/document"

export function VendorProposalDocs({ proposalId }: { proposalId: string }) {
  return (
    <DocumentList
      entityType="VendorProposal"
      entityId={proposalId}
      category={DocumentCategory.VENDOR_PROPOSAL}
    />
  )
}
```

### Preview Component
```typescript
import { DocumentPreview } from "@/components/documents/document-preview"

export function DocumentViewer({ documentId }: { documentId: string }) {
  return <DocumentPreview documentId={documentId} />
}
```

## Next Steps

### Phase 3: Integration (1-2 hours)

1. **Add Documents Tab to Deal Detail Page**
   - File: `frontend/app/deals/[id]/page.tsx`
   - Add "Documents" tab with DocumentUpload and DocumentList
   - Category: RFQ
   - Entity: Deal

2. **Add Documents to Vendor Proposal**
   - File: `frontend/app/vendor-proposals/[id]/page.tsx`
   - Add Documents section
   - Category: VENDOR_PROPOSAL
   - Auto-populate form from parsed_data on upload

3. **Add Documents to Vendor Detail**
   - File: `frontend/app/vendors/[id]/page.tsx`
   - Category: CERTIFICATE, SPEC_SHEET
   - Show vendor certifications and spec sheets

4. **Create Company Documents Page**
   - File: `frontend/app/documents/page.tsx`
   - List company-level documents (no entity_type)
   - Upload company policies and templates
   - Categories: COMPANY_POLICY, TEMPLATE

5. **Update Navigation**
   - Add "Documents" link to main menu
   - Link to `/documents` for company docs

### Phase 4: Testing (2-3 hours)

1. **Backend Unit Tests**
   - `tests/test_document_service.py` - Service logic
   - `tests/test_storage_service.py` - MinIO operations
   - `tests/test_document_parsing.py` - Text extraction
   - `tests/test_ai_extraction.py` - Claude integration (mocked)

2. **Integration Tests**
   - Full upload-to-processing flow
   - Multi-tenancy isolation
   - File type validation
   - Error scenarios

3. **Manual Testing Checklist**
   - [ ] Upload PDF RFQ → verify extracted data
   - [ ] Upload Excel price sheet → verify text extraction
   - [ ] Upload scanned certificate → verify OCR
   - [ ] Download document → verify presigned URL
   - [ ] Delete document → verify soft delete
   - [ ] Check multi-tenancy → Company A can't see Company B docs
   - [ ] Verify status progression → PROCESSING → COMPLETED
   - [ ] Check error handling → Failed extraction shows error message

4. **Performance Testing**
   - Upload large PDF (>10MB)
   - Upload image requiring OCR
   - Batch upload 10+ documents
   - Measure extraction times

5. **Error Scenario Testing**
   - Upload unsupported file type
   - Upload file >25MB
   - Network timeout during upload
   - MinIO unavailable
   - Claude API timeout
   - Invalid JWT token

## Testing with Sample Files

Create test files for manual testing:

```bash
# Create sample RFQ PDF (using reportlab or copy existing)
# Save as: tests/fixtures/sample_rfq.pdf

# Create sample vendor proposal PDF
# Save as: tests/fixtures/sample_proposal.pdf

# Create sample certificate image (PNG or JPEG of a scan)
# Save as: tests/fixtures/sample_certificate.png

# Create sample Excel file
# Save as: tests/fixtures/sample_prices.xlsx
```

## Debugging Tips

### Check MinIO Connection
```python
from app.services.storage import StorageService
service = StorageService()
print(service.bucket_name)  # Should print "documents"
```

### Test AI Extraction
```python
from app.services.ai_extraction import AIExtractionService
from app.models.document import DocumentCategory

service = AIExtractionService()
result = service.extract_structured_data(
    extracted_text="Sample RFQ with vendor info...",
    category=DocumentCategory.RFQ
)
print(result)  # Should show extracted data and confidence
```

### Test Document Parsing
```python
from app.services.document_parsing import DocumentParsingService

# Test PDF extraction
with open("test.pdf", "rb") as f:
    content = f.read()
    text = DocumentParsingService.extract_text(content, "application/pdf")
    print(text[:500])  # Print first 500 chars
```

## Environment Variables Check

```bash
# Verify all required variables in .env
echo "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:?Missing ANTHROPIC_API_KEY}"
echo "MINIO_ENDPOINT=${MINIO_ENDPOINT:?Missing MINIO_ENDPOINT}"
echo "MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:?Missing MINIO_ACCESS_KEY}"
echo "MINIO_SECRET_KEY=${MINIO_SECRET_KEY:?Missing MINIO_SECRET_KEY}"
echo "MINIO_BUCKET=${MINIO_BUCKET:?Missing MINIO_BUCKET}"
```

## Database Check

```bash
# Check if documents table was created
# With automatic table creation:
# 1. Start backend (uvicorn)
# 2. Check database: SELECT * FROM documents;

# Or run migration manually:
# cd backend
# alembic upgrade head
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'openpyxl'"
**Solution:** `pip install openpyxl==3.1.2`

### Issue: "ModuleNotFoundError: No module named 'docx'"
**Solution:** `pip install python-docx==1.1.0`

### Issue: MinIO connection failed
**Solution:**
1. Check MinIO is running: `docker ps | grep minio`
2. Verify endpoint in .env: `MINIO_ENDPOINT=localhost:9000`
3. Check credentials match docker command

### Issue: Claude API returns empty or invalid JSON
**Solution:**
1. Check `ANTHROPIC_API_KEY` is valid
2. Verify extracted_text is not empty
3. Check token limit (max 4096)

### Issue: File upload shows "Unsupported file type"
**Solution:** Check MIME type is in whitelist:
- PDF: `application/pdf`
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Word: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Images: `image/*`

## Performance Benchmarks

### Expected Times
- Small PDF (<1MB): 2-3 seconds
- Text extraction: <2 seconds
- Claude AI call: 3-8 seconds
- Total processing: 5-15 seconds

### Optimization Tips
- Use PDF with embedded text (faster than OCR)
- Keep extracted text <8000 chars
- Implement async for large batches
- Cache AI responses for same content

## Success Indicators

✅ All API endpoints respond correctly
✅ Documents appear in list after upload
✅ AI confidence scores >0.7 for standard documents
✅ Presigned URLs expire after 1 hour
✅ Multi-tenancy isolation verified
✅ Soft delete preserves data
✅ Activity logs created for uploads

---

**Ready to proceed with Phase 3 integration?**

See `M4_IMPLEMENTATION_SUMMARY.md` for full technical details.

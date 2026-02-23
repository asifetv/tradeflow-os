# M4 Testing Guide - Manual & Automated Testing

**Date:** 2026-02-23
**Status:** Phase 4 - Testing Implementation
**Test Coverage:** Unit tests, Integration tests, Manual testing

---

## Test Files Created

### Backend Unit Tests (4 files)

1. **`/backend/tests/test_document_service.py`** (40+ test cases)
   - Full document upload and processing flow
   - Entity-level documents (Deal, VendorProposal, Vendor)
   - Company-level documents
   - File size validation
   - Error handling (parsing failures, AI timeouts)
   - Multi-tenancy isolation
   - Pagination
   - Soft delete

2. **`/backend/tests/test_storage_service.py`** (15+ test cases)
   - MinIO file upload
   - Different MIME types
   - File download
   - Presigned URL generation
   - File deletion
   - Storage path format validation
   - Large file handling

3. **`/backend/tests/test_document_parsing.py`** (12+ test cases)
   - PDF text extraction
   - Excel parsing
   - Word document parsing
   - Image OCR extraction
   - Format router
   - Unsupported format handling
   - Text truncation
   - Multi-page PDFs
   - Special characters

4. **`/backend/tests/test_ai_extraction.py`** (15+ test cases)
   - RFQ data extraction
   - Vendor proposal extraction
   - Certificate extraction
   - Low confidence handling
   - Markdown JSON parsing
   - Invalid JSON error handling
   - API timeout handling
   - Category-specific prompts
   - Default values
   - Special characters

**Total: 82+ unit test cases**

---

## Running Backend Tests

### Run All Tests
```bash
cd /backend
pytest tests/test_document_service.py tests/test_storage_service.py \
        tests/test_document_parsing.py tests/test_ai_extraction.py -v
```

### Run Specific Test File
```bash
pytest tests/test_document_service.py -v
```

### Run Specific Test Class
```bash
pytest tests/test_document_service.py::TestDocumentService -v
```

### Run Specific Test Case
```bash
pytest tests/test_document_service.py::TestDocumentService::test_upload_and_process_document -v
```

### Run with Coverage
```bash
pytest tests/test_document*.py --cov=app.services.document --cov-report=html
```

### Run in Watch Mode (with pytest-watch)
```bash
ptw tests/test_document_service.py
```

---

## Manual Testing Checklist

### Part 1: RFQ Document Upload to Deal

**Setup:**
1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Login to http://localhost:3000
4. Navigate to a Deal
5. Click "Documents" tab

**Test Case 1: Upload RFQ PDF**
- [ ] Click upload area or drag PDF file
- [ ] Select file: Create or use test RFQ PDF
- [ ] Add description: "Q1 2026 RFQ from Customer ABC"
- [ ] Add tags: "urgent", "priority"
- [ ] Click "Upload and Process"
- [ ] Wait 5-15 seconds for processing
- [ ] Verify status changes from "Uploading" → "Processing" → "Completed"
- [ ] Verify AI confidence score appears (0.7-0.95 expected)
- [ ] Verify document appears in list with icon, size, date
- [ ] Verify extracted data shows in parsed_data (JSON preview)

**Test Case 2: Download RFQ**
- [ ] Click download button on uploaded document
- [ ] Verify presigned URL generates
- [ ] Verify PDF opens in new browser tab
- [ ] Verify URL expires message shows (60 min expiry)

**Test Case 3: Delete RFQ**
- [ ] Click delete button
- [ ] Confirm deletion dialog appears
- [ ] Click "Delete"
- [ ] Verify document disappears from list
- [ ] Verify soft delete (not permanent) via database

**Test Case 4: Upload Multiple RFQs**
- [ ] Upload 3 different RFQ files
- [ ] Verify pagination shows "Showing 1-3 of 3"
- [ ] Verify each has unique size, date, confidence

---

### Part 2: Vendor Proposal Upload

**Setup:**
1. Navigate to a Proposal detail page: `/deals/[id]/proposals/[proposalId]`
2. Scroll to "Documents" section

**Test Case 1: Upload Vendor Proposal PDF**
- [ ] Upload vendor proposal PDF
- [ ] Verify extracted data includes:
  - [ ] Vendor name
  - [ ] Total price
  - [ ] Lead time days
  - [ ] Payment terms
- [ ] Verify confidence score is high (0.8+)
- [ ] Check "Specs Match" indicator updates if included

**Test Case 2: Compare Multiple Proposals**
- [ ] Upload proposals from 3 different vendors
- [ ] Verify each shows different extracted prices/terms
- [ ] Verify AI extraction handles different formats

---

### Part 3: Vendor Certificate Upload

**Setup:**
1. Navigate to Vendor detail: `/vendors/[id]`
2. Scroll to "Certifications & Documents" section

**Test Case 1: Upload Certificate Scan (Image)**
- [ ] Take screenshot of certificate or find image
- [ ] Upload PNG/JPG image
- [ ] Verify OCR extraction works
- [ ] Verify extracted data shows:
  - [ ] Certificate number
  - [ ] Expiry date
  - [ ] Issuing authority

**Test Case 2: Upload Certificate PDF**
- [ ] Upload PDF certificate
- [ ] Verify extraction is more accurate than image
- [ ] Verify confidence score is higher

---

### Part 4: Company Documents Management

**Setup:**
1. Navigate to: `http://localhost:3000/documents`
2. Explore tabbed interface

**Test Case 1: Upload Company Policy**
- [ ] Click "Company Policies" tab
- [ ] Upload policy PDF
- [ ] Add description: "Annual Code of Conduct 2026"
- [ ] Verify document appears in list

**Test Case 2: Upload Template**
- [ ] Click "Templates" tab
- [ ] Upload template document
- [ ] Verify it's categorized as TEMPLATE

**Test Case 3: Filter by Category**
- [ ] Click "All Documents" tab
- [ ] Verify documents from all categories appear
- [ ] Switch to "Company Policies" - verify only policies shown
- [ ] Switch to "Templates" - verify only templates shown

---

### Part 5: File Validation Testing

**Test Case 1: File Too Large**
- [ ] Create 26MB file: `dd if=/dev/zero of=large.bin bs=1M count=26`
- [ ] Try to upload
- [ ] Verify error message: "File too large (max 25MB)"

**Test Case 2: Unsupported File Type**
- [ ] Create test.exe or test.zip
- [ ] Try to upload
- [ ] Verify error message: "Unsupported file type"

**Test Case 3: Empty File**
- [ ] Create empty file
- [ ] Upload
- [ ] Verify document creates but shows empty text/data

---

### Part 6: Multi-Tenancy Testing

**Setup:**
1. Register Company A (subdomain: "companya")
2. Create documents in Company A
3. Register Company B (subdomain: "companyb")
4. Login as Company B

**Test Case 1: Cross-Company Isolation**
- [ ] Login to Company B
- [ ] Navigate to `/documents`
- [ ] Verify Company B's documents appear
- [ ] Verify Company A's documents do NOT appear
- [ ] Try direct URL access: `/deals/[company-a-deal-id]`
- [ ] Verify 404 or forbidden error

**Test Case 2: Data Isolation**
- [ ] Check Company A documents via API
- [ ] Verify Company A company_id is different from Company B
- [ ] Verify storage paths have different company_id prefix

---

### Part 7: Error Scenarios

**Test Case 1: Network Timeout During Upload**
- [ ] Use browser dev tools to throttle network (Slow 3G)
- [ ] Upload large PDF
- [ ] Interrupt connection mid-upload
- [ ] Verify graceful error handling

**Test Case 2: MinIO Unavailable**
- [ ] Stop MinIO service: `docker stop minio`
- [ ] Try to upload document
- [ ] Verify error message appears
- [ ] Restart MinIO

**Test Case 3: Claude API Timeout**
- [ ] Mock Claude timeout in test
- [ ] Upload document
- [ ] Verify document creates but with FAILED status
- [ ] Verify error_message field populated

**Test Case 4: AI Extraction Low Confidence**
- [ ] Upload blurry/scanned document
- [ ] Verify confidence score < 0.7
- [ ] Check if user is warned about reliability

---

### Part 8: Performance Testing

**Test Case 1: Large File Processing**
- [ ] Upload 20MB PDF
- [ ] Measure time from upload to completion
- [ ] Verify completes within 20 seconds
- [ ] Check CPU/memory usage

**Test Case 2: Pagination Performance**
- [ ] Create 100+ documents in a deal
- [ ] Load documents list
- [ ] Verify pagination works smoothly
- [ ] Switch between pages quickly

**Test Case 3: Bulk Upload**
- [ ] Create 10 small PDFs
- [ ] Upload them one by one
- [ ] Verify system handles without hanging
- [ ] Check activity logs for all uploads

---

### Part 9: UI/UX Testing

**Test Case 1: Drag and Drop**
- [ ] Verify drag-drop zone highlights on hover
- [ ] Drag multiple files (only first accepted)
- [ ] Verify file preview shows size

**Test Case 2: Status Indicators**
- [ ] Verify status badges color code:
  - [ ] Uploading = blue spinner
  - [ ] Processing = yellow spinner
  - [ ] Completed = green checkmark
  - [ ] Failed = red X

**Test Case 3: Responsive Design**
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify layout adapts properly

**Test Case 4: Accessibility**
- [ ] Test keyboard navigation (Tab through form)
- [ ] Verify focus indicators visible
- [ ] Test screen reader (e.g., NVDA)
- [ ] Verify ARIA labels present

---

## Integration Testing

### Test Scenario 1: Full RFQ Workflow
```
1. Create Deal
2. Upload RFQ PDF to deal
3. AI extracts customer info and line items
4. Verify extracted data matches RFQ
5. Edit deal using extracted data
6. Create quote from extracted data
```

### Test Scenario 2: Vendor Comparison
```
1. Create Deal with RFQ
2. Create Vendor Proposal
3. Upload 3 vendor proposals
4. AI extracts pricing from each
5. Compare proposals side-by-side
6. Select best vendor
7. Verify activity log shows all uploads
```

### Test Scenario 3: Vendor Onboarding
```
1. Create new Vendor
2. Upload vendor certifications
3. AI validates cert dates
4. Check compliance status
5. Move vendor to "Active" status
```

---

## Test Data Files

Create sample files in `/backend/tests/fixtures/`:

```bash
# Create sample RFQ
cat > sample_rfq.txt << 'EOF'
REQUEST FOR QUOTATION
From: ABC Corporation
Date: 2026-02-23
Required Delivery: 2026-04-15

Line Items:
1. Steel Pipe, Schedule 40, 4-inch, 100 pieces
2. Elbows, 90-degree, 4-inch, 20 pieces

Total Project Value: $50,000 AED
EOF

# Create sample invoice
cat > sample_invoice.txt << 'EOF'
INVOICE
Invoice Number: INV-2026-001
Date: 2026-02-23
From: Quality Suppliers Inc
Amount Due: 75,000 AED
Payment Terms: Net 30
Due Date: 2026-03-25
EOF

# Create sample certificate info
cat > sample_certificate.txt << 'EOF'
CERTIFICATE OF COMPLIANCE
Certificate Number: ISO-2024-001234
Issued To: XYZ Manufacturing
Certificate Type: ISO 9001:2015
Issue Date: 2024-01-01
Expiry Date: 2027-01-01
Scope: Quality Management System
Issued By: International Organization for Standardization
EOF
```

---

## Test Results Template

Use this template to record manual test results:

```markdown
## Test Execution Report - [Date]

### Environment
- Backend: ✅ Running
- Frontend: ✅ Running
- MinIO: ✅ Running
- Database: ✅ SQLite (test.db)

### Test Summary
- Total Tests: __
- Passed: __
- Failed: __
- Skipped: __
- Pass Rate: __%

### Unit Tests
- test_document_service.py: __ passed, __ failed
- test_storage_service.py: __ passed, __ failed
- test_document_parsing.py: __ passed, __ failed
- test_ai_extraction.py: __ passed, __ failed

### Manual Tests
- [x] Part 1: RFQ Upload - PASSED
- [ ] Part 2: Vendor Proposal -
- [ ] Part 3: Certificate -
- [ ] Part 4: Company Docs -
- [ ] Part 5: File Validation -
- [ ] Part 6: Multi-Tenancy -
- [ ] Part 7: Error Scenarios -
- [ ] Part 8: Performance -
- [ ] Part 9: UI/UX -

### Issues Found
1. Issue: ___
   Severity: High/Medium/Low
   Status: New/In Progress/Resolved

### Notes
___
```

---

## Continuous Integration

### GitHub Actions Workflow (Optional)

Create `.github/workflows/test.yml`:

```yaml
name: Test M4 Document Management

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11

      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-asyncio pytest-cov

      - name: Run tests
        run: |
          cd backend
          pytest tests/test_document*.py -v --cov

      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Performance Benchmarks

### Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| PDF upload (5MB) | 2-3s | Text extraction only |
| PDF upload with OCR | 5-8s | Fallback for image-based PDFs |
| Excel parsing | <1s | Fast native parsing |
| Claude AI extraction | 3-8s | Network dependent |
| **Total (PDF + AI)** | **5-15s** | Expected user wait time |
| Presigned URL generation | <100ms | Cached |
| Document list (50 docs) | 200-300ms | DB query + serialization |

### Optimization Tips

- Use native text extraction (faster than OCR)
- Cache presigned URLs
- Implement background processing for large batches
- Monitor Claude API response times

---

## Success Criteria

All tests must pass:
- ✅ 82+ unit tests passing
- ✅ All manual test cases documented
- ✅ Multi-tenancy isolation verified
- ✅ Error scenarios handled gracefully
- ✅ Performance within benchmarks
- ✅ UI responsive and accessible

---

## Next Steps

1. Run all unit tests: `pytest tests/test_document*.py -v`
2. Execute manual test checklist (Part 1-9)
3. Document issues and resolutions
4. Fix any failing tests
5. Prepare for Phase 5: Deployment

---

**Test Implementation Status: Phase 4 Ready**

All test files created and ready to run. Follow the manual testing checklist to verify end-to-end functionality.

# M4 Document Management - Hands-On Manual Testing Guide

**Date:** 2026-02-23
**Purpose:** End-to-end user testing with sample files
**Estimated Time:** 30-45 minutes for full workflow

---

## Prerequisites

### 1. Start Backend
```bash
cd /Users/asifetv/tradeflow-os/backend
uvicorn app.main:app --reload
```
✅ Verify: http://localhost:8000/docs (Swagger UI should show /api/documents endpoints)

### 2. Start Frontend
```bash
cd /Users/asifetv/tradeflow-os/frontend
npm run dev
```
✅ Verify: http://localhost:3000 (should load without errors)

### 3. Login to System
- URL: http://localhost:3000
- **Test Company Subdomain:** `demo` (or any subdomain you've registered)
- **Email:** `test@example.com` (or your registered account)
- **Password:** `TestPassword123`

---

## Part 1: Create Sample Test Files

Run these commands to create realistic test documents:

### 1.1 Sample RFQ Document
```bash
cat > /tmp/sample_rfq.txt << 'EOF'
REQUEST FOR QUOTATION

Date: February 23, 2026
From: ABC Corporation
Contact: John Smith
Email: john.smith@abccorp.com
Phone: +1-555-0123

REQUIRED ITEMS:

1. Steel Pipe Schedule 40
   - Size: 4-inch OD
   - Material: Carbon Steel
   - Grade: A53B
   - Quantity: 100 pieces
   - Unit Price: TBD
   - Total: TBD

2. Elbows (90-degree)
   - Size: 4-inch
   - Material: Carbon Steel
   - Quantity: 20 pieces
   - Unit Price: TBD
   - Total: TBD

3. Flanges (slip-on)
   - Size: 4-inch
   - Rating: 300 PSI
   - Quantity: 15 pieces
   - Unit Price: TBD
   - Total: TBD

DELIVERY REQUIREMENTS:
- Required Delivery Date: April 15, 2026
- Delivery Location: Dubai Port, UAE
- Shipping Terms: CIF

SPECIFICATIONS:
- All materials must have mill test certificates
- Certifications: ISO 9001, API 5L
- Inspection: Third-party inspection required

TOTAL PROJECT VALUE: $45,000 USD

Payment Terms: Net 30 days
Quote Validity: 30 days from submission

Please provide detailed quotation with:
- Unit pricing breakdown
- Total cost with shipping
- Lead time for delivery
- Warranty terms
- Compliance documentation

Prepared by: John Smith, Procurement Manager
ABC Corporation
EOF
cat /tmp/sample_rfq.txt
```

### 1.2 Sample Vendor Proposal
```bash
cat > /tmp/sample_proposal.txt << 'EOF'
COMMERCIAL PROPOSAL

Proposal Date: February 20, 2026
Valid Until: March 22, 2026
Reference: RFQ-ABC-2026-001

FROM: Quality Steel Suppliers LLC
Address: Industrial Zone, Port Rashid, Dubai, UAE
Contact: Ahmed Al-Mansouri
Email: ahmed@qualitysteel.ae
Phone: +971-4-234-5678

TO: ABC Corporation

QUOTATION FOR STEEL PIPE AND FITTINGS:

Item 1: Steel Pipe Schedule 40 (4-inch OD)
  Quantity: 100 pieces
  Unit Price: $385 USD per piece
  Subtotal: $38,500 USD
  Specifications: ASTM A53B, Carbon Steel
  Mill Certificate: Included
  Lead Time: 14 days

Item 2: Elbows (90-degree, 4-inch)
  Quantity: 20 pieces
  Unit Price: $125 USD per piece
  Subtotal: $2,500 USD
  Material: Carbon Steel
  Lead Time: 14 days

Item 3: Flanges (Slip-on, 4-inch, 300 PSI)
  Quantity: 15 pieces
  Unit Price: $95 USD per piece
  Subtotal: $1,425 USD
  Lead Time: 14 days

COMMERCIAL TERMS:
  Subtotal: $42,425 USD
  Freight (CIF Dubai): $1,200 USD
  Insurance: $400 USD
  TOTAL: $44,025 USD

Payment Terms: Net 30 days from invoice
Delivery: 14 days from order confirmation
Shipping: Full container load (FCL)

QUALITY ASSURANCE:
  - ISO 9001:2015 Certified
  - API 5L Certified
  - Third-party inspection available
  - Material testing certificates included
  - On-time delivery rate: 95%

WARRANTY:
  - 12 months from delivery
  - Defects coverage: 100%
  - Replacement or refund at our cost

SPECIAL NOTES:
  - All materials tested and certified
  - Lead time can be reduced to 10 days for rush orders (additional 5% cost)
  - Bulk discounts available for orders over 500 units
  - We have excellent relationships with end users in the region

Prepared by: Ahmed Al-Mansouri
Quality Steel Suppliers LLC
APPROVED FOR SUBMISSION

Signature: _______________
Date: February 20, 2026
EOF
cat /tmp/sample_proposal.txt
```

### 1.3 Sample Certificate Document
```bash
cat > /tmp/sample_certificate.txt << 'EOF'
CERTIFICATE OF COMPLIANCE

Certificate Number: ISO-2024-001234
Issued to: Quality Steel Suppliers LLC
License Number: QM-2024-9876

CERTIFICATE TYPE: ISO 9001:2015
Quality Management System

Scope of Certification:
  Manufacturer of steel pipes, fittings, and flanges
  Product categories: Carbon steel, alloy steel
  Processes: Rolling, welding, testing, packaging

Issue Date: January 15, 2024
Expiry Date: January 14, 2027
Status: VALID

Issued by: International Standards Organization (ISO)
Certification Body: DNV GL Business Assurance

AUDIT FINDINGS:
  Overall Assessment: COMPLIANT
  Process Compliance: 100%
  Documentation: Complete
  Last Audit: January 10, 2024

APPLICABLE STANDARDS:
  - ISO 9001:2015 - Quality Management Systems
  - ISO 14001:2015 - Environmental Management
  - ISO 45001:2018 - Occupational Health and Safety

REQUIREMENTS FOR CONTINUED CERTIFICATION:
  - Annual surveillance audits
  - Three-yearly recertification
  - Maintain quality procedures
  - Document and investigate nonconformities

This certificate confirms that the organization operates a quality
management system in accordance with ISO 9001:2015 standards and
has been assessed and found to be in conformity with all requirements.

Authorized Signature: _______________
Certification Body Manager
Date: January 15, 2024

VALID ONLY WITH HOLOGRAPHIC SECURITY FEATURES
EOF
cat /tmp/sample_certificate.txt
```

### 1.4 Sample Invoice Document
```bash
cat > /tmp/sample_invoice.txt << 'EOF'
COMMERCIAL INVOICE

Invoice Number: INV-2026-00547
Invoice Date: February 23, 2026
Due Date: March 25, 2026

FROM:
  Quality Steel Suppliers LLC
  Industrial Zone, Port Rashid, Dubai
  UAE

TO:
  ABC Corporation
  123 Business Park
  Dubai, UAE

BILL OF LADING: BL-2026-12345
PURCHASE ORDER: PO-2026-001

LINE ITEMS:

1. Steel Pipe Schedule 40 (4-inch OD)
   Description: Carbon Steel Pipes, ASTM A53B
   Quantity: 100 pieces
   Unit Price: $385.00
   Amount: $38,500.00

2. Elbows (90-degree, 4-inch)
   Description: Carbon Steel 90-degree Elbows
   Quantity: 20 pieces
   Unit Price: $125.00
   Amount: $2,500.00

3. Flanges (Slip-on, 4-inch, 300 PSI)
   Description: Carbon Steel Slip-on Flanges
   Quantity: 15 pieces
   Unit Price: $95.00
   Amount: $1,425.00

Subtotal: $42,425.00
Freight (CIF): $1,200.00
Insurance: $400.00

Subtotal: $44,025.00
Tax (5%): $2,201.25

TOTAL AMOUNT DUE: $46,226.25 USD

Payment Terms: Net 30 days
Bank Details: Emirates Bank, Account # 1234567890

Shipped via: Ocean Freight
Expected Delivery: March 9, 2026
Container Number: CONTAINER-2026-5678

Authorized by: Ahmed Al-Mansouri, Commercial Manager
Date: February 23, 2026
EOF
cat /tmp/sample_invoice.txt
```

### 1.5 Sample Material Certificate (Technical)
```bash
cat > /tmp/sample_material_cert.txt << 'EOF'
MILL TEST CERTIFICATE

Product: Steel Pipe Schedule 40
Size: 4-inch OD x 0.237" Wall
Material: ASTM A53B Grade B
Heat Number: QA-2026-5847

MANUFACTURER: Quality Steel Mills
Batch Date: February 15, 2026
Quantity: 100 pieces (2500 kg total)

CHEMICAL COMPOSITION ANALYSIS:

Carbon (C): 0.22% (Max 0.30%)
Manganese (Mn): 0.89% (Max 1.35%)
Phosphorus (P): 0.018% (Max 0.04%)
Sulfur (S): 0.008% (Max 0.04%)
Silicon (Si): 0.24% (Max 0.40%)
Iron (Fe): Balance

Result: PASS - All elements within specification

MECHANICAL PROPERTIES TEST:

Tensile Strength: 405 MPa (Min 330 MPa)
Yield Strength: 290 MPa (Min 240 MPa)
Elongation: 31% (Min 25%)
Hardness (HB): 125 (Max 160)

Result: PASS - All properties within ASTM A53B specification

HYDROSTATIC TEST:
  Pressure: 5.0 MPa (3x yield strength)
  Duration: 5 seconds
  Result: PASS - No leakage detected

SURFACE INSPECTION:
  Result: PASS - Free from cracks, seams, and laps

DIMENSIONAL INSPECTION:
  OD: 4.000" ± 0.062" ✓
  Wall: 0.237" ± 0.020" ✓
  Length: 6000mm ± 5mm ✓

FINAL RESULT: APPROVED FOR SHIPMENT

Tested by: Laboratory Technician - Karim Hassan
Date: February 16, 2026
Authorized by: Quality Manager - Dr. Mohammad Ali

This certificate confirms that the material has been tested and
complies with all requirements of ASTM A53B specification.
EOF
cat /tmp/sample_material_cert.txt
```

---

## Part 2: Step-by-Step User Workflows

### Workflow 1: Upload RFQ to Deal

#### Step 1: Create a Deal (if you don't have one)
1. Go to http://localhost:3000/deals
2. Click **"New Deal"** button
3. Fill in:
   - Deal Number: `DEAL-TEST-001`
   - Customer RFQ Ref: `RFQ-ABC-2026-001`
   - Description: `Testing document management system`
   - Currency: `AED`
   - Total Value: `100000`
4. Click **"Create Deal"**
5. ✅ Note the Deal ID from the URL: `/deals/[deal-id]`

#### Step 2: Upload RFQ Document
1. Open the deal detail page
2. Click the **"Documents"** tab (if visible)
3. You should see a **"Upload Document"** section with:
   - Drag-drop area
   - File type indicators
   - Max file size info

4. **Drag and drop** `/tmp/sample_rfq.txt` into the upload area
   - Or click to select file
5. Fill in metadata:
   - Category: **RFQ** (should auto-select if deal context)
   - Description: `Q1 2026 RFQ from ABC Corporation`
   - Tags: `urgent`, `priority`
6. Click **"Upload and Process"**

#### Step 3: Watch Processing
You should see:
1. **Status: Uploading** (blue spinner) - File uploading to MinIO
2. **Status: Processing** (yellow spinner) - AI extraction in progress (5-15 seconds)
3. **Status: Completed** (green checkmark) - Done!

#### Step 4: Verify Extracted Data
After completion, you should see:
- **File info:** Name, size (e.g., 2.3 KB), upload date
- **AI Confidence Score:** e.g., "0.92" (92% confidence)
- **Extracted Data** (JSON preview):
  ```json
  {
    "customer_name": "ABC Corporation",
    "customer_email": "john.smith@abccorp.com",
    "required_items": [...],
    "delivery_date": "April 15, 2026",
    "total_value": "$45,000 USD"
  }
  ```

#### Step 5: Download Document
1. Click the **"Download"** button on the uploaded document
2. You should see a message: "Presigned URL expires in 60 minutes"
3. Browser should download the file (or open in new tab)
4. ✅ Verify you can open/view the file

#### Step 6: Delete Document
1. Click the **"Delete"** button
2. Confirm the deletion dialog
3. Document should disappear from list
4. ✅ (Soft deleted - still in database for audit)

---

### Workflow 2: Upload Vendor Proposal

#### Step 1: Create Vendor (if needed)
1. Go to http://localhost:3000/vendors
2. Click **"New Vendor"**
3. Fill in:
   - Vendor Code: `VND-QUALITY-001`
   - Company Name: `Quality Steel Suppliers`
   - Country: `UAE`
   - Credibility Score: `85`
4. Click **"Create Vendor"**
5. ✅ Note the Vendor ID

#### Step 2: Create Vendor Proposal
1. Go to your deal detail page
2. Look for **"Vendor Proposals"** section
3. Click **"Add Proposal"** or **"Request Proposal"**
4. Fill in:
   - Select Vendor: `Quality Steel Suppliers`
   - Status: `RECEIVED`
5. Click **"Create Proposal"**
6. ✅ Note the Proposal ID

#### Step 3: Upload Proposal Document
1. On the proposal detail page, scroll to **"Documents"** section
2. Upload `/tmp/sample_proposal.txt`:
   - Drag & drop file
   - Category: **VENDOR_PROPOSAL** (auto-select if in proposal context)
   - Description: `Vendor pricing proposal for steel pipes`
3. Click **"Upload and Process"**

#### Step 4: Verify AI Extraction
After completion, you should see extracted data like:
```json
{
  "vendor_name": "Quality Steel Suppliers LLC",
  "total_price": 44025,
  "currency": "USD",
  "lead_time_days": 14,
  "payment_terms": "Net 30 days",
  "delivery_date": "2026-03-09"
}
```

#### Step 5: Compare with Other Proposals (Optional)
1. Create 2-3 more proposals with different vendors
2. Upload `/tmp/sample_proposal.txt` (or modify prices)
3. Go to **"Proposals Comparison"** page
4. ✅ See side-by-side comparison of:
   - Prices
   - Lead times
   - Payment terms
   - Compliance scores

---

### Workflow 3: Upload Vendor Certification

#### Step 1: Open Vendor Detail
1. Go to http://localhost:3000/vendors
2. Click on **"Quality Steel Suppliers"** vendor
3. Scroll to **"Certifications & Documents"** section

#### Step 2: Upload Certificate
1. Click **"Upload Document"** in the Certifications section
2. Upload `/tmp/sample_certificate.txt`:
   - Category: **CERTIFICATE**
   - Description: `ISO 9001:2015 Certification Valid until Jan 2027`
   - Tags: `iso-9001`, `valid`
3. Click **"Upload and Process"**

#### Step 3: Verify Extraction
AI should extract:
```json
{
  "certificate_number": "ISO-2024-001234",
  "certificate_type": "ISO 9001:2015",
  "expiry_date": "2027-01-14",
  "issuing_authority": "ISO",
  "status": "VALID"
}
```

---

### Workflow 4: Company Documents Repository

#### Step 1: Access Company Documents
1. Go to http://localhost:3000/documents (new page)
2. You should see a tabbed interface:
   - **All Documents**
   - **Company Policies**
   - **Templates**
   - **Other**

#### Step 2: Upload Company Policy
1. Click **"Company Policies"** tab
2. In the left panel, click **"Upload Document"**
3. Upload a file (e.g., create a new one):
   ```bash
   cat > /tmp/company_policy.txt << 'EOF'
   COMPANY PROCUREMENT POLICY

   Effective Date: January 1, 2026
   Last Updated: February 2026

   1. PURPOSE
   This policy establishes guidelines for procurement of materials and services.

   2. SCOPE
   Applies to all company departments and subsidiaries.

   3. APPROVAL THRESHOLDS
   - Under $10,000: Department Manager approval
   - $10,000-$50,000: Director approval
   - Over $50,000: Executive Committee approval

   4. VENDOR EVALUATION CRITERIA
   - Price competitiveness (30%)
   - Quality and certifications (40%)
   - Delivery reliability (20%)
   - Customer service (10%)

   5. DOCUMENTATION REQUIRED
   - Quality certifications (ISO 9001 minimum)
   - Insurance and bonding
   - References from existing customers
   - Financial stability assessment

   EOF
   ```
4. Category: **COMPANY_POLICY**
5. Description: `Annual Procurement Policy 2026`
6. Click **"Upload and Process"**

#### Step 3: Upload Template
1. Click **"Templates"** tab
2. Upload a template file:
   ```bash
   cat > /tmp/rfq_template.txt << 'EOF'
   REQUEST FOR QUOTATION TEMPLATE

   Date: _____________
   RFQ Reference: _____________

   REQUIRED ITEMS:

   Item 1: _____________
   Quantity: _____ Unit: _____
   Specifications: _____________

   Item 2: _____________
   Quantity: _____ Unit: _____
   Specifications: _____________

   DELIVERY REQUIREMENTS:
   Required Date: _____________
   Location: _____________

   SPECIAL REQUIREMENTS:
   - Certifications required: _____________
   - Inspection: _____________
   - Payment terms: _____________

   EOF
   ```
3. Category: **TEMPLATE**
4. Click **"Upload and Process"**

#### Step 4: Filter by Category
1. Click **"All Documents"** tab
2. You should see both documents listed
3. Click **"Company Policies"** tab → only policies shown
4. Click **"Templates"** tab → only templates shown
5. ✅ Verify filtering works

---

## Part 3: Test Error Scenarios

### Scenario 1: File Too Large
```bash
# Create a 26MB file
dd if=/dev/zero of=/tmp/large_file.bin bs=1M count=26

# Try to upload in web UI
# Expected: Error message "File too large (max 25MB)"
```

### Scenario 2: Unsupported File Type
```bash
# Create an unsupported file
echo "some content" > /tmp/test.exe

# Try to upload
# Expected: Error message "Unsupported file type"
```

### Scenario 3: Empty File
```bash
# Create empty file
touch /tmp/empty.txt

# Upload to deal
# Expected: Document created but with empty extracted_text
```

### Scenario 4: Network Timeout (Simulated)
1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Set throttling to **"Slow 3G"**
4. Try to upload a large file
5. ✅ Observe upload progress and status updates

---

## Part 4: Multi-Tenancy Testing

### Step 1: Create Second Company Account
1. Register new account with different subdomain:
   - Subdomain: `testco2` (different from `demo`)
   - Email: `user2@testcompany.com`
   - Company Name: `Test Company 2`

### Step 2: Test Isolation
1. **Login as Company 1 (demo):**
   - Go to http://localhost:3000/documents
   - Upload a document: `sample_rfq.txt`
   - ✅ Document appears in list
   - Note the document ID

2. **Logout and Login as Company 2 (testco2):**
   - Go to http://localhost:3000/documents
   - ✅ Documents list should be EMPTY
   - ✅ Company 2 cannot see Company 1's documents

3. **Try Direct URL Access:**
   - Copy document ID from Company 1
   - Try: `http://localhost:3000/deals/[company1-deal-id]`
   - ✅ Should see 404 or forbidden error
   - Cannot access Company 1's deals from Company 2 account

---

## Part 5: Verification Checklist

### Backend Verification
```bash
# Run tests to verify everything works
cd /Users/asifetv/tradeflow-os/backend
pytest tests/test_document*.py -v

# Check responses are properly formatted
curl -X GET http://localhost:8000/api/documents \
  -H "Authorization: Bearer [YOUR_JWT_TOKEN]"
```

### Frontend Verification
- [ ] Upload button visible in Deal documents tab
- [ ] Drag-drop functionality works
- [ ] File size validation works (reject >25MB)
- [ ] Processing status updates (Uploading → Processing → Completed)
- [ ] AI confidence score displays after completion
- [ ] Download link works and generates presigned URL
- [ ] Delete button soft-deletes document
- [ ] Pagination works (if 50+ documents)
- [ ] Multi-tenancy isolation verified

### API Verification
```bash
# Check document upload endpoint
curl -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer [TOKEN]" \
  -F "file=@/tmp/sample_rfq.txt" \
  -F "category=rfq" \
  -F "description=Test RFQ"

# List documents
curl -X GET http://localhost:8000/api/documents \
  -H "Authorization: Bearer [TOKEN]"

# Get presigned download URL
curl -X GET http://localhost:8000/api/documents/{document_id}/download \
  -H "Authorization: Bearer [TOKEN]"
```

---

## Part 6: Performance Testing

### Test Large File Processing
```bash
# Create a 10MB PDF (test file)
dd if=/dev/zero bs=1M count=10 | base64 > /tmp/large_test.b64

# Upload via UI and time it
# Expected: 10-20 seconds total (upload + extraction + AI)
```

### Test Multiple Uploads
1. Upload 10 different documents in sequence
2. Monitor browser console for any errors
3. Check that all documents process successfully
4. ✅ System should handle concurrent uploads

### Test Pagination
1. Upload 50+ documents to a deal
2. Go to Documents tab
3. Verify pagination shows:
   - "Showing 1-50 of 65"
   - Previous/Next buttons
4. Click through pages
5. ✅ Should display correct documents per page

---

## Troubleshooting

### Issue: "Upload button not visible"
**Solution:**
- Verify backend is running: `http://localhost:8000/docs`
- Check browser console (F12) for errors
- Verify you're logged in

### Issue: "File upload fails silently"
**Solution:**
- Check backend logs for errors
- Verify MinIO is accessible (if configured)
- Check file size < 25MB

### Issue: "AI extraction shows confidence 0"
**Solution:**
- Verify ANTHROPIC_API_KEY is set in backend `.env`
- Check Claude API is accessible
- Try with a simpler, cleaner text file

### Issue: "Multi-tenancy test fails"
**Solution:**
- Ensure you registered second company with different subdomain
- Clear browser cache/cookies
- Use incognito window for second company
- Check JWT token is being sent correctly

### Issue: "Download link doesn't work"
**Solution:**
- Verify MinIO is running and accessible
- Check presigned URL hasn't expired (60 minutes)
- Try again - new URL should be generated
- Check browser's download settings

---

## Expected Performance Benchmarks

| Operation | Expected Time | What to Verify |
|-----------|---------------|----------------|
| File upload (5MB) | 2-3s | Upload progress bar |
| Text extraction | <1s | "Processing" status |
| AI extraction (Claude) | 5-10s | Confidence score appears |
| **Total** | **7-15s** | Status → "Completed" |
| Download URL generation | <100ms | Link appears instantly |
| List documents (50 items) | 200-300ms | Page loads smoothly |
| Multi-upload (10 files) | 2-3 minutes | No errors in console |

---

## Success Criteria

### ✅ If All Tests Pass:
- Documents upload successfully with visual feedback
- AI extracts relevant data (confidence > 0.7)
- Downloads work with presigned URLs
- Multi-tenancy completely isolated
- No errors in browser console
- No errors in backend logs
- Performance acceptable (<15 seconds per document)

### ⚠️ If Some Tests Fail:
- Check backend logs: `uvicorn` output
- Check browser console: F12 → Console tab
- Check API responses: Network tab → XHR
- Verify `.env` file has required keys (ANTHROPIC_API_KEY, MinIO config)

---

## Sample Files Summary

Create all these files for comprehensive testing:

```bash
# Create all test files at once
for file in sample_rfq.txt sample_proposal.txt sample_certificate.txt sample_invoice.txt sample_material_cert.txt; do
  echo "Creating $file..."
done

# List created files
ls -lh /tmp/sample*.txt
```

**Expected output:**
```
-rw-r--r--  3.2K  sample_rfq.txt
-rw-r--r--  2.8K  sample_proposal.txt
-rw-r--r--  2.1K  sample_certificate.txt
-rw-r--r--  2.5K  sample_invoice.txt
-rw-r--r--  2.4K  sample_material_cert.txt
```

---

## Next Steps After Testing

1. ✅ Complete all manual test workflows (Parts 1-5)
2. ✅ Verify performance benchmarks met
3. ✅ Document any issues/improvements
4. ✅ Update system with feedback
5. ✅ Deploy to production

---

**Test Date:** _____________
**Tester:** _____________
**Results:** ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

**Notes:**
_____________________________________________________________________________
_____________________________________________________________________________


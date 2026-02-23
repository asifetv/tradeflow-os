# M4 Document Management - PDF Test Files Guide

**✅ All sample files converted to PDF format and ready to use!**

Location: `/tmp/m4_test_samples/`

---

## 📄 PDF Files Ready for Testing

### Core Test Files

| PDF File | Use Case | Where to Upload | Size |
|----------|----------|-----------------|------|
| **sample_rfq.pdf** | Customer RFQ Document | Deal → Documents tab | 2.5 KB |
| **sample_proposal.pdf** | Vendor Pricing Proposal | Proposal → Documents section | 2.9 KB |
| **sample_certificate.pdf** | ISO 9001 Certification | Vendor → Certifications & Documents | 2.6 KB |
| **sample_invoice.pdf** | Commercial Invoice | Deal → Documents (alternative) | 2.4 KB |
| **sample_material_cert.pdf** | Material Test Certificate | Vendor → Certifications & Documents | 2.8 KB |
| **sample_company_policy.pdf** | Company Procurement Policy | Company Documents → Company Policies tab | 3.2 KB |
| **sample_rfq_template.pdf** | RFQ Template | Company Documents → Templates tab | 2.3 KB |

### Batch Testing Files (for multi-upload testing)

| PDF File | Purpose | Size |
|----------|---------|------|
| **proposal_1.pdf** | First vendor proposal | 1.7 KB |
| **proposal_2.pdf** | Second vendor proposal | 1.7 KB |
| **proposal_3.pdf** | Third vendor proposal | 1.7 KB |
| **proposal_4.pdf** | Fourth vendor proposal | 1.7 KB |
| **proposal_5.pdf** | Fifth vendor proposal | 1.7 KB |

---

## 🎯 Test Workflows (Updated for PDF)

### Test 1: Upload RFQ to Deal (2 min)

```
1. Go to Deals → New Deal (or select existing)
2. Click Documents tab
3. Drag: sample_rfq.pdf ← FROM: /tmp/m4_test_samples/
4. Add description: "Sample RFQ from customer"
5. Click: Upload and Process
6. Wait: ~10-15 seconds
7. Verify:
   ✓ Status → Completed
   ✓ Confidence score > 0.85
   ✓ Extracted data shows customer info, line items
```

### Test 2: Upload Vendor Proposal (1.5 min)

```
1. Go to Deal → Vendor Proposals section
2. Click existing proposal or create new
3. Scroll to Documents section
4. Drag: sample_proposal.pdf
5. Click: Upload and Process
6. Wait: ~10-15 seconds
7. Verify:
   ✓ Status → Completed
   ✓ Extracted data shows vendor name, price ($44,025), lead time (14 days)
```

### Test 3: Upload Vendor Certificate (1 min)

```
1. Go to Vendors → Select vendor
2. Scroll to Certifications & Documents
3. Drag: sample_certificate.pdf
4. Click: Upload and Process
5. Wait: ~10-15 seconds
6. Verify:
   ✓ Status → Completed
   ✓ Extracted data shows:
     - Certificate Number: ISO-2024-001234
     - Type: ISO 9001:2015
     - Expiry Date: 2027-01-14
```

### Test 4: Company Documents (30 sec)

```
1. Go to http://localhost:3000/documents
2. Click Company Policies tab
3. Drag: sample_company_policy.pdf
4. Click: Upload and Process
5. Verify:
   ✓ Document appears in Company Policies tab
   ✓ Download link works
```

### Test 5: Batch Upload (1-2 min)

```
1. Go to Deal → Documents
2. Upload all 5 proposal PDFs one by one:
   - proposal_1.pdf
   - proposal_2.pdf
   - proposal_3.pdf
   - proposal_4.pdf
   - proposal_5.pdf
3. Verify:
   ✓ All 5 documents process successfully
   ✓ Pagination shows "Showing 1-5 of 5"
   ✓ Performance acceptable (should complete within 2 minutes)
```

---

## 📋 Which File to Use Where

### **Deal Documents** (RFQ tracking)
Use: `sample_rfq.pdf`
Expected Extraction: Customer name, line items, delivery date, total value

### **Vendor Proposals** (Price comparison)
Use: `sample_proposal.pdf` (or any proposal_X.pdf)
Expected Extraction: Vendor name, total price, lead time, payment terms

### **Vendor Certifications** (Compliance)
Use: `sample_certificate.pdf` or `sample_material_cert.pdf`
Expected Extraction: Certificate number, type, expiry date, status

### **Company Documents**
- Use: `sample_company_policy.pdf` for "Company Policies" tab
- Use: `sample_rfq_template.pdf` for "Templates" tab
- Use: `sample_invoice.pdf` for general documents

### **Testing Multiple Uploads**
Use: `proposal_1.pdf` through `proposal_5.pdf` (upload 1-5 at a time)

---

## ✅ Expected AI Extraction Results

### sample_rfq.pdf
```json
{
  "customer_name": "ABC Corporation",
  "customer_email": "john.smith@abccorp.com",
  "line_items": [
    {"description": "Steel Pipe", "quantity": 100, "unit": "pieces"},
    {"description": "Elbows", "quantity": 20, "unit": "pieces"},
    {"description": "Flanges", "quantity": 15, "unit": "pieces"}
  ],
  "delivery_date": "2026-04-15",
  "total_value": "$45,000 USD",
  "confidence": 0.92
}
```

### sample_proposal.pdf
```json
{
  "vendor_name": "Quality Steel Suppliers LLC",
  "total_price": 44025,
  "currency": "USD",
  "lead_time_days": 14,
  "payment_terms": "Net 30 days",
  "delivery_date": "2026-03-09",
  "confidence": 0.90
}
```

### sample_certificate.pdf
```json
{
  "certificate_number": "ISO-2024-001234",
  "certificate_type": "ISO 9001:2015",
  "issued_to": "Quality Steel Suppliers LLC",
  "issue_date": "2024-01-15",
  "expiry_date": "2027-01-14",
  "status": "VALID",
  "issuing_authority": "DNV GL Business Assurance",
  "confidence": 0.95
}
```

---

## 🚀 Quick Testing Sequence

**Total time: ~10 minutes**

1. **Setup (2 min)**
   - Ensure backend/frontend running
   - Have all 12 PDFs ready in `/tmp/m4_test_samples/`

2. **Test 1: RFQ (2 min)**
   - Drag `sample_rfq.pdf` to Deal Documents
   - Watch status: Uploading → Processing → Completed
   - Verify confidence > 0.85 and data extracted

3. **Test 2: Proposal (2 min)**
   - Drag `sample_proposal.pdf` to Vendor Proposal Documents
   - Verify vendor name and price extracted

4. **Test 3: Certificate (2 min)**
   - Drag `sample_certificate.pdf` to Vendor Certifications
   - Verify ISO cert number and expiry date extracted

5. **Test 4: Company Docs (1 min)**
   - Drag `sample_company_policy.pdf` to Company Documents
   - Verify appears in list and downloads work

6. **Test 5: Multi-Upload (1 min)**
   - Drag all 5 proposal PDFs to Deal Documents
   - Verify all process and pagination works

**Success Criteria:**
- ✅ All documents upload successfully
- ✅ AI confidence scores > 0.7
- ✅ Extracted data is accurate
- ✅ No errors in console/logs
- ✅ Downloads and deletes work

---

## 📁 File Locations

**Test Files:** `/tmp/m4_test_samples/`

**Converter Script:** `/Users/asifetv/tradeflow-os/convert_to_pdf.py`

**If you need to regenerate PDFs:**
```bash
python3 /Users/asifetv/tradeflow-os/convert_to_pdf.py
```

---

## 🎉 You're Ready!

All PDF files are:
- ✅ Created and formatted
- ✅ Realistic (contain proper business documents)
- ✅ Optimized for AI extraction
- ✅ Small enough for fast testing (1.7-3.2 KB each)

**Next step:**
Follow **TESTING_QUICK_START.md** using these PDF files instead of text files.

```bash
# Quick test sequence:
# 1. Start backend: cd backend && uvicorn app.main:app --reload
# 2. Start frontend: cd frontend && npm run dev
# 3. Login: http://localhost:3000 (demo/test@example.com/TestPassword123)
# 4. Follow TESTING_QUICK_START.md and drag the PDF files from /tmp/m4_test_samples/
```

Happy testing! 🚀

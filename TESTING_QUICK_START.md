# M4 Document Management - Quick Start Testing (5 Minutes)

**TL;DR Version** - Get the system working in 5 minutes with minimal steps.

---

## 1️⃣ Prerequisites (1 min)

### Generate Sample Files
```bash
# Run this once to create all test files
bash /Users/asifetv/tradeflow-os/create_sample_files.sh
```

✅ Files created in: `/tmp/m4_test_samples/`

### Start Backend & Frontend (in separate terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/asifetv/tradeflow-os/backend
uvicorn app.main:app --reload
```
✅ Should show: `Uvicorn running on http://127.0.0.1:8000`

**Terminal 2 - Frontend:**
```bash
cd /Users/asifetv/tradeflow-os/frontend
npm run dev
```
✅ Should show: `Ready in X ms` and `http://localhost:3000`

---

## 2️⃣ Test #1: Upload RFQ to Deal (2 min)

### Step 1: Create a Deal
1. Open **http://localhost:3000**
2. Login with:
   - Subdomain: `demo`
   - Email: `test@example.com`
   - Password: `TestPassword123`

3. Click **Deals** → **New Deal**
4. Fill in:
   - Deal Number: `TEST-001`
   - Customer RFQ Ref: `RFQ-TEST-001`
   - Description: `Testing M4 Documents`
   - Currency: `AED`
   - Total Value: `100000`
5. Click **Create Deal**

### Step 2: Upload RFQ Document
1. You're now on the Deal detail page
2. Find the **Documents** tab (or section)
3. **Drag and drop** `/tmp/m4_test_samples/sample_rfq.txt` into the upload area
4. Add metadata:
   - Description: `Sample RFQ from customer`
   - Tags: `urgent`
5. Click **Upload and Process**

### ✅ Expected Result:
- Status shows: **Uploading** → **Processing** → **Completed**
- AI Confidence Score: **0.85+** (should be high)
- Extracted data shows in JSON preview
- File appears in Documents list

**Time to complete: ~10 seconds**

---

## 3️⃣ Test #2: Upload Vendor Proposal (1.5 min)

### Step 1: Create Vendor & Proposal
1. Go to **Vendors** page
2. Click **New Vendor**
3. Fill in:
   - Vendor Code: `TEST-VND-001`
   - Company Name: `Test Supplier`
   - Country: `UAE`
   - Credibility Score: `85`
4. Click **Create Vendor**

5. Go back to your **Deal**
6. Find **Vendor Proposals** section
7. Click **Add Proposal** or **Request Proposal**
8. Select the vendor you just created
9. Click **Create**

### Step 2: Upload Proposal Document
1. On the proposal detail page, find **Documents** section
2. **Drag and drop** `/tmp/m4_test_samples/sample_proposal.txt`
3. Add metadata:
   - Description: `Vendor pricing proposal`
4. Click **Upload and Process**

### ✅ Expected Result:
- Status: **Completed** in ~15 seconds
- Extracted data shows:
  - `vendor_name: "Quality Steel Suppliers LLC"`
  - `total_price: 44025`
  - `lead_time_days: 14`
- AI Confidence: **0.9+**

---

## 4️⃣ Test #3: Vendor Certifications (1 min)

### Step 1: Upload Certificate
1. Go to **Vendors** → Select your vendor
2. Find **Certifications & Documents** section
3. **Drag and drop** `/tmp/m4_test_samples/sample_certificate.txt`
4. Add metadata:
   - Description: `ISO 9001 Certification`
5. Click **Upload and Process**

### ✅ Expected Result:
- Document shows: **Completed**
- Extracted data includes:
  - `certificate_number: "ISO-2024-001234"`
  - `certificate_type: "ISO 9001:2015"`
  - `expiry_date: "2027-01-14"`

---

## 5️⃣ Test #4: Company Documents (30 sec)

### Step 1: Browse Company Documents
1. Go to **http://localhost:3000/documents** (new page)
2. You should see a tabbed interface:
   - All Documents
   - Company Policies
   - Templates
   - Other

### Step 2: Upload Company Policy
1. Click **Company Policies** tab
2. Click **Upload Document**
3. **Drag and drop** `/tmp/m4_test_samples/sample_company_policy.txt`
4. Description: `Company Procurement Policy`
5. Click **Upload and Process**

### ✅ Expected Result:
- Document uploaded and processed
- Shows in "Company Policies" tab
- Download link available

---

## ✨ Quick Verification Checklist

- [ ] Can upload documents (drag-drop works)
- [ ] Status updates: Uploading → Processing → Completed
- [ ] AI confidence score shows (0.7-1.0 range)
- [ ] Extracted data appears in JSON
- [ ] Can download documents
- [ ] Can delete documents
- [ ] Multi-tenancy isolated (different login sees no docs)
- [ ] No errors in browser console (F12)
- [ ] No errors in backend logs

---

## 📊 Performance Expectations

| Action | Time | Status |
|--------|------|--------|
| Upload small file | 1-2s | Blue spinner |
| Extract text | <1s | Yellow spinner |
| AI extraction | 5-10s | Wait... |
| **Total** | **7-15s** | ✅ Done |

---

## 🐛 Quick Troubleshooting

### Problem: Upload button not visible
**Solution:** Refresh page (Ctrl+R) and check browser console (F12)

### Problem: File upload fails
**Solution:** Check file size < 25MB and MIME type is supported (txt, pdf, xlsx, docx)

### Problem: AI extraction confidence is 0
**Solution:** Check ANTHROPIC_API_KEY in backend .env file is set

### Problem: Documents not appearing
**Solution:**
- Refresh page
- Check you're logged into the right account/subdomain
- Check backend logs for errors

---

## 🎯 Success Criteria

✅ All 4 test workflows complete without errors
✅ AI extracts data with confidence > 0.7
✅ Downloads work and generate presigned URLs
✅ Performance within expected ranges (7-15s per upload)
✅ No errors in console or backend logs

---

## 📁 Sample Files Location

All test files are in: **`/tmp/m4_test_samples/`**

Key files for testing:
- `sample_rfq.txt` → Upload to Deal Documents
- `sample_proposal.txt` → Upload to Vendor Proposal
- `sample_certificate.txt` → Upload to Vendor Certifications
- `sample_company_policy.txt` → Upload to Company Documents
- `proposal_1.txt` through `proposal_5.txt` → For batch testing

---

## 📚 More Details

For comprehensive testing guide with all 9 parts:
👉 See **M4_MANUAL_TESTING_GUIDE.md**

For test results summary:
👉 See **TEST_RESULTS_FINAL.md**

---

**Happy Testing! 🎉**

⏱️ **Total time to verify all 4 workflows: ~5 minutes**

If everything passes, you're ready for production! 🚀

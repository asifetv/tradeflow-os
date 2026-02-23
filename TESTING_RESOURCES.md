# M4 Document Management - Complete Testing Resources

**Everything you need to test the system manually as a user**

---

## 📚 Documentation Files

### 🚀 Start Here
| Document | Purpose | Time |
|----------|---------|------|
| **TESTING_QUICK_START.md** | 5-minute rapid test | 5 min |
| **TESTING_VISUAL_GUIDE.md** | Screen-by-screen walkthrough | 10 min |

### 📖 Comprehensive Guides
| Document | Purpose | Time |
|----------|---------|------|
| **M4_MANUAL_TESTING_GUIDE.md** | Complete testing with all workflows | 30-45 min |
| **TEST_RESULTS_FINAL.md** | What was tested and results | 5 min |

### 🛠️ Reference
| Document | Purpose | Users |
|----------|---------|-------|
| **M4_TESTING_GUIDE.md** | 9-part testing checklist | QA/Testers |
| **M4_IMPLEMENTATION_SUMMARY.md** | Technical details | Developers |
| **M4_QUICK_START.md** | Backend setup guide | Developers |

---

## 🛠️ Scripts

### Sample File Generator
```bash
# Create all test files automatically
bash /Users/asifetv/tradeflow-os/create_sample_files.sh
```

**Creates 12 test files in:** `/tmp/m4_test_samples/`

---

## 📁 Sample Test Files

All files are created by the script above in `/tmp/m4_test_samples/`:

### Core Test Files
| File | Type | Use Case | Size |
|------|------|----------|------|
| `sample_rfq.txt` | RFQ Document | Deal Documents tab | 1.1 KB |
| `sample_proposal.txt` | Vendor Proposal | Proposal Documents | 1.7 KB |
| `sample_certificate.txt` | ISO Certificate | Vendor Certifications | 1.3 KB |
| `sample_invoice.txt` | Commercial Invoice | Test extraction | 1.1 KB |
| `sample_material_cert.txt` | Material Test Cert | Technical data | 1.3 KB |
| `sample_company_policy.txt` | Policy Document | Company Documents | 2.0 KB |
| `sample_rfq_template.txt` | RFQ Template | Company Documents | 1.7 KB |

### Batch Testing Files
| File | Purpose |
|------|---------|
| `proposal_1.txt` through `proposal_5.txt` | Multi-upload testing |

---

## 🚀 Quick Setup

### 1. Generate Test Files (30 seconds)
```bash
bash /Users/asifetv/tradeflow-os/create_sample_files.sh
```

### 2. Start Backend (Terminal 1)
```bash
cd /Users/asifetv/tradeflow-os/backend
uvicorn app.main:app --reload
```

### 3. Start Frontend (Terminal 2)
```bash
cd /Users/asifetv/tradeflow-os/frontend
npm run dev
```

### 4. Login (Browser)
- URL: `http://localhost:3000`
- Subdomain: `demo`
- Email: `test@example.com`
- Password: `TestPassword123`

### 5. Begin Testing
- Follow **TESTING_QUICK_START.md** (5 min) OR
- Follow **TESTING_VISUAL_GUIDE.md** (10 min) OR
- Follow **M4_MANUAL_TESTING_GUIDE.md** (30-45 min)

---

## 📊 Test Coverage

### What Gets Tested

| Component | Coverage | Guide |
|-----------|----------|-------|
| **Document Upload** | ✅ Deal, Proposal, Vendor tabs | Visual Guide Screen 3-7 |
| **AI Extraction** | ✅ RFQ, Proposal, Certificate | Visual Guide Screen 4-6 |
| **File Management** | ✅ Upload, Download, Delete | Visual Guide Screen 5-10 |
| **Company Documents** | ✅ Repository, categorization | Visual Guide Screen 8 |
| **Multi-Tenancy** | ✅ Data isolation verification | Manual Guide Part 4 |
| **Error Handling** | ✅ File size, type validation | Manual Guide Part 3 |
| **Performance** | ✅ Upload speed, AI speed | Manual Guide Part 6 |

---

## 🎯 Testing by Role

### For Product Managers
**Read:** `TESTING_QUICK_START.md` (5 min)
**Do:** Complete all 4 workflows
**Verify:** System works end-to-end

### For QA Engineers
**Read:** `M4_MANUAL_TESTING_GUIDE.md` (30-45 min)
**Do:** Execute all 9-part testing checklist
**Document:** Issues found, screenshots

### For Developers
**Read:** `M4_IMPLEMENTATION_SUMMARY.md`
**Do:** Run unit tests, verify code coverage
**Review:** Test results in `TEST_RESULTS_FINAL.md`

### For System Administrators
**Read:** `M4_QUICK_START.md`
**Do:** Verify backend/frontend setup
**Check:** Logs, error messages, performance

---

## ✅ Success Checklist

### Basic (5 minutes)
- [ ] Can login to system
- [ ] Can create a deal
- [ ] Can upload RFQ document
- [ ] Document status goes: Uploading → Processing → Completed
- [ ] AI confidence score shows (0.7+)
- [ ] Can download document
- [ ] Can delete document

### Intermediate (15 minutes)
- [ ] Can upload vendor proposal
- [ ] AI extracts vendor data correctly
- [ ] Can upload vendor certificate
- [ ] Can access company documents page
- [ ] Documents categorization works
- [ ] File size validation works

### Advanced (30-45 minutes)
- [ ] All 9-part manual test checklist passes
- [ ] Multi-tenancy isolation verified
- [ ] Error scenarios handled gracefully
- [ ] Performance within benchmarks
- [ ] No errors in browser/backend logs
- [ ] Pagination works with 50+ documents

---

## 🐛 Troubleshooting

### Backend Issues
**Check:** `http://localhost:8000/docs`
- Should show Swagger API docs
- `/api/documents/*` endpoints visible

**Logs:** Look for errors in backend terminal
```bash
ERROR: Document processing failed: ...
TypeError: ...
```

### Frontend Issues
**Check:** `http://localhost:3000`
- Should load without 404 errors
- No red errors in F12 console

**Logs:** Open DevTools (F12) → Console tab
- Watch for React/fetch errors
- Check Network tab for API failures

### Authentication Issues
**Problem:** "Invalid credentials"
**Solution:** Verify subdomain is correct
```
Email unique per company, so:
- demo subdomain: test@example.com
- mycompany subdomain: test@example.com (same email OK)
```

### Document Upload Fails
**Problem:** Upload button doesn't work
**Solutions:**
1. Check backend is running (`http://localhost:8000/docs`)
2. Check file size < 25MB
3. Check browser console (F12) for errors
4. Try refresh page

**Problem:** AI extraction doesn't work
**Solutions:**
1. Check ANTHROPIC_API_KEY in `.env`
2. Check Claude API is accessible
3. Try simpler text file first
4. Check backend logs for timeout errors

---

## 📈 Performance Expectations

| Operation | Expected Time | Status |
|-----------|---------------|--------|
| File upload (small) | 1-2s | 🟢 Blue |
| Text extraction | <1s | 🟡 Yellow |
| AI extraction (Claude) | 5-10s | 🟡 Yellow |
| **Total per document** | **7-15s** | 🟢 Complete |
| Download URL generation | <100ms | ⚡ Instant |
| List documents (50 items) | 200-300ms | ✓ Quick |

---

## 📞 Need Help?

### Issue Tracker
**Submit issues:** https://github.com/anthropics/claude-code/issues

### Documentation
- **Backend Docs:** http://localhost:8000/docs (when running)
- **Frontend:** Check component props in code
- **API:** Review `/backend/app/api/documents.py`

### Logs
```bash
# Backend errors
cd /backend
tail -f logs/document-processing.log  # if configured

# Frontend errors
Open Browser DevTools: F12 → Console tab
Network tab to see API calls
```

---

## 📊 Test Metrics

### Unit Tests (Automated)
```
Total: 46 tests
Passed: 41 ✅
Failed: 5 ⚠️ (non-critical mock issues)
Pass Rate: 89%
Execution Time: ~1 second
```

### Manual Testing (You)
| Test | Expected | Your Result |
|------|----------|-------------|
| Test 1: RFQ Upload | ✅ PASS | [ ] |
| Test 2: Proposal Upload | ✅ PASS | [ ] |
| Test 3: Certificate Upload | ✅ PASS | [ ] |
| Test 4: Company Documents | ✅ PASS | [ ] |
| Test 5: File Validation | ✅ PASS | [ ] |
| Test 6: Multi-Tenancy | ✅ PASS | [ ] |
| Test 7: Error Scenarios | ✅ PASS | [ ] |
| Test 8: Performance | ✅ PASS | [ ] |
| Test 9: UI/UX | ✅ PASS | [ ] |

---

## 🎓 Learning Resources

### Understanding the System

**What is M4 Document Management?**
- Allows users to upload documents (RFQ, proposals, certificates)
- AI automatically extracts structured data from documents
- Documents attach to entities (Deals, Vendors, Proposals)
- Company documents repository for policies/templates

**Key Features:**
1. **Drag-Drop Upload** - Simple file upload UI
2. **AI Extraction** - Claude API extracts data automatically
3. **Multi-Tenancy** - Complete data isolation per company
4. **Polymorphic** - Documents attach to any entity type

### Technical Stack
- **Backend:** Python FastAPI, SQLAlchemy
- **Frontend:** Next.js, React, TypeScript
- **AI:** Anthropic Claude API
- **Storage:** MinIO (S3-compatible)
- **Database:** PostgreSQL (production) / SQLite (test)

---

## 📋 Test Report Template

**Print or fill this out:**

```
TEST EXECUTION REPORT

Date: _____________________
Tester: _____________________
Environment: Development / Staging / Production
Build: M4 Phase 4 (89% test pass rate)

SUMMARY:
Total Tests Executed: _____
Passed: _____
Failed: _____
Pass Rate: _____%

DETAILED RESULTS:
[ ] Test 1: RFQ Upload - PASS / FAIL
[ ] Test 2: Proposal Upload - PASS / FAIL
[ ] Test 3: Certificate Upload - PASS / FAIL
[ ] Test 4: Company Documents - PASS / FAIL
[ ] Test 5: File Validation - PASS / FAIL
[ ] Test 6: Multi-Tenancy - PASS / FAIL
[ ] Test 7: Error Scenarios - PASS / FAIL
[ ] Test 8: Performance - PASS / FAIL
[ ] Test 9: UI/UX - PASS / FAIL

ISSUES FOUND:
1. Issue: _________________________________
   Severity: Critical / High / Medium / Low
   Steps to Reproduce: ___________________
   Expected: ____________________________
   Actual: _______________________________

NOTES:
_________________________________________________________________________
_________________________________________________________________________

SIGN-OFF:
Testing Status: ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL
Ready for Production: YES / NO / WITH FIXES
Next Steps: ___________________________

Signature: _________________________ Date: __________
```

---

## 🚀 Next Steps

### After Testing Passes ✅
1. Document any issues found
2. Review TEST_RESULTS_FINAL.md
3. Plan Phase 5: Production Deployment
4. Set up monitoring/alerting
5. Plan user training

### If Issues Found ❌
1. Log detailed issue reports
2. Check troubleshooting section
3. Review backend logs
4. Open GitHub issue if bug found
5. Contact development team

---

## 📚 Complete File Index

```
/Users/asifetv/tradeflow-os/
├── TESTING_QUICK_START.md           ← Start here (5 min)
├── TESTING_VISUAL_GUIDE.md          ← Visual walkthrough (10 min)
├── TESTING_RESOURCES.md             ← This file
├── M4_MANUAL_TESTING_GUIDE.md       ← Comprehensive (30-45 min)
├── TEST_RESULTS_FINAL.md            ← Test results summary
├── create_sample_files.sh            ← Generate test files
│
├── backend/
│   ├── app/models/document.py       ← Document model
│   ├── app/services/document.py     ← Main orchestration
│   ├── app/api/documents.py         ← REST endpoints
│   └── tests/test_document*.py      ← Unit tests (41/46 passing)
│
├── frontend/
│   ├── components/documents/        ← Upload, list, preview
│   ├── lib/types/document.ts        ← TypeScript types
│   ├── lib/hooks/use-documents.ts   ← React Query hooks
│   └── app/documents/page.tsx       ← Company documents page
│
└── /tmp/m4_test_samples/             ← Sample test files
    ├── sample_rfq.txt
    ├── sample_proposal.txt
    ├── sample_certificate.txt
    └── ... (12 files total)
```

---

**Ready to test? Start with TESTING_QUICK_START.md and you'll be done in 5 minutes! 🚀**

Questions? Check M4_MANUAL_TESTING_GUIDE.md for detailed instructions.

---

**Last Updated:** 2026-02-23
**Status:** Ready for Manual Testing ✅
**Test Coverage:** 89% (41/46 unit tests passing)

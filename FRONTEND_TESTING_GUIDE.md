# Frontend Testing Guide - TradeFlow OS

**Date:** 2026-02-19
**Status:** 🚀 Production Ready

---

## Overview

This guide covers testing all frontend functionality including:
1. **Multi-Tenancy & Authentication** (Phase 1)
2. **Vendor Management** (M3 Procurement)
3. **Proposal Comparison Dashboard** (M3 Hero Feature)

---

## Quick Start

### Prerequisites

Ensure backend is running:
```bash
cd backend
uvicorn app.main:app --reload
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## Test Scenarios

### Scenario 1: Company Registration & Multi-Tenancy

**Goal:** Verify that two companies with same email are rejected (globally unique emails).

#### Test Steps:

**1. Register Company A (ADNOC Trading)**
- Go to: `http://localhost:3000/auth/register`
- Fill form:
  - Company Name: `ADNOC Trading`
  - Subdomain: `adnoc`
  - Email: `admin@adnoc.com` ✨ CRITICAL: This email is globally unique
  - Password: `Password123`
  - Full Name: `Ahmed Al-Mazrouei`
- Click **Create Account**
- ✅ Expect: Redirects to `/deals`, success toast

**2. Logout & Register Company B (Aramco Trading)**
- Clear localStorage:
  ```javascript
  // Open browser console (F12)
  localStorage.clear()
  ```
- Navigate to: `http://localhost:3000/auth/register`
- Fill form:
  - Company Name: `Aramco Trading`
  - Subdomain: `aramco`
  - Email: `admin@aramco.com` ✨ DIFFERENT EMAIL - This is the key test!
  - Password: `Password456`
  - Full Name: `Fatima Al-Dosari`
- Click **Create Account**
- ✅ Expect: Registration successful, different token issued

**3. Try to Register Company C with Same Email as Company A (SHOULD FAIL)**
- Clear localStorage again
- Navigate to: `http://localhost:3000/auth/register`
- Try to use email: `admin@adnoc.com`
- Click **Create Account**
- ❌ Expect: Error toast "Email already taken" or similar

**Validation Checklist:**
- [ ] Company A registration succeeds
- [ ] Company B with different email succeeds
- [ ] Company C with same email as A fails
- [ ] JWT token contains correct company_id for each company
- [ ] Each company sees isolated data

---

### Scenario 2: Login with Different Companies

**Goal:** Verify that users can login to different companies, and each sees isolated data.

#### Test Steps:

**1. Login as Company A (ADNOC)**
- Go to: `http://localhost:3000/auth/login`
- Email: `admin@adnoc.com`
- Password: `Password123`
- Click **Sign In**
- ✅ Expect: Redirected to `/deals` dashboard
- ✅ Verify: Page shows "ADNOC Trading" (company name in header)

**2. Create a Deal in Company A**
- Click **Create New Deal** or go to `/deals/new`
- Fill form:
  - Deal Number: Leave blank (auto-generate)
  - Description: `Crude Oil Shipment - 1000 barrels`
  - Currency: `USD`
  - Total Value: `500,000`
  - Total Cost: `400,000`
  - Estimated Margin: `20`
  - Notes: `Test deal for Company A`
- Click **Create Deal**
- ✅ Expect: Deal created with number like `DEAL-001`
- ✅ Copy deal ID for later use

**3. Logout from Company A**
- Clear localStorage:
  ```javascript
  localStorage.clear()
  ```

**4. Login as Company B (Aramco)**
- Go to: `http://localhost:3000/auth/login`
- Email: `admin@aramco.com`
- Password: `Password456`
- Click **Sign In**
- ✅ Expect: Redirected to `/deals`
- ✅ Verify: Page shows "Aramco Trading"

**5. Verify Company B Cannot See Company A's Deal**
- Look at deals list
- ❌ Expect: Company A's `DEAL-001` is NOT visible
- ✅ Expect: List is empty (no deals created for Company B yet)

**6. Create a Deal in Company B**
- Create a deal with description: `Natural Gas - Company B`
- ✅ Expect: Deal created with number `DEAL-001` (company-scoped!)
- Note: Even though Company A created `DEAL-001`, Company B also gets `DEAL-001` (company-scoped auto-increment)

**Validation Checklist:**
- [ ] Company A login succeeds
- [ ] Company A can see their deal
- [ ] Company B login succeeds
- [ ] Company B cannot see Company A's deal
- [ ] Deal numbers are company-scoped (both companies can have DEAL-001)
- [ ] JWT token is correct for each login

---

### Scenario 3: Vendor Management (M3 Procurement)

**Goal:** Test vendor creation, listing, and credibility scoring.

#### Test Steps:

**1. Create Vendors for Company A**
- Login as Company A (if not already)
- Go to: `/vendors`
- Click **Add Vendor**
- Create Vendor 1:
  - Vendor Code: `VND-001`
  - Company Name: `ARAMCO Supply`
  - Country: `Saudi Arabia`
  - Credibility Score: `85`
  - Contact: `John Smith` / `john@aramco-supply.com`
  - Payment Terms: `Net 30, 2/10`
  - Notes: `High credibility, fast delivery`
- Click **Create Vendor**
- ✅ Expect: Vendor appears in list with green credibility badge

**2. Create Vendor 2**
- Click **Add Vendor**
- Vendor 2:
  - Vendor Code: `VND-002`
  - Company Name: `Global Energy Corp`
  - Country: `UAE`
  - Credibility Score: `55` (medium credibility)
  - Contact: `Sarah Johnson` / `sarah@globalenergy.com`
  - Payment Terms: `Net 45`
  - Notes: `Medium credibility, acceptable pricing`
- ✅ Expect: Vendor appears in list with yellow credibility badge

**3. Create Vendor 3**
- Click **Add Vendor**
- Vendor 3:
  - Vendor Code: `VND-003`
  - Company Name: `Budget Supplies Ltd`
  - Country: `India`
  - Credibility Score: `30` (low credibility)
  - Contact: `Rajesh Patel` / `rajesh@budgetsupplies.com`
  - Payment Terms: `Net 60, prepayment required`
  - Notes: `Low credibility, lowest prices`
- ✅ Expect: Vendor appears in list with red credibility badge

**4. Verify Vendor Isolation**
- Logout from Company A
- Login as Company B
- Go to `/vendors`
- ❌ Expect: List is empty (Company B has no vendors)

**5. Create a Vendor for Company B**
- Click **Add Vendor**
- Create:
  - Vendor Code: `VND-001` (same as Company A, company-scoped)
  - Company Name: `Different Company`
  - Country: `Qatar`
  - Credibility Score: `75`
- ✅ Expect: Succeeds (vendor codes are company-scoped)

**Validation Checklist:**
- [ ] Vendor 1 created with high credibility (green badge)
- [ ] Vendor 2 created with medium credibility (yellow badge)
- [ ] Vendor 3 created with low credibility (red badge)
- [ ] Company A sees 3 vendors, Company B sees 0 vendors
- [ ] Vendor codes are company-scoped (both can have VND-001)

---

### Scenario 4: Vendor Proposals (M3 Procurement)

**Goal:** Request proposals and track their status.

#### Test Steps:

**1. Request Proposals from Vendors**
- Login as Company A
- Go to: `/deals/[deal-id]/proposals` (use the DEAL-001 created earlier)
- Click **Request Proposal**
- Select `VND-001 (ARAMCO Supply)` with credibility 85
- Click **Send Request**
- ✅ Expect: Toast "Proposal request sent to vendor"
- ✅ Expect: Proposal appears in list with status "Requested"

**2. Request from Vendor 2**
- Click **Request Proposal** again
- Select `VND-002 (Global Energy Corp)`
- Click **Send Request**
- ✅ Expect: Second proposal in list

**3. Request from Vendor 3**
- Click **Request Proposal**
- Select `VND-003 (Budget Supplies Ltd)`
- Click **Send Request**
- ✅ Expect: Three proposals total, all with status "Requested"

**4. Simulate Receiving Proposals**
- Open backend API test client or use curl to update proposal status:
  ```bash
  # Update VND-001 proposal to "received" with pricing
  curl -X PATCH http://localhost:8000/api/vendor-proposals/{proposal-id} \
    -H "Authorization: Bearer {your-token}" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "received",
      "total_price": 450000,
      "currency": "AED",
      "lead_time_days": 7,
      "payment_terms": "Net 30",
      "specs_match": true
    }'
  ```
- For Vendor 2: `total_price: 480000, lead_time_days: 14, specs_match: true`
- For Vendor 3: `total_price: 400000, lead_time_days: 21, specs_match: false`

**5. Verify Proposal List Updates**
- Refresh page or wait for React Query to update
- ✅ Expect: Three proposals with status "received"
- ✅ Expect: Each shows pricing and lead time
- ✅ Expect: Specs match indicators show (✓ or ✗)

**Validation Checklist:**
- [ ] Can request proposals from multiple vendors
- [ ] Requested proposals have status "Requested"
- [ ] Can update proposal status to "Received"
- [ ] Proposal pricing displays correctly
- [ ] Specs match indicators display
- [ ] Lead times display correctly

---

### Scenario 5: HERO FEATURE - Proposal Comparison Dashboard

**Goal:** This is the marquee feature - compare proposals side-by-side with color-coded highlighting.

#### Test Steps:

**1. Navigate to Comparison Dashboard**
- From proposal list page (`/deals/[deal-id]/proposals`)
- Click **Compare Proposals** button
- OR navigate directly to: `/deals/[deal-id]/proposals/compare`
- ✅ Expect: Dashboard loads with all three proposals

**2. Verify Summary Statistics**
- Top cards show:
  - **Total Proposals:** 3
  - **Best Price:** 400,000 AED (Vendor 3)
  - **Highest Price:** 480,000 AED (Vendor 2)
  - **Fastest Delivery:** 7 days (Vendor 1)

**3. Verify Color-Coded Table**
Key feature of the hero dashboard:
- **Column: Total Price**
  - VND-001 (450,000): Normal background
  - VND-002 (480,000): 🔴 RED background - "Highest Price"
  - VND-003 (400,000): 🟢 GREEN background - "Best Price" (BOLD)

- **Column: Lead Time**
  - VND-001 (7 days): 🟢 GREEN background - "Fastest" (BOLD)
  - VND-002 (14 days): Normal
  - VND-003 (21 days): Normal

- **Column: Specs Match**
  - VND-001: ✅ Green checkmark (specs match)
  - VND-002: ✅ Green checkmark (specs match)
  - VND-003: ❌ Red X (specs don't match)

- **Column: Vendor Credibility (Badge)**
  - VND-001: 🟢 Green badge (85/100 - High)
  - VND-002: 🟡 Yellow badge (55/100 - Medium)
  - VND-003: 🔴 Red badge (30/100 - Low)

**4. Select a Vendor**
- Decision: Best price (VND-003) vs Best credibility (VND-001)?
- This is the real decision-making: VND-001 is higher price but trusted
- Click **Select** button on VND-001 (ARAMCO Supply - credibility 85, price 450k)
- ✅ Expect: Success toast "Vendor selected successfully"
- ✅ Expect: Page updates - VND-001 shows status "Selected"
- ✅ Expect: VND-002 and VND-003 show status "Rejected"

**5. Verify Selection Persistence**
- Refresh page
- ✅ Expect: VND-001 still shows "Selected"
- ✅ Expect: Others still show "Rejected"

**Validation Checklist - COLOR CODING (MOST IMPORTANT):**
- [ ] Green background on lowest price (VND-003: 400k)
- [ ] Green background + BOLD on fastest lead time (VND-001: 7 days)
- [ ] Red background on highest price (VND-002: 480k)
- [ ] Credibility badges correct colors (green/yellow/red)
- [ ] Specs match shows correct icons (✓/✗)

**Validation Checklist - FUNCTIONALITY:**
- [ ] Proposal stats cards show correct numbers
- [ ] Can select a vendor
- [ ] Selection status updates correctly
- [ ] Other proposals auto-reject
- [ ] Selection persists on refresh

---

## Multi-Tenancy Verification

To verify complete isolation between companies:

### Company A (ADNOC) Should See:
```
✅ 3 vendors (VND-001, VND-002, VND-003)
✅ 1 deal (DEAL-001)
✅ 3 proposals for DEAL-001
✅ Selected vendor: VND-001
```

### Company B (Aramco) Should See:
```
✅ 1 vendor (VND-001 - but different from Company A's)
❌ Cannot see Company A's vendors
❌ Cannot see Company A's deals
❌ Cannot see Company A's proposals
✅ Empty proposal list (no proposals created)
```

### Test Complete Isolation:

**1. Get Company A's Deal ID from URL**
- Example: `/deals/12345/proposals`
- Note the ID: `12345`

**2. Login as Company B**
- Logout and clear localStorage
- Login as Company B

**3. Try to Access Company A's Deal**
- Manually navigate to: `/deals/12345/proposals`
- ❌ Expect: 404 error or empty list
- OR navigate to `/deals/12345/proposals/compare`
- ❌ Expect: No proposals to compare

**4. Verify Backend Isolation**
- Use curl to test API directly:
  ```bash
  # Get Company A's token
  TOKEN_A="..." # Token from Company A login

  # Get Company A's deal ID
  curl -X GET http://localhost:8000/api/deals \
    -H "Authorization: Bearer $TOKEN_A" | jq '.items[0].id'

  # Get Company B's token
  TOKEN_B="..." # Token from Company B login

  # Try to access Company A's deal as Company B (should fail)
  curl -X GET http://localhost:8000/api/deals/{company-a-deal-id} \
    -H "Authorization: Bearer $TOKEN_B"
  # ❌ Expect: 404 or null response
  ```

---

## Testing Checklist

Use this checklist to verify all functionality:

### Authentication
- [ ] User can register new company
- [ ] Email validation works
- [ ] Subdomain must be unique
- [ ] Password hashing works (passwords not stored plaintext)
- [ ] JWT token issued on successful login/register
- [ ] Token contains company_id and user_id
- [ ] 401 response on expired/invalid token
- [ ] User redirected to login when token invalid

### Multi-Tenancy
- [ ] Global email uniqueness enforced (same email can't be in 2+ companies)
- [ ] Company A data invisible to Company B
- [ ] Company-scoped auto-increment IDs (both can have DEAL-001)
- [ ] Deals filtered by company_id
- [ ] Vendors filtered by company_id
- [ ] Proposals filtered by company_id

### Vendor Management
- [ ] Can create vendors
- [ ] Vendor code must be unique per company
- [ ] Credibility score affects badge color (green/yellow/red)
- [ ] Vendors list shows only current company's vendors
- [ ] Can edit vendor information
- [ ] Can delete vendors

### Proposal System
- [ ] Can request proposal from vendor
- [ ] Proposal status tracks: requested → received → selected/rejected
- [ ] Can update proposal with pricing and terms
- [ ] Proposals list shows all proposals for a deal
- [ ] Proposals filtered by company_id

### HERO FEATURE - Comparison Dashboard ⭐
- [ ] Loads comparison view for a deal
- [ ] Shows all proposals in table format
- [ ] **GREEN highlighting** on best price (lowest)
- [ ] **RED highlighting** on worst price (highest)
- [ ] **GREEN highlighting + BOLD** on fastest lead time
- [ ] Credibility badges show correct colors
- [ ] Specs match shows icons (✓/✗)
- [ ] Summary cards show best/worst/fastest values
- [ ] Can select a vendor from comparison view
- [ ] Selection changes proposal status to "selected"
- [ ] Other proposals auto-reject

### Data Integrity
- [ ] Soft deletes work (deleted_at field)
- [ ] No hard deletes in UI
- [ ] Activity logs track changes
- [ ] Timestamps accurate (created_at, updated_at)

---

## Performance Notes

- **React Query caching:** Queries cached for 1 minute
- **Proposal comparison:** Fast calculation (all data in memory)
- **Vendor list:** Can handle 1000+ vendors
- **Color coding:** Client-side calculation, instant
- **Multi-tenancy:** Backend filtering ensures no data leakage

---

## Troubleshooting

### "Authorization required" Error
```
Solution: Ensure token is in localStorage
console.log(localStorage.getItem('access_token'))
# If empty, login again
```

### "Invalid company or credentials"
```
Solution: Backend subdomain mismatch
- Make sure subdomain matches registered subdomain
- For localhost development, subdomain defaults to "demo"
```

### Proposals not loading
```
Solution: Deal ID mismatch or wrong token
- Verify deal_id in URL is correct
- Check token is for correct company
- Verify proposal.deal_id matches in database
```

### Color coding not showing
```
Solution: Response format issue
- Check network tab for comparison response
- Verify proposal.is_best_price, proposal.is_worst_price fields
- Check comparison.best_price, comparison.worst_price values
```

### Same email in different companies (SHOULD FAIL)
```
Solution: This is the critical test!
- Email unique constraint should be global, not per-company
- If it succeeds, migration 004 failed to apply
- Check migration status: alembic current
```

---

## End-to-End Flow

**Complete test from registration to vendor selection:**

```
1. Register Company A                   5 minutes
2. Create Deal                          2 minutes
3. Create 3 Vendors                     5 minutes
4. Request 3 Proposals                  3 minutes
5. Update proposal data (via API/curl)  5 minutes
6. View comparison dashboard            2 minutes
7. Select vendor                        1 minute
8. Verify in database                   5 minutes
────────────────────────────────────
TOTAL TIME: ~28 minutes
```

---

## Success Criteria

✅ **Frontend Testing Complete When:**
1. ✅ Both companies registered successfully
2. ✅ Company isolation verified (A can't see B's data)
3. ✅ Email uniqueness enforced globally
4. ✅ 3 vendors created with different credibility levels
5. ✅ 3 proposals requested and received status updated
6. ✅ Comparison dashboard loads with correct color coding:
   - Green on best price
   - Red on worst price
   - Green on fastest lead time
7. ✅ Vendor selection works and auto-rejects others
8. ✅ All API endpoints tested with correct JWT tokens
9. ✅ Multi-tenancy isolation verified at database level

---

## Production Readiness Checklist

- [ ] Frontend builds without errors: `npm run build`
- [ ] No console errors in browser
- [ ] Type checking passes: `npm run type-check`
- [ ] All UI components render correctly
- [ ] API calls use correct Authorization headers
- [ ] Error handling shows user-friendly messages
- [ ] Loading states show spinners
- [ ] Network requests complete within 2 seconds
- [ ] No memory leaks in React Query
- [ ] Responsive design works on mobile (375px width)

---

## Next Steps

After successful frontend testing:

1. **Deploy to staging environment**
2. **Run load testing with multiple concurrent users**
3. **Test with real backend data (not sample)**
4. **Verify payment processing** (Phase 5)
5. **Test dashboard analytics** (Phase 6)

---

**Ready to test? Start at:** http://localhost:3000/auth/register

Good luck! 🚀

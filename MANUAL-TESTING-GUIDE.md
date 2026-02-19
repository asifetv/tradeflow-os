# TradeFlow OS - M2 Manual Testing Guide

**Database:** Fresh (empty)
**Frontend:** http://localhost:3001
**Backend:** http://localhost:8000

---

## 📋 Complete E2E Workflow

This guide walks you through the complete workflow:

```
Customer → Deal → Quote → PO → Auto-Update Deal → Verify Logs
```

---

## PHASE 1: Create a Customer

### Step 1.1: Navigate to Customers
- Open browser: **http://localhost:3001/customers**
- Click blue **"New Customer"** button (top right)

### Step 1.2: Fill Customer Form
| Field | Value |
|-------|-------|
| Customer Code | `ADNOC-2024` |
| Company Name | `ADNOC Trading Company` |
| Country | `United Arab Emirates` |
| City | `Abu Dhabi` |
| Primary Contact Email | `contact@adnoc.ae` |
| Payment Terms | `Net 60` |
| Credit Limit | `1000000` |

### Step 1.3: Submit
- Click **"Create Customer"** button
- ✅ Should redirect to customer detail page
- ✅ Note the **Customer ID** from the URL (you'll need it later)
  - Example: `http://localhost:3001/customers/{CUSTOMER_ID}`

### Step 1.4: Verify Creation
- You should see customer details displayed
- Click **"Details"** tab to confirm all fields saved

---

## PHASE 2: Create a Deal (linked to customer)

### Step 2.1: Navigate to Deals
- Go to **http://localhost:3001/deals**
- Click blue **"New Deal"** button

### Step 2.2: Fill Deal Form - Basic Info
| Field | Value |
|-------|-------|
| Deal Number | `DEAL-ADNOC-2024-001` |
| Customer | Select `ADNOC Trading Company` from dropdown |
| Customer RFQ Reference | `RFQ-ADNOC-001` |
| Description | `Crude Oil Supply - 50,000 barrels WTI Grade A` |
| Currency | `AED` |

### Step 2.3: Fill Deal Form - Financial Info
| Field | Value |
|-------|-------|
| Total Value | `2500000` |
| Total Cost | `2000000` |
| Est. Margin % | `20` |

### Step 2.4: Add Line Item
- Click **"Add Line Item"** button
- Fill in:
  - Description: `Crude Oil WTI Grade A`
  - Material Spec: `API 5L Grade A`
  - Quantity: `50000`
  - Unit: `BBL`
  - Delivery Date: `2024-03-31`

### Step 2.5: Submit
- Click **"Create Deal"** button
- ✅ Should redirect to deal detail page
- ✅ Note the **Deal ID** from URL
- ✅ Check status badge shows **"rfq_received"**

---

## PHASE 3: Update Deal Status to QUOTED

### Step 3.1: Change Deal Status
- On deal detail page, look for status section
- Find button to change status (should show "Change Status" or status badge)
- Click to change status
- Select **"QUOTED"** from valid options
- ✅ Status should change to **"quoted"**

*Why?* The auto-update feature only works when deal is in QUOTED status

---

## PHASE 4: Create a Quote (linked to customer & deal)

### Step 4.1: Navigate to Quotes
- Go to **http://localhost:3001/quotes**
- Click blue **"New Quote"** button

### Step 4.2: Fill Quote Form - Basic Info
| Field | Value |
|-------|-------|
| Quote Number | `QT-ADNOC-2024-001` |
| Customer | Select `ADNOC Trading Company` from dropdown |
| Deal | Select `DEAL-ADNOC-2024-001` from dropdown |
| Title | `Crude Oil Price Quote - 50,000 BBL` |

### Step 4.3: Fill Quote Form - Financial Info
| Field | Value |
|-------|-------|
| Total Amount | `2500000` |
| Currency | `AED` |
| Payment Terms | `Net 30` |
| Validity Days | `30` |

### Step 4.4: Add Line Item (Optional but recommended)
- Click **"Add Line Item"** button
- Fill in:
  - Description: `Crude Oil WTI Grade A - 50,000 barrels`
  - Quantity: `50000`
  - Unit: `BBL`
  - Unit Price: `50`
  - Total Price: `2500000`

### Step 4.5: Submit
- Click **"Create Quote"** button
- ✅ Should redirect to quote detail page
- ✅ Note the **Quote ID** from URL
- ✅ Check status badge shows **"draft"**

---

## PHASE 5: Test Quote State Machine

### Step 5.1: Change Quote Status (DRAFT → SENT)
- On quote detail page, find status badge or change button
- Click to change status
- Select **"SENT"** from options
- ✅ Status should change to **"sent"**

### Step 5.2: Change Quote Status (SENT → ACCEPTED)
- Click status badge/button again
- Select **"ACCEPTED"** from options
- ✅ Status should change to **"accepted"** (terminal state)
- ✅ No more status change options should be available

---

## PHASE 6: Create a Customer PO (linked to deal & quote)

### Step 6.1: Navigate to Customer POs
- Go to **http://localhost:3001/customer-pos**
- Click blue **"New PO"** button

### Step 6.2: Fill PO Form - Basic Info
| Field | Value |
|-------|-------|
| Customer | Select `ADNOC Trading Company` from dropdown |
| PO Number | `PO-ADNOC-2024-001` |
| Internal Reference | `CPO-ADNOC-001` |
| Deal | Select `DEAL-ADNOC-2024-001` from dropdown |

### Step 6.3: Fill PO Form - Financial Info
| Field | Value |
|-------|-------|
| Total Amount | `2500000` |
| Currency | `AED` |
| PO Date | `2024-02-18` (today's date) |

### Step 6.4: Add Line Item (Optional)
- Click **"Add Line Item"** button
- Fill in:
  - Description: `Crude Oil WTI Grade A`
  - Quantity: `50000`
  - Unit: `BBL`
  - Unit Price: `50`
  - Total Price: `2500000`

### Step 6.5: Submit
- Click **"Create Customer PO"** button
- ✅ Should redirect to PO detail page
- ✅ Note the **PO ID** from URL
- ✅ Check status badge shows **"received"**

---

## PHASE 7: ⭐ TEST CRITICAL AUTO-UPDATE FEATURE

### Step 7.1: Note Current Deal Status
- Navigate back to deal detail: **http://localhost:3001/deals/{DEAL_ID}**
- Look at status badge - should be **"quoted"**
- Take a screenshot or note this state

### Step 7.2: Acknowledge the PO
- Go back to PO detail: **http://localhost:3001/customer-pos/{PO_ID}**
- Find status section
- Click to change status
- Select **"ACKNOWLEDGED"** from options
- ✅ Status should change to **"acknowledged"**

### Step 7.3: ⭐ VERIFY DEAL AUTO-UPDATE
- Navigate back to deal detail: **http://localhost:3001/deals/{DEAL_ID}**
- **CRITICAL CHECK:** Status badge should now show **"po_received"** ❌→✅
- This proves the auto-update worked when PO was acknowledged!

---

## PHASE 8: Verify Relationships in Customer Detail

### Step 8.1: Navigate to Customer Detail
- Go to: **http://localhost:3001/customers/{CUSTOMER_ID}**

### Step 8.2: Check Deals Tab
- Click **"Deals"** tab
- ✅ Should show `DEAL-ADNOC-2024-001` with status **"po_received"**
- Click deal to open detail

### Step 8.3: Check Quotes Tab
- Go back to customer detail
- Click **"Quotes"** tab
- ✅ Should show `QT-ADNOC-2024-001` with status **"accepted"**
- Click quote to open detail

### Step 8.4: Check POs Tab
- Go back to customer detail
- Click **"POs"** tab
- ✅ Should show `PO-ADNOC-2024-001` with status **"acknowledged"**
- Click PO to open detail

### Step 8.5: Verify Cross-Links
- On deal detail page, should see customer name/link
- Click to verify it goes to customer detail
- Same for quote and PO - all should be cross-linked

---

## PHASE 9: Verify Activity Logging

### Step 9.1: Check Deal Activity Log
- On deal detail page, find **"Activity"** tab
- ✅ Should see entries for:
  - `created` - When deal was created
  - `status_changed` - When changed from rfq_received to quoted
  - `auto_status_changed` - When auto-updated to po_received by PO acknowledgment

### Step 9.2: Check Quote Activity Log
- On quote detail page, find **"Activity"** tab
- ✅ Should see entries for:
  - `created` - When quote was created
  - `status_changed` - Multiple entries for status transitions (DRAFT→SENT→ACCEPTED)

### Step 9.3: Check PO Activity Log
- On PO detail page, find **"Activity"** tab
- ✅ Should see entries for:
  - `created` - When PO was created
  - `status_changed` - When changed from received to acknowledged

### Step 9.4: Check Timestamps
- All activity logs should have timestamps
- User ID should be present (test user: `550e8400-e29b-41d4-a716-446655440000`)

---

## 🎯 Success Checklist

Complete all items below to verify M2 is working:

### Customer ✓
- [ ] Created customer with all fields
- [ ] Customer detail page displays all info
- [ ] Can view in customer list

### Deal ✓
- [ ] Created deal linked to customer
- [ ] Initial status is "rfq_received"
- [ ] Can change status to "quoted"
- [ ] Deal appears in customer's deals tab

### Quote ✓
- [ ] Created quote linked to customer AND deal
- [ ] Initial status is "draft"
- [ ] Can transition through states (DRAFT → SENT → ACCEPTED)
- [ ] ACCEPTED is terminal (no more changes allowed)
- [ ] Quote appears in customer's quotes tab

### Customer PO ✓
- [ ] Created PO linked to customer, deal, AND quote
- [ ] Initial status is "received"
- [ ] Can change status to "acknowledged"
- [ ] PO appears in customer's POs tab

### ⭐ Auto-Update (CRITICAL) ✓
- [ ] **Deal status was "quoted" BEFORE acknowledging PO**
- [ ] **After acknowledging PO, deal status changed to "po_received"**
- [ ] **This happened automatically (not manual)**

### Activity Logging ✓
- [ ] Deal has activity log with created/status_changed/auto_status_changed
- [ ] Quote has activity log with created/status_changed entries
- [ ] PO has activity log with created/status_changed
- [ ] All logs show timestamp and user ID

### Navigation & Links ✓
- [ ] Customer detail has tabs: Details, Deals, Quotes, POs
- [ ] Each tab shows correct linked entities
- [ ] Can click on deals/quotes/POs to open details
- [ ] Can click back to customer from deal/quote/PO

---

## 📝 Notes

- **State Machine Rules:**
  - Deals: RFQ_RECEIVED → QUOTED (needed before PO can auto-update)
  - Quotes: DRAFT → SENT → ACCEPTED (terminal)
  - POs: RECEIVED → ACKNOWLEDGED → IN_PROGRESS → FULFILLED

- **Database is Fresh:**
  - All test data will be deleted and recreated
  - No existing records to interfere

- **Auto-Update Logic:**
  - Triggers when: PO status changes to ACKNOWLEDGED
  - And: Deal is in QUOTED status
  - And: PO has deal_id set
  - Result: Deal status becomes PO_RECEIVED

- **If Something Breaks:**
  - Check browser console (F12) for errors
  - Check backend logs: `/tmp/backend.log`
  - Verify API responses are JSON (not HTML error pages)

---

## 🚀 Ready to Start?

1. Open browser to: **http://localhost:3001**
2. Follow PHASE 1 to create a customer
3. Continue through each phase
4. Check all items in success checklist

**Estimated Time:** 15-20 minutes

**Good luck! 🎉**

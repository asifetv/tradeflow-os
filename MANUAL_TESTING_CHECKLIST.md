# M1 (Deal Hub) - Manual Testing Checklist

## Quick Start Testing (15 minutes)

### Prerequisites
- Backend running: `cd backend && uvicorn app.main:app --reload`
- Frontend running: `cd frontend && npm run dev`
- Both services accessible

### Step-by-Step Testing

#### 1. Backend Health Check (2 min)
```bash
# Test 1.1: Health endpoint
curl http://localhost:8000/healthz
# Expected: {"status": "ok"}

# Test 1.2: API Documentation available
# Open http://localhost:8000/docs in browser
# Expected: Swagger UI with all endpoints listed
```

✅ Pass: [ ] Fail: [ ]

---

#### 2. Deal Creation (3 min)

**Test 2.1: Create deal via API**
```bash
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "deal_number": "TEST-DEAL-001",
    "description": "Test deal for manual verification",
    "customer_rfq_ref": "RFQ-2024-001",
    "total_value": 100000,
    "line_items": [
      {
        "description": "Steel Pipe",
        "material_spec": "API 5L X52",
        "quantity": 100,
        "unit": "MT",
        "required_delivery_date": "2024-03-15"
      }
    ]
  }'
```

**Expected Response (201):**
```json
{
  "id": "uuid-here",
  "deal_number": "TEST-DEAL-001",
  "status": "rfq_received",
  "description": "Test deal for manual verification",
  "created_at": "timestamp",
  ...
}
```

✅ Pass: [ ] Fail: [ ]

**Note the deal ID for next tests**

---

#### 3. Deal Retrieval (2 min)

**Test 3.1: List all deals**
```bash
curl http://localhost:8000/api/deals
```

**Expected:**
- Status: 200
- Response includes the deal created in Test 2.1
- Shows pagination: skip, limit, total

✅ Pass: [ ] Fail: [ ]

**Test 3.2: Get specific deal**
```bash
curl http://localhost:8000/api/deals/{DEAL_ID}
```

**Expected:**
- Status: 200
- Returns full deal object
- Status shows as "rfq_received"

✅ Pass: [ ] Fail: [ ]

---

#### 4. Deal Update (2 min)

**Test 4.1: Update deal description**
```bash
curl -X PATCH http://localhost:8000/api/deals/{DEAL_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "total_value": 150000
  }'
```

**Expected:**
- Status: 200
- Response shows updated description
- Deal number unchanged

✅ Pass: [ ] Fail: [ ]

---

#### 5. State Machine Validation (2 min)

**Test 5.1: Valid status transition**
```bash
curl -X PATCH http://localhost:8000/api/deals/{DEAL_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "sourcing"}'
```

**Expected:**
- Status: 200
- Deal status changed to "sourcing"

✅ Pass: [ ] Fail: [ ]

**Test 5.2: Invalid status transition**
```bash
# First change to CLOSED
curl -X PATCH http://localhost:8000/api/deals/{DEAL_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "closed"}'

# Try to transition from CLOSED to RFQ_RECEIVED (invalid)
curl -X PATCH http://localhost:8000/api/deals/{DEAL_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "rfq_received"}'
```

**Expected:**
- Status: 400
- Error message: "Invalid status transition from closed to rfq_received"

✅ Pass: [ ] Fail: [ ]

---

#### 6. Activity Logging (1 min)

**Test 6.1: Get activity logs**
```bash
curl http://localhost:8000/api/deals/{DEAL_ID}/activity
```

**Expected:**
- Status: 200
- Response includes activity logs with:
  - "created" action (from Test 2.1)
  - "updated" action (from Test 4.1)
  - "status_changed" action (from Test 5.1 & 5.2)
- Each log shows:
  - action: string
  - changes: array with field, old_value, new_value
  - created_at: timestamp
- Newest logs first (reversed chronological order)

✅ Pass: [ ] Fail: [ ]

---

#### 7. Frontend Testing (3 min)

**Test 7.1: Access frontend**
- Open http://localhost:3000
- Expected: Home page with "Go to Deals" button

✅ Pass: [ ] Fail: [ ]

**Test 7.2: Navigate to deals list**
- Click "Go to Deals"
- Expected: Redirect to /deals with Kanban board showing
- Expected: Deal created in earlier tests appears in "RFQ Received" column

✅ Pass: [ ] Fail: [ ]

**Test 7.3: View deal detail**
- Click on deal card for "TEST-DEAL-001"
- Expected: Redirect to detail page (/deals/{id})
- Expected: Three tabs visible: Overview, Line Items, Activity

✅ Pass: [ ] Fail: [ ]

**Test 7.4: Check Overview tab**
- Verify shows:
  - Deal number: TEST-DEAL-001
  - Description: Updated description (from Test 4.1)
  - Status: Badge showing "Closed"
  - Total Value: 150000 AED
  - Created date: timestamp

✅ Pass: [ ] Fail: [ ]

**Test 7.5: Check Line Items tab**
- Verify shows line item:
  - Description: Steel Pipe
  - Material Spec: API 5L X52
  - Quantity: 100 MT
  - Required Delivery: 2024-03-15

✅ Pass: [ ] Fail: [ ]

**Test 7.6: Check Activity tab**
- Verify shows activity logs:
  - Created action
  - Updated action (showing description and total_value changes)
  - Status changed actions (showing transitions)
- Verify timestamps show relative time (e.g., "2 minutes ago")

✅ Pass: [ ] Fail: [ ]

---

#### 8. Delete Deal (1 min)

**Test 8.1: Delete via API**
```bash
curl -X DELETE http://localhost:8000/api/deals/{DEAL_ID}
```

**Expected:**
- Status: 204 (No Content)
- No response body

✅ Pass: [ ] Fail: [ ]

**Test 8.2: Verify deletion**
```bash
curl http://localhost:8000/api/deals/{DEAL_ID}
```

**Expected:**
- Status: 404
- Error message: "Deal {DEAL_ID} not found"

✅ Pass: [ ] Fail: [ ]

---

## Feature Verification Checklist

### Backend Features
- [ ] All 7 API endpoints respond correctly
- [ ] POST /api/deals returns 201 Created
- [ ] GET /api/deals returns 200 with pagination
- [ ] GET /api/deals/{id} returns 200 or 404
- [ ] PATCH /api/deals/{id} returns 200 and updates fields
- [ ] PATCH /api/deals/{id}/status validates transitions
- [ ] DELETE /api/deals/{id} returns 204 and soft deletes
- [ ] GET /api/deals/{id}/activity returns activity logs

### State Machine
- [ ] Valid transitions allowed (RFQ → Sourcing, Quoted, Cancelled)
- [ ] Invalid transitions rejected with 400 error
- [ ] Terminal states (Closed, Cancelled) have no valid transitions
- [ ] Status changes logged in activity trail

### Activity Logging
- [ ] "created" action logged on deal creation
- [ ] "updated" action logged on field changes
- [ ] "status_changed" action logged on status updates
- [ ] "deleted" action logged on soft delete
- [ ] Field-level diffs show old_value → new_value
- [ ] Logs sorted by created_at DESC (newest first)

### Frontend UI
- [ ] Home page loads at http://localhost:3000
- [ ] "Go to Deals" button navigates to /deals
- [ ] Kanban board displays 12 status columns
- [ ] Deals grouped by status in Kanban
- [ ] Table view shows all deal columns
- [ ] Deal detail page shows 3 tabs
- [ ] Overview tab shows financial summary
- [ ] Line Items tab lists all items
- [ ] Activity tab shows chronological changes
- [ ] Status dropdown shows only valid transitions

### Form Validation
- [ ] Required fields (deal_number, description) enforced
- [ ] Invalid characters rejected
- [ ] Negative quantities rejected for line items
- [ ] Date format validation works
- [ ] Error messages displayed in red

### Soft Delete & Data Integrity
- [ ] Deleted deals don't appear in lists
- [ ] Deleted deals return 404 on direct access
- [ ] Activity logs preserved for deleted deals
- [ ] No permanent data loss

---

## Test Data Creation

### Scenario A: Simple Deal
```bash
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "deal_number": "SIMPLE-001",
    "description": "Simple test deal"
  }'
```

### Scenario B: Complex Deal
```bash
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "deal_number": "COMPLEX-001",
    "description": "Complex multi-item deal",
    "customer_rfq_ref": "RFQ-2024-COMPLEX",
    "total_value": 500000,
    "total_cost": 300000,
    "estimated_margin_pct": 40,
    "currency": "AED",
    "notes": "Priority customer deal",
    "line_items": [
      {
        "description": "Valve Assembly",
        "material_spec": "ASME Class 300",
        "quantity": 50,
        "unit": "PC",
        "required_delivery_date": "2024-04-15"
      },
      {
        "description": "Flange Kit",
        "material_spec": "DIN EN 1092-1",
        "quantity": 100,
        "unit": "PC",
        "required_delivery_date": "2024-04-20"
      },
      {
        "description": "Inspection Services",
        "material_spec": "API 653",
        "quantity": 1,
        "unit": "JOB",
        "required_delivery_date": "2024-05-01"
      }
    ]
  }'
```

---

## Edge Cases & Error Testing

### Test: Duplicate deal number
```bash
# Create first deal
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{"deal_number": "DUP-001", "description": "First"}'

# Try to create with same number
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{"deal_number": "DUP-001", "description": "Second"}'
```

**Expected:** Status 422 (Validation error) - unique constraint violated

### Test: Missing required fields
```bash
# Missing deal_number
curl -X POST http://localhost:8000/api/deals \
  -H "Content-Type: application/json" \
  -d '{"description": "No number"}'
```

**Expected:** Status 422 with validation error details

### Test: Invalid UUID format
```bash
curl http://localhost:8000/api/deals/not-a-uuid
```

**Expected:** Status 422 or 404

---

## Performance Baseline

Record these times for comparison:

| Operation | Expected | Actual |
|-----------|----------|--------|
| Create deal | <150ms | _____ |
| List deals (50) | <100ms | _____ |
| Get single deal | <50ms | _____ |
| Update deal | <100ms | _____ |
| Change status | <100ms | _____ |
| Get activity logs | <100ms | _____ |

---

## Browser Console Testing (Frontend)

Open browser DevTools (F12) and check for:
- [ ] No JavaScript errors in Console tab
- [ ] No CORS errors
- [ ] No 404 errors for static assets
- [ ] Network tab shows successful responses (200, 201, 204)
- [ ] No failed API requests

---

## Summary

**Total Tests:** 15 API calls + 7 UI interactions = 22 actions
**Estimated Time:** 15-20 minutes
**Test Results:** _____ / 22 passed

**Issues Found:**
```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

**Overall Status:**
- [ ] ✅ All tests passed - Ready for deployment
- [ ] ⚠️ Some issues - Needs fixes
- [ ] ❌ Critical failures - Blockers present

**Tester Name:** _______________
**Test Date:** _______________
**Environment:** Local / Staging / Production

---

## Next Steps

If all tests pass:
1. Run automated test suite: `bash run_tests.sh`
2. Deploy to staging environment
3. Perform load testing
4. Setup CI/CD pipeline
5. Plan M2 features

If tests fail:
1. Document failures in Issues section above
2. Check TEST_SUITE_GUIDE.md for troubleshooting
3. Review relevant test files
4. Run specific failing tests with verbose output
5. Check backend logs for errors


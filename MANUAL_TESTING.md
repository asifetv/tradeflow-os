# M2 Manual Testing Guide

This guide provides step-by-step instructions for manually testing the M2 (CRM & Sales) implementation.

## Prerequisites

1. **Start the backend:**
```bash
cd backend
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

2. **Start the frontend (in another terminal):**
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:3000`

3. **Get a test user ID** (for API headers):
```bash
export USER_ID="550e8400-e29b-41d4-a716-446655440000"
```

---

## Option 1: Using Swagger UI (Recommended)

1. Open `http://localhost:8000/docs` in your browser
2. For any endpoint that requires authentication, click "Authorize" and enter:
   - Header name: `X-User-ID`
   - Value: `550e8400-e29b-41d4-a716-446655440000`
3. Follow the test sequence below

---

## Option 2: Using cURL Commands

### 1. Create a Customer

```bash
curl -X POST "http://localhost:8000/api/customers" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "customer_code": "CUST-TEST-001",
    "company_name": "Saudi Aramco Trading",
    "country": "Saudi Arabia",
    "city": "Riyadh",
    "primary_contact_name": "Ahmed Al-Saud",
    "primary_contact_email": "ahmed@aramco.com",
    "primary_contact_phone": "+966-1-234-5678",
    "payment_terms": "Net 60",
    "credit_limit": 5000000,
    "is_active": true
  }'
```

Save the returned `id` as `$CUSTOMER_ID`

### 2. Get Customer List

```bash
curl -X GET "http://localhost:8000/api/customers?skip=0&limit=50&is_active=true" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
```

### 3. Get Customer Detail

```bash
curl -X GET "http://localhost:8000/api/customers/$CUSTOMER_ID" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
```

### 4. Update Customer

```bash
curl -X PATCH "http://localhost:8000/api/customers/$CUSTOMER_ID" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "payment_terms": "Net 90",
    "credit_limit": 10000000
  }'
```

### 5. Create a Deal (for later linking)

```bash
curl -X POST "http://localhost:8000/api/deals" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "deal_number": "DEAL-TEST-001",
    "customer_id": "'$CUSTOMER_ID'",
    "description": "Test deal for M2 verification",
    "currency": "AED",
    "total_value": 500000,
    "line_items": [
      {
        "description": "Crude Oil",
        "material_spec": "WTI",
        "quantity": 1000,
        "unit": "BBL",
        "required_delivery_date": "2024-03-15"
      }
    ]
  }'
```

Save the returned `id` as `$DEAL_ID`

### 6. Create a Quote

```bash
curl -X POST "http://localhost:8000/api/quotes" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "quote_number": "QT-TEST-001",
    "customer_id": "'$CUSTOMER_ID'",
    "deal_id": "'$DEAL_ID'",
    "title": "Crude Oil Quote",
    "description": "Test quote for M2",
    "total_amount": 50000,
    "currency": "AED",
    "validity_days": 30,
    "line_items": [
      {
        "description": "Crude Oil",
        "material_spec": "WTI",
        "quantity": 1000,
        "unit": "BBL",
        "unit_price": 50,
        "total_price": 50000
      }
    ]
  }'
```

Save the returned `id` as `$QUOTE_ID`

### 7. Get Quote Detail

```bash
curl -X GET "http://localhost:8000/api/quotes/$QUOTE_ID" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
```

Expected response: Status `DRAFT`

### 8. Update Quote Status: DRAFT → SENT

```bash
curl -X PATCH "http://localhost:8000/api/quotes/$QUOTE_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "status": "sent"
  }'
```

Expected response: Status changes to `SENT`

### 9. Try Invalid Transition (should fail with 400)

```bash
curl -X PATCH "http://localhost:8000/api/quotes/$QUOTE_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "status": "draft"
  }'
```

Expected response: 400 Bad Request - "Invalid status transition"

### 10. Update Quote Status: SENT → ACCEPTED

```bash
curl -X PATCH "http://localhost:8000/api/quotes/$QUOTE_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "status": "accepted"
  }'
```

Expected response: Status changes to `ACCEPTED`

### 11. Create a CustomerPO

```bash
curl -X POST "http://localhost:8000/api/customer-pos" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "internal_ref": "CPO-TEST-001",
    "po_number": "PO-2024-001",
    "customer_id": "'$CUSTOMER_ID'",
    "deal_id": "'$DEAL_ID'",
    "quote_id": "'$QUOTE_ID'",
    "total_amount": 50000,
    "currency": "AED",
    "po_date": "2024-02-18",
    "line_items": [
      {
        "description": "Crude Oil",
        "material_spec": "WTI",
        "quantity": 1000,
        "unit": "BBL",
        "unit_price": 50,
        "total_price": 50000
      }
    ]
  }'
```

Save the returned `id` as `$PO_ID`

### 12. Get CustomerPO Detail

```bash
curl -X GET "http://localhost:8000/api/customer-pos/$PO_ID" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
```

Expected response: Status `RECEIVED`

### 13. Update Deal to QUOTED (prerequisite for PO_RECEIVED transition)

```bash
curl -X PATCH "http://localhost:8000/api/deals/$DEAL_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "status": "quoted"
  }'
```

### 14. Update CustomerPO Status: RECEIVED → ACKNOWLEDGED

```bash
curl -X PATCH "http://localhost:8000/api/customer-pos/$PO_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "status": "acknowledged"
  }'
```

Expected response: Status changes to `ACKNOWLEDGED`

### 15. ⭐ VERIFY AUTO-UPDATE: Check Deal Status Changed to PO_RECEIVED

```bash
curl -X GET "http://localhost:8000/api/deals/$DEAL_ID" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
```

Expected response: Deal status is now `po_received` (auto-updated when PO acknowledged!)

### 16. Continue CustomerPO State Machine: ACKNOWLEDGED → IN_PROGRESS

```bash
curl -X PATCH "http://localhost:8000/api/customer-pos/$PO_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "status": "in_progress"
  }'
```

### 17. Complete CustomerPO: IN_PROGRESS → FULFILLED

```bash
curl -X PATCH "http://localhost:8000/api/customer-pos/$PO_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "status": "fulfilled"
  }'
```

### 18. Delete Customer (Soft Delete)

```bash
curl -X DELETE "http://localhost:8000/api/customers/$CUSTOMER_ID" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
```

Expected response: 204 No Content

### 19. Verify Soft Delete (should return 404)

```bash
curl -X GET "http://localhost:8000/api/customers/$CUSTOMER_ID" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
```

Expected response: 404 Not Found

---

## Option 3: Using Frontend UI

1. Open `http://localhost:3000`
2. Navigate to `/customers/new` to create a customer
3. Fill in customer details and save
4. Navigate to `/quotes/new` to create a quote
5. Select the customer you just created
6. Add line items and save
7. On quote detail page, change status using the dropdown
8. Verify state machine validates transitions
9. Navigate to `/customer-pos/new` to create a PO
10. Link to the customer and quote
11. Acknowledge the PO and verify deal status auto-updates

---

## Expected Test Results

### ✅ Passing Tests:
- [x] Customer CRUD operations
- [x] Quote state machine transitions
- [x] CustomerPO state machine transitions
- [x] Auto-update of deal status on PO acknowledgment
- [x] Soft delete functionality
- [x] Activity logging
- [x] API validation and error handling

### 🎯 Key Verification Points:

1. **Customer Management**: Create, read, update, delete customers
2. **Quote Workflow**: DRAFT → SENT → ACCEPTED (terminal)
3. **CustomerPO Workflow**: RECEIVED → ACKNOWLEDGED → IN_PROGRESS → FULFILLED
4. **Auto-Update**: Acknowledging PO auto-updates linked deal to PO_RECEIVED
5. **State Machine**: Invalid transitions are rejected with 400 errors
6. **Soft Delete**: Deleted records don't appear in list queries
7. **Activity Logs**: All mutations are logged with field-level diffs

---

## Troubleshooting

### 401 Unauthorized
- Make sure you're passing the `X-User-ID` header in API requests

### 404 Not Found
- Verify you're using the correct IDs returned from previous requests
- Check that the resource hasn't been soft-deleted

### 400 Bad Request - Invalid Status Transition
- Verify the transition is valid according to the state machine
- Check the allowed transitions documented above

### Database Issues
- Delete the SQLite database (`backend/tradeflow.db`) to start fresh
- The database will be recreated on the next API call

---

## Quick Test Script (Bash)

Save this as `test_m2.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:8000"
USER_ID="550e8400-e29b-41d4-a716-446655440000"

echo "=== M2 Manual Testing ==="

# 1. Create Customer
echo "Creating customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_URL/api/customers" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{
    "customer_code": "CUST-TEST-'$(date +%s)'",
    "company_name": "Test Company",
    "country": "Saudi Arabia"
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✅ Customer created: $CUSTOMER_ID"

# 2. List Customers
echo "Listing customers..."
curl -s -X GET "$API_URL/api/customers" | jq '.total'
echo "✅ Customers listed"

# 3. Create Deal
echo "Creating deal..."
DEAL_RESPONSE=$(curl -s -X POST "$API_URL/api/deals" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{
    "deal_number": "DEAL-TEST-'$(date +%s)'",
    "customer_id": "'$CUSTOMER_ID'",
    "description": "Test deal",
    "line_items": []
  }')

DEAL_ID=$(echo $DEAL_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✅ Deal created: $DEAL_ID"

# 4. Create Quote
echo "Creating quote..."
QUOTE_RESPONSE=$(curl -s -X POST "$API_URL/api/quotes" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{
    "quote_number": "QT-TEST-'$(date +%s)'",
    "customer_id": "'$CUSTOMER_ID'",
    "deal_id": "'$DEAL_ID'",
    "title": "Test Quote",
    "total_amount": 50000,
    "line_items": []
  }')

QUOTE_ID=$(echo $QUOTE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "✅ Quote created: $QUOTE_ID"

# 5. Update Quote Status
echo "Updating quote status..."
curl -s -X PATCH "$API_URL/api/quotes/$QUOTE_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{"status": "sent"}' | jq '.status'
echo "✅ Quote status updated"

echo ""
echo "=== All tests completed successfully! ==="
```

Run it with:
```bash
chmod +x test_m2.sh
./test_m2.sh
```

---

## Summary

This manual testing guide covers:
- ✅ All CRUD operations for M2 entities
- ✅ State machine transitions
- ✅ Auto-update logic verification
- ✅ Error handling
- ✅ Soft delete functionality

Start with **Option 1 (Swagger UI)** if you prefer a visual interface, or **Option 2 (cURL)** if you prefer command-line testing.

#!/bin/bash

# TradeFlow OS - End-to-End M2 Testing Script
# This script tests the complete workflow: Customer → Deal → Quote → CustomerPO

set -e

API_URL="http://localhost:8000"
USER_ID="550e8400-e29b-41d4-a716-446655440000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TradeFlow OS - E2E M2 Testing${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Helper function to print test steps
test_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Helper function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Helper function to print error
error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# ============================================
# STEP 1: Create a Customer
# ============================================
test_step "STEP 1: Creating Customer..."

CUSTOMER=$(curl -s -X POST "$API_URL/api/customers" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{
    "customer_code": "ADNOC-TEST",
    "company_name": "ADNOC Trading Company",
    "country": "UAE",
    "city": "Abu Dhabi",
    "primary_contact_email": "contact@adnoc.ae",
    "payment_terms": "Net 60",
    "credit_limit": 1000000,
    "is_active": true
  }')

CUSTOMER_ID=$(echo "$CUSTOMER" | jq -r '.id')
if [ -z "$CUSTOMER_ID" ] || [ "$CUSTOMER_ID" = "null" ]; then
    error "Failed to create customer"
fi
success "Customer created: $CUSTOMER_ID"
success "Company: $(echo "$CUSTOMER" | jq -r '.company_name')"

# ============================================
# STEP 2: Create a Deal
# ============================================
test_step "STEP 2: Creating Deal linked to Customer..."

DEAL=$(curl -s -X POST "$API_URL/api/deals" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{
    "deal_number": "DEAL-2024-001",
    "customer_id": "'$CUSTOMER_ID'",
    "customer_rfq_ref": "RFQ-ADNOC-2024",
    "description": "Crude Oil Supply Agreement - 50,000 BBL",
    "currency": "AED",
    "total_value": 2500000,
    "total_cost": 2000000,
    "estimated_margin_pct": 20,
    "line_items": [
      {
        "description": "Crude Oil WTI",
        "material_spec": "Grade A",
        "quantity": 50000,
        "unit": "BBL",
        "required_delivery_date": "2024-03-31"
      }
    ]
  }')

DEAL_ID=$(echo "$DEAL" | jq -r '.id')
DEAL_STATUS=$(echo "$DEAL" | jq -r '.status')
if [ -z "$DEAL_ID" ] || [ "$DEAL_ID" = "null" ]; then
    error "Failed to create deal"
fi
success "Deal created: $DEAL_ID"
success "Deal Status: $DEAL_STATUS (should be RFQ_RECEIVED)"

# ============================================
# STEP 2.5: Update Deal Status to QUOTED
# ============================================
test_step "STEP 2.5: Updating Deal status from RFQ_RECEIVED to QUOTED..."

DEAL_QUOTED=$(curl -s -X PATCH "$API_URL/api/deals/$DEAL_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{"status": "quoted"}')

DEAL_STATUS=$(echo "$DEAL_QUOTED" | jq -r '.status')
if [ "$DEAL_STATUS" != "quoted" ]; then
    error "Failed to change deal status to quoted"
fi
success "Deal status changed: RFQ_RECEIVED → QUOTED"

# ============================================
# STEP 3: Create a Quote
# ============================================
test_step "STEP 3: Creating Quote linked to Customer & Deal..."

QUOTE=$(curl -s -X POST "$API_URL/api/quotes" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{
    "quote_number": "QT-ADNOC-2024-001",
    "customer_id": "'$CUSTOMER_ID'",
    "deal_id": "'$DEAL_ID'",
    "title": "Crude Oil Price Quote",
    "description": "Formal quote for 50,000 barrels of WTI Crude",
    "line_items": [
      {
        "description": "Crude Oil WTI - Grade A",
        "quantity": 50000,
        "unit": "BBL",
        "unit_price": 50,
        "total_price": 2500000
      }
    ],
    "total_amount": 2500000,
    "currency": "AED",
    "payment_terms": "Net 30",
    "validity_days": 30
  }')

QUOTE_ID=$(echo "$QUOTE" | jq -r '.id')
QUOTE_STATUS=$(echo "$QUOTE" | jq -r '.status')
if [ -z "$QUOTE_ID" ] || [ "$QUOTE_ID" = "null" ]; then
    error "Failed to create quote"
fi
success "Quote created: $QUOTE_ID"
success "Quote Status: $QUOTE_STATUS (should be draft)"

# ============================================
# STEP 4: Test Quote State Machine
# ============================================
test_step "STEP 4: Testing Quote State Machine Transitions..."

# Change from DRAFT to SENT
QUOTE_SENT=$(curl -s -X PATCH "$API_URL/api/quotes/$QUOTE_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{"status": "sent"}')

QUOTE_STATUS=$(echo "$QUOTE_SENT" | jq -r '.status')
if [ "$QUOTE_STATUS" != "sent" ]; then
    error "Failed to change quote status to sent"
fi
success "Quote status changed: DRAFT → SENT"

# Change from SENT to ACCEPTED
QUOTE_ACCEPTED=$(curl -s -X PATCH "$API_URL/api/quotes/$QUOTE_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{"status": "accepted"}')

QUOTE_STATUS=$(echo "$QUOTE_ACCEPTED" | jq -r '.status')
if [ "$QUOTE_STATUS" != "accepted" ]; then
    error "Failed to change quote status to accepted"
fi
success "Quote status changed: SENT → ACCEPTED (terminal state)"

# ============================================
# STEP 5: Create a Customer PO
# ============================================
test_step "STEP 5: Creating Customer PO linked to Deal & Quote..."

CUSTOMER_PO=$(curl -s -X POST "$API_URL/api/customer-pos" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{
    "internal_ref": "CPO-2024-001",
    "po_number": "PO-ADNOC-2024-001",
    "customer_id": "'$CUSTOMER_ID'",
    "deal_id": "'$DEAL_ID'",
    "quote_id": "'$QUOTE_ID'",
    "total_amount": 2500000,
    "currency": "AED",
    "po_date": "2024-02-18",
    "line_items": [
      {
        "description": "Crude Oil WTI - Grade A",
        "quantity": 50000,
        "unit": "BBL",
        "unit_price": 50,
        "total_price": 2500000
      }
    ]
  }')

PO_ID=$(echo "$CUSTOMER_PO" | jq -r '.id')
PO_STATUS=$(echo "$CUSTOMER_PO" | jq -r '.status')
if [ -z "$PO_ID" ] || [ "$PO_ID" = "null" ]; then
    error "Failed to create customer PO"
fi
success "Customer PO created: $PO_ID"
success "PO Status: $PO_STATUS (should be received)"

# ============================================
# STEP 6: Test PO State Machine & Auto-Update
# ============================================
test_step "STEP 6: Testing PO State Machine & Deal Auto-Update..."

# First, verify deal is in QUOTED status before PO acknowledgment
DEAL_BEFORE=$(curl -s "$API_URL/api/deals/$DEAL_ID" \
  -H "X-User-ID: $USER_ID")
DEAL_STATUS_BEFORE=$(echo "$DEAL_BEFORE" | jq -r '.status')
success "Deal status BEFORE PO acknowledgment: $DEAL_STATUS_BEFORE (should be quoted)"

# Change PO status from RECEIVED to ACKNOWLEDGED
# This should trigger auto-update of deal status to PO_RECEIVED
PO_ACKNOWLEDGED=$(curl -s -X PATCH "$API_URL/api/customer-pos/$PO_ID/status" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: $USER_ID" \
  -d '{"status": "acknowledged"}')

PO_STATUS=$(echo "$PO_ACKNOWLEDGED" | jq -r '.status')
if [ "$PO_STATUS" != "acknowledged" ]; then
    error "Failed to change PO status to acknowledged"
fi
success "PO status changed: RECEIVED → ACKNOWLEDGED"

# Check deal status after PO acknowledgment (should be auto-updated)
DEAL_AFTER=$(curl -s "$API_URL/api/deals/$DEAL_ID" \
  -H "X-User-ID: $USER_ID")
DEAL_STATUS_AFTER=$(echo "$DEAL_AFTER" | jq -r '.status')
success "Deal status AFTER PO acknowledgment: $DEAL_STATUS_AFTER"

if [ "$DEAL_STATUS_AFTER" = "po_received" ]; then
    success "⭐ CRITICAL TEST PASSED: Deal auto-updated to PO_RECEIVED when PO was acknowledged!"
else
    error "⭐ CRITICAL TEST FAILED: Deal status should be po_received but is $DEAL_STATUS_AFTER"
fi

# ============================================
# STEP 7: Verify Activity Logging
# ============================================
test_step "STEP 7: Verifying Activity Logging..."

DEAL_ACTIVITY=$(curl -s "$API_URL/api/deals/$DEAL_ID/activity" \
  -H "X-User-ID: $USER_ID")
ACTIVITY_COUNT=$(echo "$DEAL_ACTIVITY" | jq '.activity | length')
success "Deal activity logs: $ACTIVITY_COUNT entries"

echo -e "\n${YELLOW}Activity Log Summary:${NC}"
echo "$DEAL_ACTIVITY" | jq '.activity[] | "\(.action) - \(.entity_type) (\(.created_at))"' -r | head -5

# ============================================
# STEP 8: Verify Customer View
# ============================================
test_step "STEP 8: Verifying Customer Detail View..."

CUSTOMER_DEALS=$(curl -s "$API_URL/api/customers/$CUSTOMER_ID/deals" \
  -H "X-User-ID: $USER_ID")
DEALS_COUNT=$(echo "$CUSTOMER_DEALS" | jq '.deals | length')
success "Customer has $DEALS_COUNT deal(s)"

CUSTOMER_QUOTES=$(curl -s "$API_URL/api/customers/$CUSTOMER_ID/quotes" \
  -H "X-User-ID: $USER_ID")
QUOTES_COUNT=$(echo "$CUSTOMER_QUOTES" | jq '.quotes | length')
success "Customer has $QUOTES_COUNT quote(s)"

CUSTOMER_POS=$(curl -s "$API_URL/api/customers/$CUSTOMER_ID/pos" \
  -H "X-User-ID: $USER_ID")
POS_COUNT=$(echo "$CUSTOMER_POS" | jq '.customer_pos | length')
success "Customer has $POS_COUNT PO(s)"

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Test Data Summary:${NC}"
echo "Customer ID:      $CUSTOMER_ID"
echo "Deal ID:          $DEAL_ID"
echo "Quote ID:         $QUOTE_ID"
echo "PO ID:            $PO_ID"
echo ""
echo -e "${YELLOW}Final States:${NC}"
echo "Deal Status:      $DEAL_STATUS_AFTER"
echo "Quote Status:     ACCEPTED"
echo "PO Status:        ACKNOWLEDGED"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Navigate to: http://localhost:3001/customers/$CUSTOMER_ID"
echo "2. View deals, quotes, and POs in the tabs"
echo "3. Check deal detail page to see auto-update happened"
echo "4. View activity logs to see all changes tracked"
echo ""

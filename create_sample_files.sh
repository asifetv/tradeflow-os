#!/bin/bash

# M4 Document Management - Sample Test Files Generator
# This script creates realistic sample documents for manual testing

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo "  M4 Document Management - Sample Files Generator"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Create output directory
OUTPUT_DIR="/tmp/m4_test_samples"
mkdir -p "$OUTPUT_DIR"

echo "✓ Creating sample files in: $OUTPUT_DIR"
echo ""

# ============================================================================
# 1. RFQ DOCUMENT
# ============================================================================
echo "Creating: sample_rfq.txt..."
cat > "$OUTPUT_DIR/sample_rfq.txt" << 'EOF'
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

# ============================================================================
# 2. VENDOR PROPOSAL
# ============================================================================
echo "Creating: sample_proposal.txt..."
cat > "$OUTPUT_DIR/sample_proposal.txt" << 'EOF'
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

# ============================================================================
# 3. CERTIFICATE DOCUMENT
# ============================================================================
echo "Creating: sample_certificate.txt..."
cat > "$OUTPUT_DIR/sample_certificate.txt" << 'EOF'
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

# ============================================================================
# 4. INVOICE DOCUMENT
# ============================================================================
echo "Creating: sample_invoice.txt..."
cat > "$OUTPUT_DIR/sample_invoice.txt" << 'EOF'
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

# ============================================================================
# 5. MATERIAL CERTIFICATE
# ============================================================================
echo "Creating: sample_material_cert.txt..."
cat > "$OUTPUT_DIR/sample_material_cert.txt" << 'EOF'
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

# ============================================================================
# 6. COMPANY POLICY
# ============================================================================
echo "Creating: sample_company_policy.txt..."
cat > "$OUTPUT_DIR/sample_company_policy.txt" << 'EOF'
COMPANY PROCUREMENT POLICY

Document ID: POL-2026-001
Effective Date: January 1, 2026
Last Updated: February 23, 2026
Classification: Internal - All Employees

1. PURPOSE

This policy establishes guidelines and procedures for the procurement of
materials, equipment, and services to ensure:
- Best value for money
- Quality standards compliance
- Regulatory adherence
- Transparency and fairness

2. SCOPE

This policy applies to:
- All company departments and subsidiaries
- All employees involved in procurement
- All vendors and suppliers
- All procurement transactions regardless of amount

3. APPROVAL THRESHOLDS

- Under $10,000: Department Manager approval
- $10,000-$50,000: Director approval
- $50,000-$200,000: VP approval
- Over $200,000: Executive Committee approval

4. VENDOR EVALUATION CRITERIA

Price Competitiveness: 30%
Quality and Certifications: 40%
Delivery Reliability: 20%
Customer Service and Support: 10%

Minimum Requirements:
- ISO 9001 certification (or equivalent)
- Financial stability assessment
- References from existing customers
- Insurance and bonding

5. REQUIRED DOCUMENTATION

All vendor proposals must include:
- Detailed price breakdown
- Quality certifications and compliance
- Delivery schedule and lead time
- Insurance and bonding certificates
- Product specifications
- Warranty and support terms
- References from similar customers

6. PAYMENT TERMS

- Standard: Net 30 days
- Early payment: 2% discount if paid within 10 days
- Late payment: 1.5% monthly interest on outstanding balance

7. DISPUTE RESOLUTION

1. Contact vendor within 48 hours of issue
2. Document issue with photo/video evidence
3. Request corrective action within 7 days
4. Escalate to management if unresolved
5. Initiate formal dispute process if needed

8. COMPLIANCE

All procurement activities must comply with:
- Local and international regulations
- Company ethical standards
- Environmental requirements
- Labour and human rights standards
- Data protection and privacy laws

Approved by: CFO - Sarah Johnson
Date: January 15, 2026
Signature: _______________
EOF

# ============================================================================
# 7. RFQ TEMPLATE
# ============================================================================
echo "Creating: sample_rfq_template.txt..."
cat > "$OUTPUT_DIR/sample_rfq_template.txt" << 'EOF'
REQUEST FOR QUOTATION - TEMPLATE

Date: _____________________
RFQ Reference: _____________________
From: _____________________
Contact: _____________________
Email: _____________________
Phone: _____________________

REQUIRED ITEMS:

Item 1: _____________________
  Specifications: _____________________
  Quantity: _____ Unit: _____
  Unit of Measure: _____________________
  Total Cost: _____________________

Item 2: _____________________
  Specifications: _____________________
  Quantity: _____ Unit: _____
  Unit of Measure: _____________________
  Total Cost: _____________________

Item 3: _____________________
  Specifications: _____________________
  Quantity: _____ Unit: _____
  Unit of Measure: _____________________
  Total Cost: _____________________

DELIVERY REQUIREMENTS:

Required Delivery Date: _____________________
Delivery Location: _____________________
Shipping Terms (CIF/FOB/DDP): _____________________
Special Handling: _____________________

SPECIFICATIONS & CERTIFICATIONS:

Required Certifications: _____________________
Quality Standards: _____________________
Testing Requirements: _____________________
Documentation: _____________________

COMMERCIAL TERMS:

Payment Terms: _____________________
Quote Validity: _____ days
Currency: _____________________
Total Project Value: _____________________

NOTES & SPECIAL REQUIREMENTS:

_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________

Issued by: _____________________
Authorized Signature: _____________________
Date: _____________________

PLEASE SUBMIT QUOTATION BY: _____________________
EOF

# ============================================================================
# 8. TEST DATA FOR MULTI-UPLOAD
# ============================================================================
echo "Creating: batch test files..."

# Create 5 additional test files for batch upload testing
for i in {1..5}; do
  cat > "$OUTPUT_DIR/proposal_$i.txt" << EOF
VENDOR PROPOSAL #$i

Date: February 23, 2026
Vendor: Test Supplier $i
Total Price: \$4$((3000 + i * 500)) USD
Lead Time: $((12 + i)) days
Payment Terms: Net $((30 + i * 5)) days
Status: Ready for submission
EOF
done

echo "✓ Created batch test files (proposal_1.txt through proposal_5.txt)"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ SAMPLE FILES CREATED SUCCESSFULLY"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📁 Location: $OUTPUT_DIR"
echo ""
echo "📄 Files Created:"
ls -1 "$OUTPUT_DIR" | sed 's/^/   ✓ /'
echo ""
echo "📊 File Sizes:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "1. Start the backend:"
echo "   cd /Users/asifetv/tradeflow-os/backend"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. Start the frontend:"
echo "   cd /Users/asifetv/tradeflow-os/frontend"
echo "   npm run dev"
echo ""
echo "3. Login to: http://localhost:3000"
echo ""
echo "4. Follow the manual testing guide:"
echo "   /Users/asifetv/tradeflow-os/M4_MANUAL_TESTING_GUIDE.md"
echo ""
echo "5. Upload files from: $OUTPUT_DIR"
echo ""
echo "📝 Usage Examples:"
echo "   - Drag sample_rfq.txt to Deal document upload"
echo "   - Upload sample_proposal.txt to Vendor Proposal"
echo "   - Upload sample_certificate.txt to Vendor certifications"
echo "   - Upload sample_company_policy.txt to Company Documents"
echo ""
echo "✨ All files are ready for testing!"
echo ""

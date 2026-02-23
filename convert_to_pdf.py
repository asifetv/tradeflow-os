#!/usr/bin/env python3
"""
Convert sample test files from TXT to PDF format
Requires: reportlab library
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# Configuration
INPUT_DIR = "/tmp/m4_test_samples"
OUTPUT_DIR = "/tmp/m4_test_samples"

def create_pdf_from_text(input_file, output_file):
    """Convert a text file to PDF with nice formatting"""

    try:
        # Read the text file
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Create PDF document
        doc = SimpleDocTemplate(
            output_file,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
            title=Path(input_file).stem
        )

        # Container for the 'Flowable' objects
        elements = []

        # Define styles
        styles = getSampleStyleSheet()
        style_title = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1a4d7a'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )

        style_heading = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#2d5a8c'),
            spaceAfter=6,
            spaceBefore=6,
            fontName='Helvetica-Bold'
        )

        style_normal = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#333333'),
            spaceAfter=3,
            fontName='Helvetica'
        )

        # Parse content by sections
        lines = content.split('\n')
        current_section = []

        for line in lines:
            stripped = line.strip()

            # Skip empty lines in grouping
            if not stripped:
                continue

            # Detect headings (ALL CAPS lines)
            if stripped.isupper() and len(stripped) > 3:
                # Add previous section if exists
                if current_section:
                    section_text = ' '.join(current_section)
                    try:
                        elements.append(Paragraph(section_text, style_normal))
                    except:
                        elements.append(Paragraph(section_text.replace('<', '&lt;').replace('>', '&gt;'), style_normal))
                    current_section = []

                # Add new heading
                try:
                    elements.append(Paragraph(stripped, style_heading))
                    elements.append(Spacer(1, 0.1*inch))
                except:
                    elements.append(Paragraph(stripped.replace('<', '&lt;').replace('>', '&gt;'), style_heading))
                    elements.append(Spacer(1, 0.1*inch))

            # Add line to current section
            elif stripped:
                # Handle special characters
                safe_line = stripped.replace('<', '&lt;').replace('>', '&gt;')
                current_section.append(safe_line)

        # Add any remaining section
        if current_section:
            section_text = ' '.join(current_section)
            try:
                elements.append(Paragraph(section_text, style_normal))
            except:
                elements.append(Paragraph(section_text.replace('<', '&lt;').replace('>', '&gt;'), style_normal))

        # Add some space at the end
        elements.append(Spacer(1, 0.3*inch))

        # Build PDF
        doc.build(elements)
        return True

    except Exception as e:
        print(f"❌ Error converting {input_file}: {e}")
        return False


def main():
    """Main conversion function"""

    print("=" * 70)
    print("  TEXT TO PDF CONVERTER - M4 Test Files")
    print("=" * 70)
    print()

    # Check input directory exists
    if not os.path.exists(INPUT_DIR):
        print(f"❌ Input directory not found: {INPUT_DIR}")
        return

    # Find all .txt files
    txt_files = list(Path(INPUT_DIR).glob("*.txt"))

    if not txt_files:
        print(f"❌ No .txt files found in {INPUT_DIR}")
        return

    print(f"📁 Found {len(txt_files)} text files to convert")
    print(f"📤 Output directory: {OUTPUT_DIR}")
    print()

    converted = 0
    failed = 0

    for txt_file in sorted(txt_files):
        output_file = txt_file.with_suffix('.pdf')

        # Check if PDF already exists
        if output_file.exists():
            print(f"⏭️  Skipping {txt_file.name} (PDF already exists)")
            continue

        print(f"Converting: {txt_file.name}...", end=" ", flush=True)

        if create_pdf_from_text(str(txt_file), str(output_file)):
            file_size = os.path.getsize(output_file) / 1024  # Size in KB
            print(f"✅ Created ({file_size:.1f} KB)")
            converted += 1
        else:
            print(f"❌ Failed")
            failed += 1

    print()
    print("=" * 70)
    print(f"  CONVERSION COMPLETE")
    print("=" * 70)
    print(f"✅ Successfully converted: {converted}")
    print(f"❌ Failed: {failed}")
    print()

    # List all PDF files
    pdf_files = list(Path(OUTPUT_DIR).glob("*.pdf"))
    if pdf_files:
        print("📄 Available PDF Files:")
        for pdf_file in sorted(pdf_files):
            size_kb = os.path.getsize(pdf_file) / 1024
            print(f"   ✓ {pdf_file.name} ({size_kb:.1f} KB)")

    print()
    print("🎉 Ready to test! Use these PDF files in the application.")
    print()


if __name__ == "__main__":
    main()

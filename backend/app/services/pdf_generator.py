import os
from reportlab.lib.pagesizes import A5, portrait
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.core.config import settings

def generate_receipt_pdf(receipt_data: dict, output_path: str) -> None:
    # Read custom elements coordinates if provided
    elements_config = receipt_data.get("elements")
    
    # If no elements layout custom config is provided, fall back to standard A5 receipt layout
    if not elements_config:
        doc = SimpleDocTemplate(
            output_path,
            pagesize=portrait(A5),
            rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('ReceiptTitle', parent=styles['Heading2'], textColor=colors.HexColor("#1e1b4b"), alignment=1, spaceAfter=10)
        org_style = ParagraphStyle('OrgHeader', parent=styles['Heading1'], textColor=colors.HexColor("#4f46e5"), alignment=1, fontSize=18, spaceAfter=5)
        body_label = ParagraphStyle('BodyLabel', parent=styles['Normal'], textColor=colors.HexColor("#4b5563"), fontSize=10, bold=True)
        body_val = ParagraphStyle('BodyValue', parent=styles['Normal'], textColor=colors.HexColor("#111827"), fontSize=10)
        
        story = []
        story.append(Paragraph(receipt_data.get("org_name", "Association"), org_style))
        story.append(Paragraph(f"{receipt_data.get('festival_name', 'Festival')} - {receipt_data.get('year', '2026')}", ParagraphStyle('Sub', parent=styles['Normal'], alignment=1, textColor=colors.HexColor("#6b7280"), spaceAfter=15)))
        story.append(Paragraph("DONATION RECEIPT", title_style))
        story.append(Spacer(1, 10))
        
        donor_address_str = receipt_data.get("donor_address") or "N/A"
        notes_str = receipt_data.get("notes") or ""
        
        data = [
            [Paragraph("Receipt No:", body_label), Paragraph(receipt_data.get("receipt_number", "") or "", body_val),
             Paragraph("Date:", body_label), Paragraph(receipt_data.get("date", "") or "", body_val)],
            [Paragraph("Donor Name:", body_label), Paragraph(receipt_data.get("donor_name", "") or "", body_val),
             Paragraph("Mobile:", body_label), Paragraph(receipt_data.get("donor_mobile", "") or "", body_val)],
            [Paragraph("Address:", body_label), Paragraph(donor_address_str, body_val),
             Paragraph("Category:", body_label), Paragraph(receipt_data.get("category", "") or "", body_val)],
            [Paragraph("Payment Method:", body_label), Paragraph(receipt_data.get("payment_method", "") or "", body_val),
             Paragraph("Amount:", body_label), Paragraph(f"INR {receipt_data.get('amount', '0.00')}", ParagraphStyle('Amt', parent=body_val, textColor=colors.HexColor("#059669"), fontSize=11, bold=True))]
        ]
        if notes_str:
            data.append([Paragraph("Notes:", body_label), Paragraph(notes_str, body_val), Paragraph("", body_label), Paragraph("", body_val)])
            
        table = Table(data, colWidths=[1.1*inch, 1.7*inch, 0.9*inch, 1.8*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f9fafb")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ]))
        story.append(table)
        story.append(Spacer(1, 40))
        
        footer_data = [
            [Paragraph("Thank you for your generous contribution!", ParagraphStyle('Thanks', parent=styles['Italic'], textColor=colors.HexColor("#6b7280"))), 
             Paragraph("Authorized Signature<br/><br/>", ParagraphStyle('Sign', parent=styles['Normal'], alignment=2, textColor=colors.HexColor("#374151")))]
        ]
        footer_table = Table(footer_data, colWidths=[3.0*inch, 2.5*inch])
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('PADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(footer_table)
        doc.build(story)
        return

    # Decode/write background base64 payload to temporary file to read dimension parameters
    bg_image_url = receipt_data.get("background")
    bg_temp_file = None
    
    if bg_image_url and bg_image_url.startswith("data:image/"):
        try:
            import base64
            header, data = bg_image_url.split(",", 1)
            img_data = base64.b64decode(data)
            bg_temp_file = f"temp_bg_{receipt_data.get('receipt_number', 'img')}.png"
            with open(bg_temp_file, "wb") as f:
                f.write(img_data)
        except Exception:
            pass

    # Setup layout dimension. Proportional landscape or default A5 portrait
    pdf_width, pdf_height = portrait(A5)
    
    if bg_temp_file:
        try:
            # Dynamically read template image aspect ratio dimensions to prevent squeezing
            from reportlab.lib.utils import ImageReader
            img = ImageReader(bg_temp_file)
            w, h = img.getSize()
            # Set canvas width/height matching the background template aspect ratio
            aspect = w / float(h)
            # Retain standard width and compute dynamic proportional height
            pdf_width = 420.0
            pdf_height = 420.0 / aspect
        except Exception:
            pass

    c = canvas.Canvas(output_path, pagesize=(pdf_width, pdf_height))
    width, height = pdf_width, pdf_height
    
    # 1. Draw custom background template design image if uploaded/present
    if bg_temp_file:
        c.drawImage(bg_temp_file, 0, 0, width, height)
    elif bg_image_url and os.path.exists(bg_image_url):
        c.drawImage(bg_image_url, 0, 0, width, height)
    else:
        # Fallback to premium background gradient or color block instead of plain white
        c.setFillColor(colors.HexColor("#f8fafc"))
        c.rect(0, 0, width, height, fill=True, stroke=False)
        c.setFillColor(colors.HexColor("#4f46e5"))
        c.rect(0, height - 10, width, 10, fill=True, stroke=False)
        
    # Render mapped keys dynamically
    # Canvas visual preview sandbox is 480 x 320. ReportLab A5 document is width x height.
    # We map coordinates proportionally to match the exact placement!
    scale_x = width / 480.0
    scale_y = height / 320.0
    
    logo_temp_file = None
    for key, val in elements_config.items():
        if not val.get("visible"):
            continue
        
        # Scale visual builder coordinates onto the ReportLab document page layout
        x = float(val.get("x", 40)) * scale_x
        y = height - (float(val.get("y", 100)) * scale_y) - 15
        font_size = int(val.get("fontSize", 12))
        
        # Determine customized font family styles
        selected_font = val.get("font", "Helvetica")
        if selected_font == "Times-Roman":
            font_name = "Times-Bold" if any(k in key for k in ["amount", "number", "logo_text", "banner_text"]) else "Times-Roman"
        elif selected_font == "Courier":
            font_name = "Courier-Bold" if any(k in key for k in ["amount", "number", "logo_text", "banner_text"]) else "Courier"
        else:
            font_name = "Helvetica-Bold" if any(k in key for k in ["amount", "number", "logo_text", "banner_text"]) else "Helvetica"
            
        c.setFont(font_name, font_size)
        
        # Apply customized text coloring
        hex_color = val.get("color", "#0f172a")
        c.setFillColor(colors.HexColor(hex_color))
        
        # Match template key text representation value dynamically
        display_val = ""
        if key == "org_name":
            display_val = receipt_data.get("org_name") or "Vinayaka Festival Committee"
        elif key == "festival_name":
            display_val = receipt_data.get("festival_name") or "Ganesh Chaturthi"
        elif key == "event_name":
            display_val = receipt_data.get("event_name") or "Ganesh Utsav"
        elif key == "org_address":
            display_val = receipt_data.get("org_address") or "Colony Park, Phase 1"
        elif key == "contact_number":
            display_val = f"Contact: {receipt_data.get('contact_number') or '9876543210'}"
        elif key == "email_address":
            display_val = receipt_data.get("email_address") or "contact@vinayaka.org"
        elif key == "website":
            display_val = receipt_data.get("website") or "www.vinayaka.org"
        elif key == "receipt_number":
            display_val = f"Receipt No: {receipt_data.get('receipt_number', '')}"
        elif key == "receipt_date":
            display_val = f"Date: {receipt_data.get('date', '').split(' ')[0]}"
        elif key == "receipt_time":
            time_parts = receipt_data.get('date', '').split(' ')
            display_val = f"Time: {time_parts[1] if len(time_parts) > 1 else '09:00'}"
        elif key == "financial_year":
            display_val = f"FY: {receipt_data.get('year') or '2026'}"
        elif key == "donor_name":
            display_val = f"Donor: {receipt_data.get('donor_name', '')}"
        elif key == "donor_mobile":
            display_val = f"Mobile: {receipt_data.get('donor_mobile', '')}"
        elif key == "donor_address":
            display_val = f"Address: {receipt_data.get('donor_address') or 'N/A'}"
        elif key == "fathers_name":
            fathers_val = receipt_data.get("custom_values", {}).get("fathers_name") or "N/A"
            display_val = f"S/O: {fathers_val}"
        elif key == "amount":
            display_val = f"Amount: INR {receipt_data.get('amount', '')}"
        elif key == "amount_in_words":
            # Convert raw numerical amount parameter to standard words string representation
            try:
                amt_str = receipt_data.get('amount', '0').replace(',', '')
                val_num = int(float(amt_str))
                
                # Simple integer-to-words translator array
                ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
                        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
                tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
                
                def num_to_words_helper(n):
                    if n < 20:
                        return ones[n]
                    elif n < 100:
                        return tens[n // 10] + (" " + ones[n % 10] if n % 10 != 0 else "")
                    elif n < 1000:
                        return ones[n // 100] + " Hundred" + (" and " + num_to_words_helper(n % 100) if n % 100 != 0 else "")
                    elif n < 100000:
                        return num_to_words_helper(n // 1000) + " Thousand" + (" " + num_to_words_helper(n % 1000) if n % 1000 != 0 else "")
                    return str(n)
                
                words = num_to_words_helper(val_num)
                display_val = f"{words} Rupees Only" if words else "Zero Rupees Only"
            except Exception:
                display_val = "Rupees Only"
        elif key == "donation_category":
            display_val = f"Category: {receipt_data.get('category', '')}"
        elif key == "donation_purpose":
            display_val = f"Purpose: {receipt_data.get('category', '')}"
        elif key == "payment_method":
            display_val = f"Method: {receipt_data.get('payment_method', '')}"
        elif key == "transaction_id":
            tx_id = receipt_data.get("custom_values", {}).get("transaction_id") or "N/A"
            display_val = f"Txn ID: {tx_id}"
        elif key == "bank_name":
            b_name = receipt_data.get("custom_values", {}).get("bank_name") or "N/A"
            display_val = f"Bank: {b_name}"
        elif key == "qr_code":
            # Proportional visual QR code block indicator
            display_val = "[ QR Code Verified ]"
        elif key == "receipt_status":
            display_val = "Status: ISSUED"
        elif key == "president_signature":
            display_val = "President Signature: _________"
        elif key == "treasurer_signature":
            display_val = "Treasurer Signature: _________"
        elif key == "authorized_signature":
            display_val = "Authorized Signature: _________"
        elif key == "thank_you_message":
            display_val = "Thank you for your generous contribution!"
        elif key == "logo":
            # If custom logo image base64 data is present, decode and render it on canvas instead of default emoji
            logo_data = val.get("logoData")
            if logo_data and logo_data.startswith("data:image/"):
                try:
                    import base64
                    header, img_payload = logo_data.split(",", 1)
                    decoded_logo = base64.b64decode(img_payload)
                    logo_temp_file = f"temp_logo_{receipt_data.get('receipt_number', 'logo')}.png"
                    with open(logo_temp_file, "wb") as f:
                        f.write(decoded_logo)
                    # Proportional logo size layout
                    c.drawImage(logo_temp_file, x, y, width=32 * scale_x, height=32 * scale_y, mask='auto')
                except Exception:
                    c.drawString(x, y, "🕉️")
                continue
            else:
                display_val = "🕉️"
        else:
            # Custom custom_values key lookup
            val_from_custom = receipt_data.get("custom_values", {}).get(key, "")
            display_val = f"{key.replace('_', ' ').capitalize()}: {val_from_custom}"
            
        c.drawString(x, y, display_val)
        
    c.showPage()
    c.save()
    
    # Cleanup temp base64 background and logo image files if created
    for temp_f in [bg_temp_file, logo_temp_file]:
        if temp_f and os.path.exists(temp_f):
            try:
                os.remove(temp_f)
            except Exception:
                pass


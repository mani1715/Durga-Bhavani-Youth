import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import (
    User, Receipt, Donor, ReceiptSequence, Organization, Event, DonationCategory, ReceiptTemplate
)
from app.models.schemas import ReceiptCreate, ReceiptResponse, ReceiptCancelRequest, ReceiptDownloadRequest, ReceiptUpdate
from app.services.pdf_generator import generate_receipt_pdf
from app.services.audit import write_audit_log
from app.services.storage import get_storage_service
from app.services.cache import public_cache

router = APIRouter(prefix="/receipts", tags=["Receipts"])

@router.get("/verify/{receipt_number}")
def verify_receipt(
    receipt_number: str,
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.receipt_number == receipt_number).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    donor_name = receipt.donor.name if receipt.donor else "Unknown"
    parts = donor_name.split()
    if len(parts) > 1:
        masked_name = f"{parts[0]} {parts[-1][0]}."
    else:
        masked_name = f"{donor_name[:3]}***" if len(donor_name) > 3 else donor_name
        
    return {
        "receipt_number": receipt.receipt_number,
        "receipt_date": receipt.receipt_date,
        "donor_name": masked_name,
        "amount": float(receipt.amount),
        "organization_name": receipt.organization.name if receipt.organization else "Unknown",
        "status": receipt.status
    }


@router.post("", response_model=ReceiptResponse)
def create_receipt(
    request: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"]))
):
    org_id = current_user.organization_id

    # 0. Idempotency Check
    if request.idempotency_key and request.idempotency_key.strip():
        existing_receipt = db.query(Receipt).filter(
            Receipt.organization_id == org_id,
            Receipt.idempotency_key == request.idempotency_key.strip()
        ).first()
        if existing_receipt:
            d = existing_receipt.donor
            return {
                "id": existing_receipt.id,
                "organization_id": existing_receipt.organization_id,
                "event_id": existing_receipt.event_id,
                "donor_id": existing_receipt.donor_id,
                "donor_name": d.name if d else (existing_receipt.donor_name_telugu or "N/A"),
                "donor_name_english": existing_receipt.donor_name_english or (d.name_english if d else None),
                "donor_name_telugu": existing_receipt.donor_name_telugu or (d.name_telugu if d else None),
                "village_english": existing_receipt.village_english or (d.village_english if d else None),
                "village_telugu": existing_receipt.village_telugu or (d.village_telugu if d else None),
                "donor_mobile": d.mobile if d else "",
                "receipt_number": existing_receipt.receipt_number,
                "receipt_sequence": existing_receipt.receipt_sequence,
                "receipt_date": existing_receipt.receipt_date,
                "amount": existing_receipt.amount,
                "donation_category_id": existing_receipt.donation_category_id,
                "payment_method": existing_receipt.payment_method,
                "status": existing_receipt.status,
                "notes": existing_receipt.notes,
                "custom_values": existing_receipt.custom_values,
                "template_id": existing_receipt.template_id,
                "pdf_storage_key": existing_receipt.pdf_storage_key,
                "image_storage_key": existing_receipt.image_storage_key,
                "is_anonymous": existing_receipt.is_anonymous,
                "is_test": existing_receipt.is_test,
                "created_by": existing_receipt.created_by,
                "created_at": existing_receipt.created_at,
                "cancelled_at": existing_receipt.cancelled_at,
                "cancelled_by": existing_receipt.cancelled_by,
                "cancellation_reason": existing_receipt.cancellation_reason
            }

    try:
        # 1. Resolve/Create Donor inside transaction
        donor_id = request.donor_id
        name_te = request.donor_name_telugu.strip() if (request.donor_name_telugu and request.donor_name_telugu.strip()) else None
        name_en = request.donor_name_english.strip() if (request.donor_name_english and request.donor_name_english.strip()) else None
        base_name = request.donor_name.strip() if (request.donor_name and request.donor_name.strip() and request.donor_name != "undefined" and request.donor_name != "N/A") else None
        dname_val = name_te or name_en or base_name or "Anonymous Donor"

        if not donor_id:
            mobile_val = request.donor_mobile if (request.donor_mobile and request.donor_mobile != "undefined") else "0000000000"
            donor = db.query(Donor).filter(
                Donor.organization_id == org_id,
                Donor.mobile == mobile_val
            ).first()
            
            if not donor:
                donor = Donor(
                    organization_id=org_id,
                    name=dname_val,
                    name_english=name_en or base_name,
                    name_telugu=name_te,
                    village_english=request.village_english,
                    village_telugu=request.village_telugu,
                    mobile=mobile_val,
                    email=request.donor_email,
                    address=request.donor_address
                )
                db.add(donor)
                db.flush()  # Allocate ID
            else:
                if dname_val and dname_val not in ("N/A", "Anonymous Donor"):
                    donor.name = dname_val
                if name_en:
                    donor.name_english = name_en
                if name_te:
                    donor.name_telugu = name_te
                if request.village_english:
                    donor.village_english = request.village_english
                if request.village_telugu:
                    donor.village_telugu = request.village_telugu
                db.flush()
            donor_id = donor.id
        else:
            donor = db.query(Donor).filter(Donor.id == donor_id, Donor.organization_id == org_id).first()
            if not donor:
                raise HTTPException(status_code=404, detail="Selected donor not found")
            if dname_val and dname_val not in ("N/A", "Anonymous Donor"):
                donor.name = dname_val
            if name_en:
                donor.name_english = name_en
            if name_te:
                donor.name_telugu = name_te
            if request.village_english:
                donor.village_english = request.village_english
            if request.village_telugu:
                donor.village_telugu = request.village_telugu
            db.flush()

        # Validate Event & Category
        event = db.query(Event).filter(Event.id == request.event_id, Event.organization_id == org_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Selected event not found")
            
        category = db.query(DonationCategory).filter(
            DonationCategory.id == request.donation_category_id,
            DonationCategory.organization_id == org_id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Selected category not found")

        # 2. Concurrency-Safe Receipt Number Generation with Synchronization
        fy = event.financial_year or "2026"
        seq_row = db.query(ReceiptSequence).filter(
            ReceiptSequence.organization_id == org_id,
            ReceiptSequence.financial_year == fy
        ).with_for_update().first()
        
        # Check actual max existing sequence in receipts table for this event/org
        max_existing = db.query(func.max(Receipt.receipt_sequence)).filter(
            Receipt.organization_id == org_id,
            Receipt.event_id == request.event_id
        ).scalar() or 0

        if not seq_row:
            seq_row = ReceiptSequence(organization_id=org_id, financial_year=fy, current_value=max_existing)
            db.add(seq_row)
            db.flush()
        else:
            if seq_row.current_value < max_existing:
                seq_row.current_value = max_existing
            
        seq_row.current_value += 1
        next_seq = seq_row.current_value
        
        # Format: GVF-2026-000001
        org = db.query(Organization).filter(Organization.id == org_id).first()
        prefix = org.slug.upper() if org and org.slug else "ORG"
        receipt_number = f"{prefix}-{fy}-{next_seq:06d}"

        # 3. Create Receipt
        receipt = Receipt(
            organization_id=org_id,
            event_id=request.event_id,
            donor_id=donor_id,
            receipt_number=receipt_number,
            receipt_sequence=next_seq,
            receipt_date=datetime.utcnow(),
            amount=request.amount,
            donation_category_id=request.donation_category_id,
            payment_method=request.payment_method,
            status="ISSUED",
            notes=request.notes,
            custom_values=request.custom_values,
            template_id=request.template_id,
            donor_name_english=name_en or (donor.name_english if donor else None),
            donor_name_telugu=name_te or (donor.name_telugu if donor else None),
            village_english=request.village_english or (donor.village_english if donor else None),
            village_telugu=request.village_telugu or (donor.village_telugu if donor else None),
            idempotency_key=request.idempotency_key.strip() if request.idempotency_key else None,
            is_anonymous=bool(request.is_anonymous),
            public_display_name="అజ్ఞాత దాత" if request.is_anonymous else (name_te or (donor.name_telugu if donor else None) or donor.name),
            is_test=bool(request.is_test),
            created_by=current_user.id
        )
        
        db.add(receipt)
        db.flush()  # Allocate ID
        
        # 4. PDF Generation & Storage (Protected against storage failure)
        try:
            storage = get_storage_service()
            template = None
            if receipt.template_id:
                template = db.query(ReceiptTemplate).filter(ReceiptTemplate.id == receipt.template_id).first()
            else:
                template = db.query(ReceiptTemplate).filter(
                    ReceiptTemplate.organization_id == org_id,
                    ReceiptTemplate.is_active == True
                ).first()

            layout_elements = request.template_elements if request.template_elements else (template.elements if template else None)
            layout_background = request.template_background if request.template_background else (template.background_key if template else None)

            pdf_payload = {
                "org_name": request.org_name if request.org_name else (org.name if org else "Vinayaka Festival Committee"),
                "festival_name": org.festival_name if org else "Ganesh Utsav",
                "year": org.year if org else "2026",
                "receipt_number": receipt_number,
                "date": receipt.receipt_date.strftime("%Y-%m-%d %H:%M"),
                "donor_name": donor.name if donor else "N/A",
                "donor_mobile": donor.mobile if donor else "",
                "donor_address": donor.address if donor else "",
                "category": category.name if category else "",
                "payment_method": receipt.payment_method,
                "amount": f"{receipt.amount:,.2f}",
                "notes": receipt.notes,
                "elements": layout_elements,
                "background": layout_background,
                "logo_text": request.logo_text if request.logo_text else (org.name if org else "Vinayaka Festival Committee"),
                "org_address": request.org_address if request.org_address else (org.address if org else "Colony Park, Phase 1"),
                "contact_number": request.contact_number if request.contact_number else "9876543210",
                "email_address": request.email_address if request.email_address else "contact@vinayaka.org",
                "thank_you_message": request.thank_you_message if request.thank_you_message else "Thank you for your generous contribution!",
                "custom_values": request.custom_values
            }
            
            temp_pdf_path = f"temp_receipt_{receipt.id}.pdf"
            try:
                generate_receipt_pdf(pdf_payload, temp_pdf_path)
                from fastapi import UploadFile
                with open(temp_pdf_path, "rb") as f:
                    from io import BytesIO
                    upload_file = UploadFile(file=BytesIO(f.read()), filename=f"receipt_{receipt_number}.pdf")
                    storage_key = storage.save_file(upload_file, org_id, "receipts")
                    receipt.pdf_storage_key = storage_key
            finally:
                if os.path.exists(temp_pdf_path):
                    os.remove(temp_pdf_path)
        except Exception as storage_err:
            logger.warning(f"PDF generation or storage upload skipped: {storage_err}")

        # 5. Audit Log Inside Same Transaction
        write_audit_log(
            db, org_id, current_user.id, "CREATE", "Receipt", receipt.id,
            new_value={"receipt_number": receipt_number, "amount": str(receipt.amount), "is_test": receipt.is_test}
        )
        
        db.commit()
        db.refresh(receipt)
        return {
            "id": receipt.id,
            "organization_id": receipt.organization_id,
            "event_id": receipt.event_id,
            "donor_id": receipt.donor_id,
            "donor_name": donor.name if donor else (request.donor_name or "N/A"),
            "donor_name_english": receipt.donor_name_english or (donor.name_english if donor else None),
            "donor_name_telugu": receipt.donor_name_telugu or (donor.name_telugu if donor else None),
            "village_english": receipt.village_english or (donor.village_english if donor else None),
            "village_telugu": receipt.village_telugu or (donor.village_telugu if donor else None),
            "donor_mobile": donor.mobile if donor else (request.donor_mobile or ""),
            "receipt_number": receipt.receipt_number,
            "receipt_sequence": receipt.receipt_sequence,
            "receipt_date": receipt.receipt_date,
            "amount": receipt.amount,
            "donation_category_id": receipt.donation_category_id,
            "payment_method": receipt.payment_method,
            "status": receipt.status,
            "notes": receipt.notes,
            "custom_values": receipt.custom_values,
            "template_id": receipt.template_id,
            "pdf_storage_key": receipt.pdf_storage_key,
            "image_storage_key": receipt.image_storage_key,
            "is_anonymous": receipt.is_anonymous,
            "is_test": receipt.is_test,
            "created_by": receipt.created_by,
            "created_at": receipt.created_at,
            "cancelled_at": receipt.cancelled_at,
            "cancelled_by": receipt.cancelled_by,
            "cancellation_reason": receipt.cancellation_reason
        }
        public_cache.invalidate("public:donations")
        return res
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        err_id = str(uuid.uuid4())[:8]
        logger.error(f"Receipt creation failed [{err_id}]: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"విరాళం నమోదు ప్రక్రియలో లోపం ఏర్పడింది. (Error Ref: {err_id})"
        )

@router.get("")
def get_receipts(
    event_id: Optional[str] = None,
    category_id: Optional[str] = None,
    sort: Optional[str] = "highest",
    search: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    query = db.query(Receipt, Donor).outerjoin(Donor, Receipt.donor_id == Donor.id).filter(Receipt.organization_id == org_id)
    
    if event_id:
        query = query.filter(Receipt.event_id == event_id)

    if category_id:
        query = query.filter(Receipt.donation_category_id == category_id)
        
    if search:
        query = query.filter(
            (Receipt.receipt_number.ilike(f"%{search}%")) |
            (Donor.name.ilike(f"%{search}%")) |
            (Donor.mobile.ilike(f"%{search}%"))
        )
        
    if sort == "highest":
        results = query.order_by(Receipt.amount.desc(), Receipt.receipt_date.desc(), Receipt.id.desc()).all()
    else:
        results = query.order_by(Receipt.created_at.desc(), Receipt.id.desc()).all()
    output = []
    for receipt, donor in results:
        c_vals = receipt.custom_values if (receipt.custom_values and isinstance(receipt.custom_values, dict)) else {}
        d_name = (donor.name if (donor and donor.name and donor.name != "N/A" and donor.name != "undefined") else None) or c_vals.get("donor_name") or "N/A"
        d_mobile = (donor.mobile if (donor and donor.mobile and donor.mobile != "undefined") else None) or c_vals.get("donor_mobile") or ""

        r_dict = {
            "id": receipt.id,
            "organization_id": receipt.organization_id,
            "event_id": receipt.event_id,
            "donor_id": receipt.donor_id,
            "donor_name": d_name,
            "donor_name_english": receipt.donor_name_english or (donor.name_english if donor else None),
            "donor_name_telugu": receipt.donor_name_telugu or (donor.name_telugu if donor else None),
            "village_english": receipt.village_english or (donor.village_english if donor else None),
            "village_telugu": receipt.village_telugu or (donor.village_telugu if donor else None),
            "donor_mobile": d_mobile,
            "is_anonymous": receipt.is_anonymous,
            "is_test": receipt.is_test,
            "receipt_number": receipt.receipt_number,
            "receipt_sequence": receipt.receipt_sequence,
            "receipt_date": receipt.receipt_date,
            "amount": receipt.amount,
            "donation_category_id": receipt.donation_category_id,
            "payment_method": receipt.payment_method,
            "status": receipt.status,
            "notes": receipt.notes,
            "custom_values": receipt.custom_values,
            "template_id": receipt.template_id,
            "pdf_storage_key": receipt.pdf_storage_key,
            "image_storage_key": receipt.image_storage_key,
            "created_by": receipt.created_by,
            "created_at": receipt.created_at,
            "cancelled_at": receipt.cancelled_at,
            "cancelled_by": receipt.cancelled_by,
            "cancellation_reason": receipt.cancellation_reason
        }
        output.append(r_dict)
    return output

@router.post("/{receipt_id}/cancel", response_model=ReceiptResponse)
def cancel_receipt(
    receipt_id: str,
    request: ReceiptCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    receipt = db.query(Receipt).filter(
        Receipt.id == receipt_id,
        Receipt.organization_id == org_id
    ).with_for_update().first()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    if receipt.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Receipt is already cancelled")
        
    old_val = {"status": receipt.status}
    
    receipt.status = "CANCELLED"
    receipt.cancelled_at = datetime.utcnow()
    receipt.cancelled_by = current_user.id
    receipt.cancellation_reason = request.reason
    
    write_audit_log(
        db, org_id, current_user.id, "CANCEL", "Receipt", receipt.id,
        previous_value=old_val, new_value={"status": "CANCELLED", "reason": request.reason}
    )
    
    db.commit()
    db.refresh(receipt)
    public_cache.invalidate("public:donations")
    return receipt

@router.delete("/{receipt_id}")
def delete_receipt(
    receipt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    receipt = db.query(Receipt).filter(
        Receipt.id == receipt_id,
        Receipt.organization_id == org_id
    ).first()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    write_audit_log(
        db, org_id, current_user.id, "DELETE", "Receipt", receipt.id,
        previous_value={"receipt_number": receipt.receipt_number, "amount": str(receipt.amount)}
    )
    db.delete(receipt)
    db.commit()
    public_cache.invalidate("public:donations")
    return {"message": "Receipt deleted successfully"}

@router.put("/{receipt_id}", response_model=ReceiptResponse)
def update_receipt(
    receipt_id: str,
    request: ReceiptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"]))
):
    org_id = current_user.organization_id
    receipt = db.query(Receipt).filter(
        Receipt.id == receipt_id,
        Receipt.organization_id == org_id
    ).first()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    old_val = {
        "amount": str(receipt.amount),
        "notes": receipt.notes,
        "payment_method": receipt.payment_method
    }
    
    receipt.amount = request.amount
    receipt.donation_category_id = request.donation_category_id
    receipt.payment_method = request.payment_method
    receipt.notes = request.notes
    if request.custom_values:
        receipt.custom_values = request.custom_values
        
    donor = db.query(Donor).filter(Donor.id == receipt.donor_id).first()
    if donor:
        if request.donor_name:
            donor.name = request.donor_name
        if request.donor_mobile:
            donor.mobile = request.donor_mobile

    db.commit()
    db.refresh(receipt)
    if donor:
        db.refresh(donor)
    
    write_audit_log(
        db, org_id, current_user.id, "UPDATE", "Receipt", receipt.id,
        previous_value=old_val,
        new_value={
            "amount": str(receipt.amount),
            "notes": receipt.notes,
            "payment_method": receipt.payment_method
        }
    )
    
    # Re-render the PDF document using modified values
    category = db.query(DonationCategory).filter(DonationCategory.id == receipt.donation_category_id).first()
    org = db.query(Organization).filter(Organization.id == org_id).first()
    template = db.query(ReceiptTemplate).filter(
        ReceiptTemplate.organization_id == org_id,
        ReceiptTemplate.is_active == True
    ).first()
    
    pdf_payload = {
        "org_name": org.name if org else "Vinayaka Festival Committee",
        "festival_name": org.festival_name if org else "Ganesh Chaturthi",
        "year": org.year if org else "2026",
        "receipt_number": receipt.receipt_number,
        "date": receipt.receipt_date.strftime("%Y-%m-%d %H:%M"),
        "donor_name": donor.name if donor else "N/A",
        "donor_mobile": donor.mobile if donor else "",
        "donor_address": donor.address if donor else "",
        "category": category.name if category else "",
        "payment_method": receipt.payment_method,
        "amount": f"{receipt.amount:,.2f}",
        "notes": receipt.notes,
        "elements": template.elements if template else None,
        "background": template.background_key if template else None,
        "logo_text": org.name if org else "",
        "banner_text": f"{org.festival_name if org else ''} celebrations",
        "custom_values": receipt.custom_values
    }

    storage = get_storage_service()
    temp_pdf_path = f"temp_update_{receipt.id}.pdf"
    try:
        generate_receipt_pdf(pdf_payload, temp_pdf_path)
        from fastapi import UploadFile
        from io import BytesIO
        with open(temp_pdf_path, "rb") as f:
            upload_file = UploadFile(file=BytesIO(f.read()), filename=f"receipt_{receipt.receipt_number}.pdf")
            storage_key = storage.save_file(upload_file, org_id, "receipts")
            receipt.pdf_storage_key = storage_key
            db.commit()
    except Exception:
        pass
    finally:
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
            
    return {
        "id": receipt.id,
        "organization_id": receipt.organization_id,
        "event_id": receipt.event_id,
        "donor_id": receipt.donor_id,
        "donor_name": donor.name if donor else (request.donor_name or "N/A"),
        "donor_mobile": donor.mobile if donor else (request.donor_mobile or ""),
        "receipt_number": receipt.receipt_number,
        "receipt_sequence": receipt.receipt_sequence,
        "receipt_date": receipt.receipt_date,
        "amount": receipt.amount,
        "donation_category_id": receipt.donation_category_id,
        "payment_method": receipt.payment_method,
        "status": receipt.status,
        "notes": receipt.notes,
        "custom_values": receipt.custom_values,
        "template_id": receipt.template_id,
        "pdf_storage_key": receipt.pdf_storage_key,
        "image_storage_key": receipt.image_storage_key,
        "created_by": receipt.created_by,
        "created_at": receipt.created_at,
        "cancelled_at": receipt.cancelled_at,
        "cancelled_by": receipt.cancelled_by,
        "cancellation_reason": receipt.cancellation_reason
    }

@router.post("/{receipt_id}/download")
def download_receipt(
    receipt_id: str,
    request: ReceiptDownloadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    receipt = db.query(Receipt).filter(
        Receipt.id == receipt_id,
        Receipt.organization_id == org_id
    ).first()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    donor = db.query(Donor).filter(Donor.id == receipt.donor_id).first()
    category = db.query(DonationCategory).filter(DonationCategory.id == receipt.donation_category_id).first()
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    # Query layout template configurations
    template = db.query(ReceiptTemplate).filter(
        ReceiptTemplate.organization_id == org_id,
        ReceiptTemplate.is_active == True
    ).first()

    # Override template layout configurations with values sent from client designer
    layout_elements = request.template_elements if request.template_elements else (template.elements if template else None)
    layout_background = request.template_background if request.template_background else (template.background_key if template else None)

    # Re-render the PDF file dynamically to match modified template layout structures instantly
    pdf_payload = {
        "org_name": request.org_name if request.org_name else (org.name if org else "Vinayaka Festival Committee"),
        "festival_name": org.festival_name if org else "Ganesh Utsav",
        "year": org.year if org else "2026",
        "receipt_number": receipt.receipt_number,
        "date": receipt.receipt_date.strftime("%Y-%m-%d %H:%M"),
        "donor_name": donor.name if donor else "N/A",
        "donor_mobile": donor.mobile if donor else "",
        "donor_address": donor.address if donor else "",
        "category": category.name if category else "",
        "payment_method": receipt.payment_method,
        "amount": f"{receipt.amount:,.2f}",
        "notes": receipt.notes,
        "elements": layout_elements,
        "background": layout_background,
        "logo_text": request.logo_text if request.logo_text else (org.name if org else "Vinayaka Festival Committee"),
        "org_address": request.org_address if request.org_address else (org.address if org else "Colony Park, Phase 1"),
        "contact_number": request.contact_number if request.contact_number else "9876543210",
        "email_address": request.email_address if request.email_address else "contact@vinayaka.org",
        "thank_you_message": request.thank_you_message if request.thank_you_message else "Thank you for your generous contribution!",
        "custom_values": receipt.custom_values
    }

    storage = get_storage_service()
    temp_pdf_path = f"temp_download_{receipt.id}.pdf"
    try:
        generate_receipt_pdf(pdf_payload, temp_pdf_path)
        
        # Upload dynamically to storage key
        from fastapi import UploadFile
        with open(temp_pdf_path, "rb") as f:
            from io import BytesIO
            upload_file = UploadFile(file=BytesIO(f.read()), filename=f"receipt_{receipt.receipt_number}.pdf")
            storage_key = storage.save_file(upload_file, org_id, "receipts")
            receipt.pdf_storage_key = storage_key
            db.commit()
    finally:
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)

    url = storage.get_file_url(receipt.pdf_storage_key)
    return {"url": url}

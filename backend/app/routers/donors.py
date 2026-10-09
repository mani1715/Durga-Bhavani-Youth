from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import User, Donor, Receipt, DonationCategory
from app.models.schemas import DonorCreate, DonorResponse

from pydantic import BaseModel
from app.services.transliteration import get_transliteration_provider

router = APIRouter(prefix="/donors", tags=["donors"])

class TransliterateRequest(BaseModel):
    text: str

@router.post("/transliterate")
def transliterate_donor_name(
    request: TransliterateRequest,
    current_user: User = Depends(get_current_user)
):
    provider = get_transliteration_provider()
    suggestions = provider.transliterate_to_telugu(request.text)
    return {
        "text": request.text,
        "suggestions": suggestions,
        "primary_suggestion": suggestions[0] if suggestions else ""
    }

@router.post("", response_model=DonorResponse)
def create_donor(
    request: DonorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"]))
):
    org_id = current_user.organization_id
    
    # Check for possible duplicates by mobile within same organization
    existing = db.query(Donor).filter(
        Donor.organization_id == org_id,
        Donor.mobile == request.mobile
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Existing donor with this mobile number already exists."
        )
        
    donor = Donor(
        organization_id=org_id,
        name=request.name or request.name_telugu or request.name_english or "Anonymous",
        name_english=request.name_english,
        name_telugu=request.name_telugu,
        village_english=request.village_english,
        village_telugu=request.village_telugu,
        mobile=request.mobile,
        email=request.email,
        address=request.address
    )
    
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return donor

@router.get("", response_model=List[DonorResponse])
def get_donors(
    search: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    query = db.query(Donor).filter(Donor.organization_id == org_id)
    
    if search:
        query = query.filter(
            (Donor.name.ilike(f"%{search}%")) | 
            (Donor.mobile.ilike(f"%{search}%"))
        )
        
    results = query.all()
    from sqlalchemy import func
    # Batch calculate totals in a single query instead of N sequential round-trips
    totals_query = db.query(
        Receipt.donor_id,
        func.sum(Receipt.amount).label("total")
    ).filter(
        Receipt.organization_id == org_id,
        Receipt.status == "ISSUED",
        Receipt.donor_id.isnot(None)
    ).group_by(Receipt.donor_id).all()
    total_map = {row.donor_id: row.total for row in totals_query}

    for d in results:
        d.total_contribution = total_map.get(d.id, 0)
        
    return results

@router.get("/{donor_id}")
def get_donor_profile(
    donor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    donor = db.query(Donor).filter(
        Donor.id == donor_id,
        Donor.organization_id == org_id
    ).first()
    
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
        
    # Calculate donor profile dynamically from ISSUED receipts
    receipts = db.query(Receipt).filter(
        Receipt.donor_id == donor_id,
        Receipt.status == "ISSUED"
    ).all()
    
    total_contribution = sum(r.amount for r in receipts)
    donation_count = len(receipts)
    last_donation_date = max(r.receipt_date for r in receipts).isoformat() if receipts else None
    
    return {
        "donor": donor,
        "total_contribution": total_contribution,
        "donation_count": donation_count,
        "last_donation_date": last_donation_date,
        "receipts": receipts
    }

@router.delete("/{donor_id}")
def delete_donor(
    donor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    donor = db.query(Donor).filter(
        Donor.id == donor_id,
        Donor.organization_id == org_id
    ).first()
    
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
        
    from app.services.audit import write_audit_log
    write_audit_log(
        db, org_id, current_user.id, "DELETE", "Donor", donor.id,
        previous_value={"name": donor.name, "mobile": donor.mobile}
    )
    db.delete(donor)
    db.commit()
    return {"message": "Donor deleted successfully"}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import User, Organization
from app.models.schemas import OrganizationResponse
from app.services.audit import write_audit_log

router = APIRouter(prefix="/organization", tags=["Organization Settings"])

admin_role_checker = RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    festival_name: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    logo: Optional[str] = None
    signature: Optional[str] = None
    upi_qr: Optional[str] = None
    bank_details: Optional[Dict[str, Any]] = None

@router.get("", response_model=OrganizationResponse)
def get_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("", response_model=OrganizationResponse)
def update_organization(
    org_in: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_role_checker)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    old_values = {
        "name": org.name,
        "festival_name": org.festival_name,
        "address": org.address,
        "contact_number": org.contact_number
    }
    
    if org_in.name is not None:
        org.name = org_in.name
    if org_in.festival_name is not None:
        org.festival_name = org_in.festival_name
    if org_in.address is not None:
        org.address = org_in.address
    if org_in.contact_number is not None:
        org.contact_number = org_in.contact_number
    if org_in.logo is not None:
        org.logo = org_in.logo
    if org_in.signature is not None:
        org.signature = org_in.signature
    if org_in.upi_qr is not None:
        org.upi_qr = org_in.upi_qr
    if org_in.bank_details is not None:
        org.bank_details = org_in.bank_details
        
    # Handling email if provided, we can store it in bank_details or address json, but we don't have an email field in db
    # We will put it in bank_details json for now if provided, or append to address if simple string mapping is preferred
    # Actually, as per instructions: "(store in address or add field)" - we can append to address or store in bank_details. Let's just put it in a dict in address if we want, or simple string append.
    # To keep it simple, let's append it to address if provided.
    if org_in.email:
        if org.address:
            if org_in.email not in org.address:
                org.address = f"{org.address} | Email: {org_in.email}"
        else:
            org.address = f"Email: {org_in.email}"

    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)
    
    new_values = {
        "name": org.name,
        "festival_name": org.festival_name,
        "address": org.address,
        "contact_number": org.contact_number
    }
    
    write_audit_log(
        db=db,
        organization_id=org.id,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Organization",
        entity_id=org.id,
        previous_value=old_values,
        new_value=new_values
    )
    
    return org

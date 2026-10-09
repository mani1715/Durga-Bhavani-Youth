from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, ReceiptTemplate
from app.models.schemas import CustomFieldConfig

router = APIRouter(prefix="/templates", tags=["Receipt Templates"])

@router.get("")
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    templates = db.query(ReceiptTemplate).filter(
        ReceiptTemplate.organization_id == org_id
    ).all()
    return templates

@router.get("/active")
def get_active_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    template = db.query(ReceiptTemplate).filter(
        ReceiptTemplate.organization_id == org_id,
        ReceiptTemplate.is_active == True
    ).first()
    if not template:
        template = db.query(ReceiptTemplate).filter(
            ReceiptTemplate.organization_id == org_id
        ).order_by(ReceiptTemplate.created_at.desc()).first()
    if not template:
        raise HTTPException(status_code=404, detail="No template found")
    return template

@router.post("")
def create_template(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    template = ReceiptTemplate(
        organization_id=org_id,
        name=name,
        is_active=False,
        elements={
            "receipt_number": {"x": 50, "y": 70, "fontSize": 12, "visible": True},
            "donor_name": {"x": 50, "y": 120, "fontSize": 12, "visible": True},
            "amount": {"x": 50, "y": 180, "fontSize": 14, "visible": True},
            "date": {"x": 260, "y": 70, "fontSize": 11, "visible": True}
        }
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.put("/{template_id}")
def update_template(
    template_id: str,
    elements: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    template = db.query(ReceiptTemplate).filter(
        ReceiptTemplate.id == template_id,
        ReceiptTemplate.organization_id == org_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.elements = elements
    db.commit()
    return template


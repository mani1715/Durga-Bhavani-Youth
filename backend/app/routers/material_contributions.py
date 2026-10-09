import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import (
    User, Event, DonationCategory, MaterialContribution
)
from app.models.schemas import (
    MaterialContributionCreate, MaterialContributionUpdate, MaterialContributionResponse
)
from app.services.audit import write_audit_log

router = APIRouter(prefix="/material-contributions", tags=["Material Contributions"])

@router.get("", response_model=List[MaterialContributionResponse])
def get_material_contributions(
    event_id: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    query = db.query(MaterialContribution).filter(MaterialContribution.organization_id == org_id)

    if event_id:
        query = query.filter(MaterialContribution.event_id == event_id)
    if category_id:
        query = query.filter(MaterialContribution.donation_category_id == category_id)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (MaterialContribution.donor_name.ilike(term)) |
            (MaterialContribution.item_description.ilike(term)) |
            (MaterialContribution.item_description_telugu.ilike(term))
        )

    results = query.order_by(MaterialContribution.received_date.desc(), MaterialContribution.created_at.desc()).all()
    
    # Map category names
    cats = {c.id: c for c in db.query(DonationCategory).filter(DonationCategory.organization_id == org_id).all()}
    
    response = []
    for m in results:
        cat = cats.get(m.donation_category_id)
        response.append({
            "id": m.id,
            "organization_id": m.organization_id,
            "event_id": m.event_id,
            "donor_name": m.donor_name,
            "phone": m.phone,
            "donation_category_id": m.donation_category_id,
            "category_name": cat.name if cat else None,
            "category_name_telugu": cat.name_telugu if cat else None,
            "item_description": m.item_description,
            "item_description_telugu": m.item_description_telugu,
            "quantity": m.quantity,
            "unit": m.unit,
            "estimated_value": m.estimated_value,
            "received_date": m.received_date,
            "notes": m.notes,
            "is_published": m.is_published,
            "created_at": m.created_at,
            "updated_at": m.updated_at
        })
    return response

@router.post("", response_model=MaterialContributionResponse)
def create_material_contribution(
    payload: MaterialContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"]))
):
    org_id = current_user.organization_id
    
    # Resolve event
    event_id = payload.event_id
    if not event_id:
        ev = db.query(Event).filter(Event.organization_id == org_id, Event.status == "ACTIVE").first()
        if not ev:
            ev = db.query(Event).filter(Event.organization_id == org_id).first()
        if not ev:
            raise HTTPException(status_code=400, detail="No active festival event found")
        event_id = ev.id

    rec_date = payload.received_date or datetime.utcnow()

    contribution = MaterialContribution(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        event_id=event_id,
        donor_name=payload.donor_name.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        donation_category_id=payload.donation_category_id,
        item_description=payload.item_description.strip(),
        item_description_telugu=payload.item_description_telugu.strip() if payload.item_description_telugu else payload.item_description.strip(),
        quantity=payload.quantity.strip(),
        unit=payload.unit.strip() if payload.unit else None,
        estimated_value=payload.estimated_value,
        received_date=rec_date,
        notes=payload.notes.strip() if payload.notes else None,
        is_published=payload.is_published,
        created_by=current_user.id
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    write_audit_log(
        db, org_id, current_user.id, "CREATE", "MaterialContribution", contribution.id,
        new_value={"item": contribution.item_description, "donor": contribution.donor_name}
    )

    cat = db.query(DonationCategory).filter(DonationCategory.id == contribution.donation_category_id).first()
    return {
        "id": contribution.id,
        "organization_id": contribution.organization_id,
        "event_id": contribution.event_id,
        "donor_name": contribution.donor_name,
        "phone": contribution.phone,
        "donation_category_id": contribution.donation_category_id,
        "category_name": cat.name if cat else None,
        "category_name_telugu": cat.name_telugu if cat else None,
        "item_description": contribution.item_description,
        "item_description_telugu": contribution.item_description_telugu,
        "quantity": contribution.quantity,
        "unit": contribution.unit,
        "estimated_value": contribution.estimated_value,
        "received_date": contribution.received_date,
        "notes": contribution.notes,
        "is_published": contribution.is_published,
        "created_at": contribution.created_at,
        "updated_at": contribution.updated_at
    }

@router.put("/{id}", response_model=MaterialContributionResponse)
def update_material_contribution(
    id: str,
    payload: MaterialContributionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"]))
):
    org_id = current_user.organization_id
    item = db.query(MaterialContribution).filter(
        MaterialContribution.id == id,
        MaterialContribution.organization_id == org_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Material contribution not found")

    old_val = {"item": item.item_description, "donor": item.donor_name}

    if payload.donor_name is not None:
        item.donor_name = payload.donor_name.strip()
    if payload.phone is not None:
        item.phone = payload.phone.strip() if payload.phone else None
    if payload.donation_category_id is not None:
        item.donation_category_id = payload.donation_category_id
    if payload.item_description is not None:
        item.item_description = payload.item_description.strip()
    if payload.item_description_telugu is not None:
        item.item_description_telugu = payload.item_description_telugu.strip()
    if payload.quantity is not None:
        item.quantity = payload.quantity.strip()
    if payload.unit is not None:
        item.unit = payload.unit.strip() if payload.unit else None
    if payload.estimated_value is not None:
        item.estimated_value = payload.estimated_value
    if payload.received_date is not None:
        item.received_date = payload.received_date
    if payload.notes is not None:
        item.notes = payload.notes.strip() if payload.notes else None
    if payload.is_published is not None:
        item.is_published = payload.is_published

    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    write_audit_log(
        db, org_id, current_user.id, "UPDATE", "MaterialContribution", item.id,
        previous_value=old_val,
        new_value={"item": item.item_description, "donor": item.donor_name}
    )

    cat = db.query(DonationCategory).filter(DonationCategory.id == item.donation_category_id).first()
    return {
        "id": item.id,
        "organization_id": item.organization_id,
        "event_id": item.event_id,
        "donor_name": item.donor_name,
        "phone": item.phone,
        "donation_category_id": item.donation_category_id,
        "category_name": cat.name if cat else None,
        "category_name_telugu": cat.name_telugu if cat else None,
        "item_description": item.item_description,
        "item_description_telugu": item.item_description_telugu,
        "quantity": item.quantity,
        "unit": item.unit,
        "estimated_value": item.estimated_value,
        "received_date": item.received_date,
        "notes": item.notes,
        "is_published": item.is_published,
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }

@router.put("/{id}/toggle", response_model=MaterialContributionResponse)
def toggle_material_contribution(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"]))
):
    org_id = current_user.organization_id
    item = db.query(MaterialContribution).filter(
        MaterialContribution.id == id,
        MaterialContribution.organization_id == org_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Material contribution not found")

    item.is_published = not item.is_published
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    cat = db.query(DonationCategory).filter(DonationCategory.id == item.donation_category_id).first()
    return {
        "id": item.id,
        "organization_id": item.organization_id,
        "event_id": item.event_id,
        "donor_name": item.donor_name,
        "phone": item.phone,
        "donation_category_id": item.donation_category_id,
        "category_name": cat.name if cat else None,
        "category_name_telugu": cat.name_telugu if cat else None,
        "item_description": item.item_description,
        "item_description_telugu": item.item_description_telugu,
        "quantity": item.quantity,
        "unit": item.unit,
        "estimated_value": item.estimated_value,
        "received_date": item.received_date,
        "notes": item.notes,
        "is_published": item.is_published,
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }

@router.delete("/{id}")
def delete_material_contribution(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    item = db.query(MaterialContribution).filter(
        MaterialContribution.id == id,
        MaterialContribution.organization_id == org_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Material contribution not found")

    write_audit_log(
        db, org_id, current_user.id, "DELETE", "MaterialContribution", item.id,
        previous_value={"item": item.item_description, "donor": item.donor_name}
    )

    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Material contribution deleted"}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import User, Event, Receipt, Expense
from app.models.schemas import EventResponse, EventCreate
from app.services.audit import write_audit_log

router = APIRouter(prefix="/events", tags=["Events"])

admin_role_checker = RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    financial_year: Optional[str] = None
    status: Optional[str] = None

class EventWithSummaryResponse(EventResponse):
    total_donations: float
    total_expenses: float
    current_balance: float

@router.get("", response_model=List[EventResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Event).filter(Event.organization_id == current_user.organization_id).all()

@router.post("", response_model=EventResponse)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_role_checker)
):
    org_id = current_user.organization_id
    
    # If this is active, we might need to handle the "only one ACTIVE" rule.
    # By default new event status is ACTIVE
    if event_in.status == "ACTIVE":
        active_events = db.query(Event).filter(
            Event.organization_id == org_id,
            Event.status == "ACTIVE"
        ).all()
        for ae in active_events:
            ae.status = "COMPLETED"
            
    new_event = Event(
        organization_id=org_id,
        name=event_in.name,
        description=event_in.description,
        start_date=event_in.start_date,
        end_date=event_in.end_date,
        financial_year=event_in.financial_year,
        status=event_in.status
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    write_audit_log(
        db=db,
        organization_id=org_id,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Event",
        entity_id=new_event.id,
        new_value={"name": new_event.name, "financial_year": new_event.financial_year}
    )
    
    return new_event

@router.get("/active", response_model=EventWithSummaryResponse)
def get_active_event(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    event = db.query(Event).filter(Event.organization_id == org_id, Event.status == "ACTIVE").first()
    if not event:
        # Fallback to latest event
        event = db.query(Event).filter(Event.organization_id == org_id).order_by(Event.created_at.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="No active event found")
        
    receipts_query = db.query(Receipt).filter(
        Receipt.organization_id == org_id,
        Receipt.event_id == event.id,
        Receipt.status == "ISSUED"
    )
    total_donations = sum(r.amount for r in receipts_query.all())
    
    expenses_query = db.query(Expense).filter(
        Expense.organization_id == org_id,
        Expense.event_id == event.id,
        Expense.status == "RECORDED"
    )
    total_expenses = sum(e.amount for e in expenses_query.all())
    
    current_balance = total_donations - total_expenses
    
    return {
        "id": event.id,
        "organization_id": event.organization_id,
        "name": event.name,
        "description": event.description,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "financial_year": event.financial_year,
        "status": event.status,
        "created_at": event.created_at,
        "total_donations": float(total_donations),
        "total_expenses": float(total_expenses),
        "current_balance": float(current_balance)
    }

@router.get("/{event_id}", response_model=EventWithSummaryResponse)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    event = db.query(Event).filter(Event.id == event_id, Event.organization_id == org_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    receipts_query = db.query(Receipt).filter(
        Receipt.organization_id == org_id,
        Receipt.event_id == event_id,
        Receipt.status == "ISSUED"
    )
    total_donations = sum(r.amount for r in receipts_query.all())
    
    expenses_query = db.query(Expense).filter(
        Expense.organization_id == org_id,
        Expense.event_id == event_id,
        Expense.status == "RECORDED"
    )
    total_expenses = sum(e.amount for e in expenses_query.all())
    
    current_balance = total_donations - total_expenses
    
    event_dict = {
        "id": event.id,
        "organization_id": event.organization_id,
        "name": event.name,
        "description": event.description,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "financial_year": event.financial_year,
        "status": event.status,
        "created_at": event.created_at,
        "total_donations": float(total_donations),
        "total_expenses": float(total_expenses),
        "current_balance": float(current_balance)
    }
    return event_dict

@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_role_checker)
):
    org_id = current_user.organization_id
    event = db.query(Event).filter(Event.id == event_id, Event.organization_id == org_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    old_value = {"name": event.name, "description": event.description, "status": event.status}
    
    if event_in.name is not None:
        event.name = event_in.name
    if event_in.description is not None:
        event.description = event_in.description
    if event_in.start_date is not None:
        event.start_date = event_in.start_date
    if event_in.end_date is not None:
        event.end_date = event_in.end_date
    if event_in.financial_year is not None:
        event.financial_year = event_in.financial_year
    if event_in.status is not None:
        if event_in.status == "ACTIVE" and event.status != "ACTIVE":
            # Deactivate others
            active_events = db.query(Event).filter(
                Event.organization_id == org_id,
                Event.id != event_id,
                Event.status == "ACTIVE"
            ).all()
            for ae in active_events:
                ae.status = "COMPLETED"
        event.status = event_in.status
        
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    
    write_audit_log(
        db=db,
        organization_id=org_id,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Event",
        entity_id=event.id,
        previous_value=old_value,
        new_value={"name": event.name, "description": event.description, "status": event.status}
    )
    
    return event

@router.post("/{event_id}/activate", response_model=EventResponse)
def activate_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_role_checker)
):
    org_id = current_user.organization_id
    event = db.query(Event).filter(Event.id == event_id, Event.organization_id == org_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    active_events = db.query(Event).filter(
        Event.organization_id == org_id,
        Event.id != event_id,
        Event.status == "ACTIVE"
    ).all()
    
    for ae in active_events:
        ae.status = "COMPLETED"
        
    event.status = "ACTIVE"
    event.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(event)
    
    write_audit_log(
        db=db,
        organization_id=org_id,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Event",
        entity_id=event.id,
        new_value={"status": "ACTIVE"}
    )
    
    return event

@router.post("/{event_id}/archive", response_model=EventResponse)
def archive_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_role_checker)
):
    org_id = current_user.organization_id
    event = db.query(Event).filter(Event.id == event_id, Event.organization_id == org_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.status = "ARCHIVED"
    event.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(event)
    
    write_audit_log(
        db=db,
        organization_id=org_id,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Event",
        entity_id=event.id,
        new_value={"status": "ARCHIVED"}
    )
    
    return event

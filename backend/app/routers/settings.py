from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import User, Event, DonationCategory, ExpenseCategory
from app.models.schemas import (
    EventResponse, DonationCategoryResponse, ExpenseCategoryResponse,
    DonationCategoryCreate, DonationCategoryUpdate
)

router = APIRouter(prefix="/settings", tags=["Organization Settings"])

@router.get("/events", response_model=List[EventResponse])
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    return db.query(Event).filter(Event.organization_id == org_id).all()

@router.get("/donation-categories", response_model=List[DonationCategoryResponse])
def get_donation_categories(
    include_inactive: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    query = db.query(DonationCategory).filter(DonationCategory.organization_id == org_id)
    if not include_inactive:
        query = query.filter(DonationCategory.is_active == True)
    return query.order_by(DonationCategory.display_order.asc(), DonationCategory.name.asc()).all()

@router.get("/expense-categories", response_model=List[ExpenseCategoryResponse])
def get_expense_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    return db.query(ExpenseCategory).filter(
        ExpenseCategory.organization_id == org_id,
        ExpenseCategory.is_active == True
    ).all()

@router.post("/expense-categories", response_model=ExpenseCategoryResponse)
def create_expense_category(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    category = ExpenseCategory(
        organization_id=org_id,
        name=name,
        is_active=True
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/expense-categories/{cat_id}", response_model=ExpenseCategoryResponse)
def update_expense_category(
    cat_id: str,
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == cat_id, ExpenseCategory.organization_id == org_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.name = name
    db.commit()
    db.refresh(category)
    return category

@router.put("/expense-categories/{cat_id}/toggle", response_model=ExpenseCategoryResponse)
def toggle_expense_category(
    cat_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == cat_id, ExpenseCategory.organization_id == org_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.is_active = not category.is_active
    db.commit()
    db.refresh(category)
    return category

@router.post("/donation-categories", response_model=DonationCategoryResponse)
def create_donation_category(
    payload: DonationCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    category = DonationCategory(
        organization_id=org_id,
        name=payload.name,
        name_telugu=payload.name_telugu or payload.name,
        name_english=payload.name_english or payload.name,
        display_order=payload.display_order or 0,
        description=payload.description,
        is_active=payload.is_active
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/donation-categories/{cat_id}", response_model=DonationCategoryResponse)
def update_donation_category(
    cat_id: str,
    payload: DonationCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    category = db.query(DonationCategory).filter(
        DonationCategory.id == cat_id, DonationCategory.organization_id == org_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if payload.name is not None:
        category.name = payload.name
    if payload.name_telugu is not None:
        category.name_telugu = payload.name_telugu
    if payload.name_english is not None:
        category.name_english = payload.name_english
    if payload.display_order is not None:
        category.display_order = payload.display_order
    if payload.description is not None:
        category.description = payload.description
    if payload.is_active is not None:
        category.is_active = payload.is_active

    db.commit()
    db.refresh(category)
    return category

@router.put("/donation-categories/{cat_id}/toggle", response_model=DonationCategoryResponse)
def toggle_donation_category(
    cat_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    category = db.query(DonationCategory).filter(
        DonationCategory.id == cat_id, DonationCategory.organization_id == org_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.is_active = not category.is_active
    db.commit()
    db.refresh(category)
    return category


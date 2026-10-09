from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import (
    User, Expense, ExpenseCategory, ExpenseSequence, Event, Organization
)
from app.models.schemas import ExpenseCreate, ExpenseResponse
from app.services.audit import write_audit_log

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("", response_model=ExpenseResponse)
def create_expense(
    request: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"]))
):
    org_id = current_user.organization_id
    
    # Validate Event & Category
    event = db.query(Event).filter(Event.id == request.event_id, Event.organization_id == org_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Selected event not found")
        
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == request.category_id,
        ExpenseCategory.organization_id == org_id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Selected category not found")

    # Generate sequential unique expense numbers inside FOR UPDATE lock
    fy = event.financial_year
    seq_row = db.query(ExpenseSequence).filter(
        ExpenseSequence.organization_id == org_id,
        ExpenseSequence.financial_year == fy
    ).with_for_update().first()
    
    if not seq_row:
        seq_row = ExpenseSequence(organization_id=org_id, financial_year=fy, current_value=0)
        db.add(seq_row)
        db.flush()
        
    seq_row.current_value += 1
    next_seq = seq_row.current_value
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    prefix = org.slug.upper() if org else "ORG"
    expense_number = f"EXP-{prefix}-{fy}-{next_seq:06d}"

    expense = Expense(
        organization_id=org_id,
        event_id=request.event_id,
        expense_number=expense_number,
        expense_sequence=next_seq,
        date=request.date,
        category_id=request.category_id,
        amount=request.amount,
        vendor_name=request.vendor_name,
        description=request.description,
        payment_method=request.payment_method,
        status="RECORDED",
        created_by=current_user.id
    )
    
    # Decode and save custom invoice voucher / receipt if uploaded
    if request.receipt_image and request.receipt_image.startswith("data:image/"):
        try:
            import base64
            from io import BytesIO
            from fastapi import UploadFile
            from app.services.storage import get_storage_service
            
            header, payload = request.receipt_image.split(",", 1)
            img_data = base64.b64decode(payload)
            
            storage = get_storage_service()
            upload_file = UploadFile(file=BytesIO(img_data), filename=f"bill_{expense_number}.png")
            storage_key = storage.save_file(upload_file, org_id, "bills")
            expense.bill_storage_key = storage_key
        except Exception:
            pass

    db.add(expense)
    db.flush()
    
    write_audit_log(
        db, org_id, current_user.id, "CREATE", "Expense", expense.id,
        new_value={"expense_number": expense_number, "amount": str(expense.amount)}
    )
    
    db.commit()
    db.refresh(expense)
    return expense

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    event_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    query = db.query(Expense).filter(Expense.organization_id == org_id)
    if event_id:
        query = query.filter(Expense.event_id == event_id)
    return query.all()

@router.post("/{expense_id}/cancel", response_model=ExpenseResponse)
def cancel_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.organization_id == org_id
    ).with_for_update().first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
        
    if expense.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Expense is already cancelled")
        
    old_status = expense.status
    expense.status = "CANCELLED"
    
    write_audit_log(
        db, org_id, current_user.id, "CANCEL", "Expense", expense.id,
        previous_value={"status": old_status}, new_value={"status": "CANCELLED"}
    )
    
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{expense_id}/receipt")
def get_expense_receipt_url(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.organization_id == org_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    if not expense.bill_storage_key:
        raise HTTPException(status_code=404, detail="No receipt image attached to this expense")
        
    from app.services.storage import get_storage_service
    storage = get_storage_service()
    url = storage.get_file_url(expense.bill_storage_key)
    return {"url": url}

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"]))
):
    org_id = current_user.organization_id
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.organization_id == org_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")
        
    old_data = {
        "expense_number": expense.expense_number,
        "amount": str(expense.amount),
        "vendor_name": expense.vendor_name,
        "status": expense.status
    }
    
    if expense.bill_storage_key:
        try:
            from app.services.storage import get_storage_service
            storage = get_storage_service()
            storage.delete_file(expense.bill_storage_key)
        except Exception:
            pass

    write_audit_log(
        db, org_id, current_user.id, "DELETE", "Expense", expense.id,
        previous_value=old_data
    )
    
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully", "id": expense_id}

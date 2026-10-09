from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, Receipt, Expense, Donor

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_financial_summary(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    
    # 1. Total valid (ISSUED) receipts
    receipts_query = db.query(Receipt).filter(
        Receipt.organization_id == org_id,
        Receipt.event_id == event_id,
        Receipt.status == "ISSUED"
    )
    receipts = receipts_query.all()
    total_donations = sum(r.amount for r in receipts)
    
    # 2. Total valid (RECORDED) expenses
    expenses_query = db.query(Expense).filter(
        Expense.organization_id == org_id,
        Expense.event_id == event_id,
        Expense.status == "RECORDED"
    )
    expenses = expenses_query.all()
    total_expenses = sum(e.amount for e in expenses)
    
    # 3. Current Balance
    current_balance = total_donations - total_expenses
    
    # 4. Donors count
    donors_count = db.query(Donor).filter(Donor.organization_id == org_id).count()
    
    # 5. Payment method breakdown
    payment_breakdown = {}
    for r in receipts:
        method = r.payment_method or "CASH"
        if method not in payment_breakdown:
            payment_breakdown[method] = Decimal("0.00")
        payment_breakdown[method] += r.amount

    # 6. Daily collection breakdown (date -> total_amount, count)
    daily_breakdown = {}
    for r in receipts:
        date_str = r.receipt_date.strftime("%Y-%m-%d")
        if date_str not in daily_breakdown:
            daily_breakdown[date_str] = {"date": date_str, "amount": Decimal("0.00"), "count": 0}
        daily_breakdown[date_str]["amount"] += r.amount
        daily_breakdown[date_str]["count"] += 1

    # 7. Daily expenses breakdown (date -> total_amount, count)
    daily_expenses = {}
    for e in expenses:
        date_str = e.date.strftime("%Y-%m-%d") if e.date else e.created_at.strftime("%Y-%m-%d")
        if date_str not in daily_expenses:
            daily_expenses[date_str] = {"date": date_str, "amount": Decimal("0.00"), "count": 0}
        daily_expenses[date_str]["amount"] += e.amount
        daily_expenses[date_str]["count"] += 1

    return {
        "total_donations": total_donations,
        "total_expenses": total_expenses,
        "current_balance": current_balance,
        "receipts_count": len(receipts),
        "expenses_count": len(expenses),
        "donors_count": donors_count,
        "payment_breakdown": payment_breakdown,
        "daily_breakdown": sorted(list(daily_breakdown.values()), key=lambda x: x["date"], reverse=True),
        "daily_expenses": sorted(list(daily_expenses.values()), key=lambda x: x["date"], reverse=True)
    }

@router.get("/top-donors")
def get_top_donors(
    event_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    
    # We query donors and their total receipts for this event
    # Using python to group to be safe with SQLite/Postgres compatibility on sum
    receipts_query = db.query(Receipt).filter(
        Receipt.organization_id == org_id,
        Receipt.event_id == event_id,
        Receipt.status == "ISSUED"
    ).all()
    
    donor_totals = {}
    donor_map = {}
    
    for r in receipts_query:
        if r.donor_id not in donor_totals:
            donor_totals[r.donor_id] = Decimal("0.00")
            donor_map[r.donor_id] = {"id": r.donor_id, "name": r.donor.name if r.donor else "Unknown"}
        donor_totals[r.donor_id] += r.amount
        
    top_donors = [
        {"id": d_id, "name": donor_map[d_id]["name"], "total_amount": float(amt)}
        for d_id, amt in donor_totals.items()
    ]
    
    top_donors.sort(key=lambda x: x["total_amount"], reverse=True)
    return top_donors[:limit]

@router.get("/category-breakdown")
def get_category_breakdown(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    
    # Donations Breakdown
    receipts = db.query(Receipt).filter(
        Receipt.organization_id == org_id,
        Receipt.event_id == event_id,
        Receipt.status == "ISSUED"
    ).all()
    
    donations_breakdown = {}
    for r in receipts:
        cat_id = r.donation_category_id
        cat_name = r.category.name if r.category else "Unknown"
        if cat_id not in donations_breakdown:
            donations_breakdown[cat_id] = {"category_id": cat_id, "category_name": cat_name, "total_amount": Decimal("0.00")}
        donations_breakdown[cat_id]["total_amount"] += r.amount
        
    # Expenses Breakdown
    expenses = db.query(Expense).filter(
        Expense.organization_id == org_id,
        Expense.event_id == event_id,
        Expense.status == "RECORDED"
    ).all()
    
    expenses_breakdown = {}
    for e in expenses:
        cat_id = e.category_id
        cat_name = e.category.name if e.category else "Unknown"
        if cat_id not in expenses_breakdown:
            expenses_breakdown[cat_id] = {"category_id": cat_id, "category_name": cat_name, "total_amount": Decimal("0.00")}
        expenses_breakdown[cat_id]["total_amount"] += e.amount
        
    return {
        "donations": [
            {"category_id": v["category_id"], "category_name": v["category_name"], "total_amount": float(v["total_amount"])}
            for v in donations_breakdown.values()
        ],
        "expenses": [
            {"category_id": v["category_id"], "category_name": v["category_name"], "total_amount": float(v["total_amount"])}
            for v in expenses_breakdown.values()
        ]
    }

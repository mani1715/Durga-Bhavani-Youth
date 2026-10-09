from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db_models import User, AuditLog
from app.models.schemas import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit System"])

@router.get("")
def get_audit_logs(
    entity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    query = db.query(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id).filter(
        AuditLog.organization_id == org_id
    )
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
        
    results = query.order_by(AuditLog.timestamp.desc()).all()
    
    output = []
    for log, user_obj in results:
        output.append({
            "id": log.id,
            "organization_id": log.organization_id,
            "user_id": log.user_id,
            "user_name": user_obj.name if user_obj else "System/Admin",
            "user_role": user_obj.role if user_obj else "N/A",
            "user_email": user_obj.email if user_obj else "N/A",
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "timestamp": log.timestamp.isoformat(),
            "previous_value": log.previous_value,
            "new_value": log.new_value,
            "ip_address": log.ip_address
        })
    return output

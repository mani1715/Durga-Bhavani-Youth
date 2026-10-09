from datetime import datetime
from sqlalchemy.orm import Session
from app.models.db_models import AuditLog

def write_audit_log(
    db: Session, 
    org_id: str, 
    user_id: str, 
    action: str, 
    entity_type: str, 
    entity_id: str, 
    previous_value: dict = None, 
    new_value: dict = None,
    ip_address: str = None,
    user_agent: str = None
) -> AuditLog:
    """
    Appends audit log history entry in a transaction-safe manner.
    """
    log = AuditLog(
        organization_id=org_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        previous_value=previous_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    return log

import os
import json
import sqlite3
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings

def create_backup(db: Session) -> str:
    """
    Exports organization structural meta & transaction tables to a JSON backup.
    For PostgreSQL in production, standard pg_dump will be configured.
    """
    backup_data = {}
    
    # Tables to export
    tables = [
        "organizations", "events", "users", "donors", "donor_groups", 
        "donation_categories", "receipt_templates", "receipts", 
        "expense_categories", "expenses", "audit_logs"
    ]
    
    for table in tables:
        result = db.execute(f"SELECT * FROM {table}")
        rows = [dict(row._mapping) for row in result]
        
        # Serialize Datetime and Decimal objects to strings
        for row in rows:
            for k, v in row.items():
                if isinstance(v, datetime):
                    row[k] = v.isoformat()
                elif hasattr(v, '__str__') and 'Decimal' in str(type(v)):
                    row[k] = str(v)
        
        backup_data[table] = rows
        
    backup_dir = os.path.join(settings.LOCAL_STORAGE_DIR, "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    backup_file = os.path.join(backup_dir, f"backup_{int(datetime.utcnow().timestamp())}.json")
    with open(backup_file, "w") as f:
        json.dump(backup_data, f, indent=2)
        
    return backup_file

def restore_backup(backup_filepath: str, db: Session) -> bool:
    """
    Restores tables from a JSON backup file.
    """
    if not os.path.exists(backup_filepath):
        return False
        
    with open(backup_filepath, "r") as f:
        data = json.load(f)
        
    # Order of insertion to satisfy FK constraints
    ordered_tables = [
        "organizations", "events", "users", "donors", "donor_groups", 
        "donation_categories", "receipt_templates", "receipts", 
        "expense_categories", "expenses", "audit_logs"
    ]
    
    # Disable foreign keys temporarily if using SQLite
    db.execute("PRAGMA foreign_keys = OFF;")
    
    try:
        for table in ordered_tables:
            if table not in data:
                continue
            # Clear current contents
            db.execute(f"DELETE FROM {table}")
            
            rows = data[table]
            if not rows:
                continue
                
            for row in rows:
                # Reconstruct correct types where necessary
                keys = ", ".join(row.keys())
                placeholders = ", ".join([f":{k}" for k in row.keys()])
                db.execute(f"INSERT INTO {table} ({keys}) VALUES ({placeholders})", row)
                
        db.commit()
        db.execute("PRAGMA foreign_keys = ON;")
        return True
    except Exception as e:
        db.rollback()
        db.execute("PRAGMA foreign_keys = ON;")
        raise e

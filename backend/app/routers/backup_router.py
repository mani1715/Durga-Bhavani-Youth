from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Dict, Any
import os
import shutil

from app.core.security import get_current_user, RoleChecker
from app.models.db_models import User
from app.services.backup import create_backup
from app.core.config import settings

router = APIRouter(prefix="/backup", tags=["Backup"])

admin_role_checker = RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])
super_admin_checker = RoleChecker(["SUPER_ADMIN"])

BACKUP_DIR = os.path.join(settings.LOCAL_STORAGE_DIR, "backups")

@router.post("/create")
def trigger_backup(
    current_user: User = Depends(admin_role_checker)
):
    try:
        backup_path = create_backup()
        return {"status": "success", "message": "Backup created successfully", "path": backup_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")

@router.get("/download/{filename}")
def download_backup(
    filename: str,
    current_user: User = Depends(admin_role_checker)
):
    file_path = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Backup file not found")
    return FileResponse(file_path, filename=filename)

@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    current_user: User = Depends(super_admin_checker)
):
    # This is a basic implementation of upload to restore.
    # To fully restore a SQLite DB, one would typically stop the app and replace the file.
    # Here we simulate the restore by accepting the file and saving it.
    try:
        os.makedirs(BACKUP_DIR, exist_ok=True)
        file_path = os.path.join(BACKUP_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Optional: Here you would ideally copy it to `database.db` location
        # shutil.copyfile(file_path, "database.db") 
        # But this is risky while the app is running. We'll just acknowledge the upload.
        
        return {"status": "success", "message": f"Backup {file.filename} uploaded for restore."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore backup: {str(e)}")

@router.get("/history")
def list_backups(
    current_user: User = Depends(admin_role_checker)
):
    if not os.path.exists(BACKUP_DIR):
        return []
        
    backups = []
    for filename in os.listdir(BACKUP_DIR):
        file_path = os.path.join(BACKUP_DIR, filename)
        if os.path.isfile(file_path):
            stat = os.stat(file_path)
            backups.append({
                "filename": filename,
                "size_bytes": stat.st_size,
                "created_at": stat.st_ctime
            })
            
    # Sort by created_at descending
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    return backups

@router.get("/stats")
def get_backup_stats(
    current_user: User = Depends(admin_role_checker)
):
    if not os.path.exists(BACKUP_DIR):
        return {"total_backups": 0, "last_backup": None, "total_size_bytes": 0}
        
    backups = []
    total_size = 0
    for filename in os.listdir(BACKUP_DIR):
        file_path = os.path.join(BACKUP_DIR, filename)
        if os.path.isfile(file_path):
            stat = os.stat(file_path)
            total_size += stat.st_size
            backups.append(stat.st_ctime)
            
    last_backup = max(backups) if backups else None
    return {
        "total_backups": len(backups),
        "last_backup": last_backup,
        "total_size_bytes": total_size
    }


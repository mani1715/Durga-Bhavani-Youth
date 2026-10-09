import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import Base, engine
from app.routers import (
    auth, donors, receipts, expenses, reports, templates, audit, 
    settings as settings_router, events, organization, backup_router,
    public, festival_admin, material_contributions
)

# Initialize FastAPI App
app = FastAPI(title=settings.PROJECT_NAME)

# CORS Policy configuration
cors_origins_raw = settings.CORS_ORIGINS or ""
cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
if not cors_origins:
    cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://.*\.railway\.app$" if os.environ.get("ALLOW_RAILWAY_PREVIEWS", "true").lower() == "true" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Setup Storage directory route mount
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)

# Include Router endpoints
app.include_router(public.router, prefix="/api")
app.include_router(festival_admin.router, prefix="/api")
app.include_router(material_contributions.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(donors.router, prefix="/api")
app.include_router(receipts.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(organization.router, prefix="/api")
app.include_router(backup_router.router, prefix="/api")

# Secure file download endpoint route
@app.get("/api/files/download/{file_path:path}")
def download_local_file(file_path: str):
    clean_path = os.path.normpath(file_path).lstrip(os.sep).lstrip("/").replace("\\", "/")
    if ".." in clean_path:
        raise HTTPException(status_code=400, detail="Invalid path traversal")
    full_path = os.path.join(settings.LOCAL_STORAGE_DIR, clean_path)
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Requested file not found")
    return FileResponse(full_path)

@app.get("/api/festival/days")
def get_festival_days_route(db = Depends(app.extra.get("get_db", None)) if False else None):
    from app.core.database import SessionLocal
    from app.routers.public import get_all_festival_days
    with SessionLocal() as db_session:
        return get_all_festival_days(db_session)

@app.get("/api/categories")
def get_categories_route(type: str = "EXPENSE"):
    from app.core.database import SessionLocal
    from app.models.db_models import ExpenseCategory, DonationCategory, Organization
    with SessionLocal() as db_session:
        org = db_session.query(Organization).first()
        org_id = org.id if org else None
        if type and type.upper() == "EXPENSE":
            cats = db_session.query(ExpenseCategory).filter(
                ExpenseCategory.organization_id == org_id,
                ExpenseCategory.is_active == True
            ).all()
            return [{"id": c.id, "name": c.name, "description": c.description, "is_active": c.is_active} for c in cats]
        else:
            cats = db_session.query(DonationCategory).filter(
                DonationCategory.organization_id == org_id,
                DonationCategory.is_active == True
            ).order_by(DonationCategory.display_order.asc()).all()
            return [{"id": c.id, "name": c.name, "name_telugu": c.name_telugu, "name_english": c.name_english, "is_active": c.is_active} for c in cats]

@app.post("/api/donation-categories")
def create_donation_category_alias(payload: dict):
    from app.core.database import SessionLocal
    from app.models.db_models import Organization, DonationCategory
    with SessionLocal() as db_session:
        org = db_session.query(Organization).first()
        org_id = org.id if org else None
        new_cat = DonationCategory(
            organization_id=org_id,
            name=payload.get("name") or payload.get("name_telugu") or payload.get("name_english") or "Category",
            name_telugu=payload.get("name_telugu"),
            name_english=payload.get("name_english"),
            description=payload.get("description", ""),
            display_order=payload.get("display_order", 0),
            is_active=True
        )
        db_session.add(new_cat)
        db_session.commit()
        db_session.refresh(new_cat)
        return {
            "id": new_cat.id,
            "organization_id": new_cat.organization_id,
            "name": new_cat.name,
            "name_telugu": new_cat.name_telugu,
            "name_english": new_cat.name_english,
            "description": new_cat.description,
            "display_order": new_cat.display_order,
            "is_active": new_cat.is_active
        }

@app.get("/health")
@app.get("/api/health")
def health_check():
    db_status = "disconnected"
    try:
        from sqlalchemy import text
        from app.core.database import SessionLocal
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = "error"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": settings.PROJECT_NAME,
        "database": db_status,
        "database_type": "postgresql" if not settings.DATABASE_URL.startswith("sqlite") else "sqlite",
        "storage_type": settings.STORAGE_TYPE
    }

# Optional Frontend Static SPA Mount (for unified single-container deployments)
frontend_dist_paths = [
    os.environ.get("FRONTEND_DIST_DIR", ""),
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"),
    os.path.join(os.path.dirname(__file__), "..", "dist"),
    "/app/frontend/dist",
]
frontend_dist = next((p for p in frontend_dist_paths if p and os.path.exists(p) and os.path.isdir(p)), None)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path.startswith("health") or full_path == "health":
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = os.path.join(frontend_dist, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend file not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)


import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.db_models import (
    User, Organization, Event, FestivalDay, ProgrammeActivity, PoojaCouple, 
    DayPhoto, Announcement, Sponsor, Receipt
)
from app.services.storage import get_storage_service
from app.services.audit import write_audit_log

router = APIRouter(prefix="/festival-admin", tags=["Festival Admin Management"])

admin_or_operator = RoleChecker(["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"])
admin_only = RoleChecker(["SUPER_ADMIN", "ORG_ADMIN"])

# -------------------------------------------------------------
# 1. FESTIVAL SETTINGS & COMMITTEE CONTACTS
# -------------------------------------------------------------

@router.get("/settings")
def get_festival_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    contacts = []
    if org.contact_number:
        nums = [n.strip() for n in org.contact_number.split(",") if n.strip()]
        for idx, n in enumerate(nums):
            contacts.append({
                "id": str(idx + 1),
                "label": f"కమిటీ సంప్రదింపు {idx + 1}",
                "phone": n,
                "tel_link": f"tel:+91{n}"
            })
            
    # Default fallbacks if none stored
    if not contacts:
        contacts = [
            {"id": "1", "label": "కమిటీ సంప్రదింపు 1", "phone": "8897557545", "tel_link": "tel:+918897557545"},
            {"id": "2", "label": "కమిటీ సంప్రదింపు 2", "phone": "9912844424", "tel_link": "tel:+919912844424"},
            {"id": "3", "label": "కమిటీ సంప్రదింపు 3", "phone": "9963397056", "tel_link": "tel:+919963397056"}
        ]

    return {
        "organization_id": org.id,
        "name": org.name,
        "festival_name": org.festival_name,
        "year": org.year,
        "address": org.address,
        "contact_number": org.contact_number,
        "contacts": contacts,
        "logo_url": org.logo or "/committee-photo-logo.webp",
        "banner_image_url": org.banner_image_url or "/ammavaru-hero-green.webp"
    }

@router.post("/settings/hero-photo")
def upload_hero_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    content_type = file.content_type or ""
    filename = file.filename.lower()
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if content_type not in allowed_types and not any(filename.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
        raise HTTPException(status_code=400, detail="Only image files (JPG, PNG, WebP) are allowed")

    storage = get_storage_service()
    storage_key = storage.save_file(file, org.id, "hero", is_public=True)
    public_url = storage.get_file_url(storage_key, is_public=True)

    org.banner_image_url = public_url
    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)

    write_audit_log(
        db,
        org_id=org.id,
        user_id=current_user.id,
        action="UPDATE_HERO_PHOTO",
        entity_type="Organization",
        entity_id=org.id,
        new_val={"banner_image_url": public_url}
    )

    return {
        "message": "Hero photograph updated successfully",
        "banner_image_url": public_url
    }

@router.post("/settings/logo-photo")
def upload_logo_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    content_type = file.content_type or ""
    filename = file.filename.lower()
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if content_type not in allowed_types and not any(filename.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
        raise HTTPException(status_code=400, detail="Only image files (JPG, PNG, WebP) are allowed")

    storage = get_storage_service()
    storage_key = storage.save_file(file, org.id, "logo", is_public=True)
    public_url = storage.get_file_url(storage_key, is_public=True)

    org.logo = public_url
    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)

    write_audit_log(
        db,
        org_id=org.id,
        user_id=current_user.id,
        action="UPDATE_LOGO_PHOTO",
        entity_type="Organization",
        entity_id=org.id,
        new_val={"logo": public_url}
    )

    return {
        "message": "Committee logo photograph updated successfully",
        "logo_url": public_url
    }

@router.put("/settings")
def update_festival_settings(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if "festival_name" in payload:
        org.festival_name = payload["festival_name"]
    if "address" in payload:
        org.address = payload["address"]
    if "contact_number" in payload:
        org.contact_number = payload["contact_number"]
    if "logo" in payload:
        org.logo = payload["logo"]

    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)
    
    write_audit_log(
        db, 
        org_id=org.id, 
        user_id=current_user.id, 
        action="UPDATE_SETTINGS", 
        entity_type="Organization", 
        entity_id=org.id,
        new_val={"festival_name": org.festival_name, "contact_number": org.contact_number}
    )
    
    return {"message": "Settings updated successfully", "org_id": org.id}

# -------------------------------------------------------------
# 2. FESTIVAL DAYS & PROGRAMME ACTIVITIES
# -------------------------------------------------------------

@router.get("/days")
def get_admin_festival_days(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    days = db.query(FestivalDay).filter(FestivalDay.organization_id == org_id).order_by(FestivalDay.day_number.asc()).all()
    output = []
    for d in days:
        activities = db.query(ProgrammeActivity).filter(ProgrammeActivity.festival_day_id == d.id).order_by(ProgrammeActivity.display_order.asc()).all()
        couples = db.query(PoojaCouple).filter(PoojaCouple.festival_day_id == d.id).order_by(PoojaCouple.display_order.asc()).all()
        photos = db.query(DayPhoto).filter(DayPhoto.festival_day_id == d.id).all()
        output.append({
            "id": d.id,
            "date": d.date,
            "day_number": d.day_number,
            "alankaram_name_telugu": d.alankaram_name_telugu,
            "alankaram_name_english": d.alankaram_name_english,
            "description_telugu": d.description_telugu,
            "description_english": d.description_english,
            "is_completed": d.is_completed,
            "is_published": d.is_published,
            "activities": [
                {
                    "id": a.id,
                    "title_telugu": a.title_telugu,
                    "title_english": a.title_english,
                    "time_str": a.time_str,
                    "time_str_english": a.time_str_english,
                    "activity_type": a.activity_type,
                    "display_order": a.display_order,
                    "is_published": a.is_published
                } for a in activities
            ],
            "activities_count": len(activities),
            "pooja_couples_count": len(couples),
            "photos_count": len(photos)
        })
    return output

@router.put("/days/{day_id}")
def update_festival_day(
    day_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    day = db.query(FestivalDay).filter(FestivalDay.id == day_id, FestivalDay.organization_id == org_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Festival day not found")

    if "alankaram_name_telugu" in payload:
        day.alankaram_name_telugu = payload["alankaram_name_telugu"]
    if "alankaram_name_english" in payload:
        day.alankaram_name_english = payload["alankaram_name_english"]
    if "description_telugu" in payload:
        day.description_telugu = payload["description_telugu"]
    if "description_english" in payload:
        day.description_english = payload["description_english"]
    if "is_completed" in payload:
        day.is_completed = bool(payload["is_completed"])
    if "is_published" in payload:
        day.is_published = bool(payload["is_published"])

    day.updated_at = datetime.utcnow()
    db.commit()
    return day

@router.post("/days/{day_id}/activities")
def add_programme_activity(
    day_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    title = payload.get("title_telugu")
    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Activity title in Telugu is required")

    # Determine max display order
    max_order = db.query(ProgrammeActivity).filter(ProgrammeActivity.festival_day_id == day_id).count()

    act = ProgrammeActivity(
        festival_day_id=day_id,
        title_telugu=title.strip(),
        title_english=payload.get("title_english", "").strip() or None,
        time_str=payload.get("time_str", "").strip() or None,
        time_str_english=payload.get("time_str_english", "").strip() or None,
        activity_type=payload.get("activity_type", "RITUAL"),
        display_order=int(payload.get("display_order", max_order)),
        is_published=bool(payload.get("is_published", True))
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act

@router.put("/activities/{activity_id}")
def update_programme_activity(
    activity_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    act = db.query(ProgrammeActivity).filter(ProgrammeActivity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")

    if "title_telugu" in payload:
        act.title_telugu = payload["title_telugu"]
    if "title_english" in payload:
        act.title_english = payload["title_english"]
    if "time_str" in payload:
        act.time_str = payload["time_str"].strip() if payload["time_str"] else None
    if "time_str_english" in payload:
        act.time_str_english = payload["time_str_english"].strip() if payload["time_str_english"] else None
    if "activity_type" in payload:
        act.activity_type = payload["activity_type"]
    if "display_order" in payload:
        act.display_order = int(payload["display_order"])
    if "is_published" in payload:
        act.is_published = bool(payload["is_published"])

    db.commit()
    return act

@router.put("/activities/{activity_id}/toggle-publish")
def toggle_activity_publish(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    act = db.query(ProgrammeActivity).filter(ProgrammeActivity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")
    act.is_published = not act.is_published
    db.commit()
    return {"id": act.id, "is_published": act.is_published}

@router.put("/days/{day_id}/reorder-activities")
def reorder_programme_activities(
    day_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    activity_ids = payload.get("activity_ids", [])
    for idx, act_id in enumerate(activity_ids):
        act = db.query(ProgrammeActivity).filter(ProgrammeActivity.id == act_id, ProgrammeActivity.festival_day_id == day_id).first()
        if act:
            act.display_order = idx
    db.commit()
    return {"message": "Activities reordered successfully"}

@router.delete("/activities/{activity_id}")
def delete_programme_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    act = db.query(ProgrammeActivity).filter(ProgrammeActivity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(act)
    db.commit()
    return {"message": "Activity deleted"}

# -------------------------------------------------------------
# 3. POOJA COUPLES MANAGEMENT
# -------------------------------------------------------------

@router.get("/days/{day_id}/pooja-couples")
def get_pooja_couples(
    day_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PoojaCouple).filter(PoojaCouple.festival_day_id == day_id).order_by(PoojaCouple.display_order.asc()).all()

@router.post("/days/{day_id}/pooja-couples")
def add_pooja_couple(
    day_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    p1 = payload.get("person1_name", "").strip()
    if not p1:
        p1 = "భక్తులు"

    couple = PoojaCouple(
        festival_day_id=day_id,
        person1_name=p1,
        person2_name=payload.get("person2_name", "").strip() or None,
        family_display_name=payload.get("family_display_name", "").strip() or None,
        display_order=int(payload.get("display_order", 0)),
        is_published=bool(payload.get("is_published", True))
    )
    db.add(couple)
    db.commit()
    db.refresh(couple)
    return couple

@router.put("/pooja-couples/{couple_id}")
def update_pooja_couple(
    couple_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    couple = db.query(PoojaCouple).filter(PoojaCouple.id == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple entry not found")

    if "person1_name" in payload:
        couple.person1_name = payload["person1_name"]
    if "person2_name" in payload:
        couple.person2_name = payload["person2_name"]
    if "family_display_name" in payload:
        couple.family_display_name = payload["family_display_name"]
    if "display_order" in payload:
        couple.display_order = int(payload["display_order"])
    if "is_published" in payload:
        couple.is_published = bool(payload["is_published"])

    db.commit()
    return couple

@router.delete("/pooja-couples/{couple_id}")
def delete_pooja_couple(
    couple_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    couple = db.query(PoojaCouple).filter(PoojaCouple.id == couple_id).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Couple entry not found")
    db.delete(couple)
    db.commit()
    return {"message": "Pooja couple deleted"}

# -------------------------------------------------------------
# 4. DAY PHOTO UPLOADS & GALLERY PUBLISHING
# -------------------------------------------------------------

@router.get("/days/{day_id}/photos")
def get_day_photos(
    day_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org_id = current_user.organization_id
    photos = db.query(DayPhoto).filter(
        DayPhoto.festival_day_id == day_id, 
        DayPhoto.organization_id == org_id
    ).order_by(DayPhoto.display_order.asc(), DayPhoto.created_at.desc()).all()
    
    storage = get_storage_service()
    return [
        {
            "id": p.id,
            "title": p.title,
            "caption": p.caption,
            "url": storage.get_file_url(p.storage_key, is_public=p.is_published),
            "storage_key": p.storage_key,
            "is_published": p.is_published,
            "is_cover": p.is_cover,
            "display_order": p.display_order
        } for p in photos
    ]

@router.post("/days/{day_id}/photos")
async def upload_day_photo(
    day_id: str,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    is_published: bool = Form(True),
    is_cover: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    day = db.query(FestivalDay).filter(FestivalDay.id == day_id, FestivalDay.organization_id == org_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Festival day not found")

    allowed_exts = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400, 
            detail=f"ఫోటోలు కేవలం JPG, PNG, WebP ఫార్మాట్లలో మాత్రమే అనుతించబడతాయి (నమోదిత ఫైల్: {ext})"
        )

    storage = get_storage_service()
    storage_key = storage.save_file(file, org_id, f"gallery/{day.date}", is_public=is_published)

    photo = DayPhoto(
        organization_id=org_id,
        event_id=day.event_id,
        festival_day_id=day.id,
        title=title or f"దినం {day.day_number} - {day.alankaram_name_telugu}",
        caption=caption,
        storage_key=storage_key,
        is_published=is_published,
        is_cover=is_cover
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    url = storage.get_file_url(photo.storage_key, is_public=photo.is_published)
    return {
        "id": photo.id,
        "title": photo.title,
        "caption": photo.caption,
        "url": url,
        "storage_key": photo.storage_key,
        "is_published": photo.is_published,
        "is_cover": photo.is_cover
    }

@router.put("/photos/{photo_id}")
def update_photo_details(
    photo_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    photo = db.query(DayPhoto).filter(DayPhoto.id == photo_id, DayPhoto.organization_id == org_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    if "title" in payload:
        photo.title = payload["title"]
    if "caption" in payload:
        photo.caption = payload["caption"]
    storage = get_storage_service()
    if "is_published" in payload:
        new_published = bool(payload["is_published"])
        if new_published != photo.is_published:
            photo.is_published = new_published
            if new_published:
                storage.publish_file(photo.storage_key)
            else:
                storage.unpublish_file(photo.storage_key)
    if "is_cover" in payload:
        if payload["is_cover"]:
            # Unset cover for other photos in same day
            db.query(DayPhoto).filter(
                DayPhoto.festival_day_id == photo.festival_day_id,
                DayPhoto.id != photo.id
            ).update({"is_cover": False})
        photo.is_cover = bool(payload["is_cover"])
    if "display_order" in payload:
        photo.display_order = int(payload["display_order"])

    db.commit()
    return photo

@router.post("/photos/{photo_id}/replace")
async def replace_day_photo(
    photo_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    photo = db.query(DayPhoto).filter(DayPhoto.id == photo_id, DayPhoto.organization_id == org_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    allowed_exts = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400, 
            detail=f"ఫోటోలు కేవలం JPG, PNG, WebP ఫార్మాట్లలో మాత్రమే అనుతించబడతాయి (నమోదిత ఫైల్: {ext})"
        )

    day = db.query(FestivalDay).filter(FestivalDay.id == photo.festival_day_id).first()
    day_folder = f"gallery/{day.date}" if day else "gallery/misc"

    storage = get_storage_service()
    new_storage_key = storage.replace_file(
        file, 
        old_storage_key=photo.storage_key, 
        org_id=org_id, 
        prefix=day_folder, 
        is_public=photo.is_published
    )

    photo.storage_key = new_storage_key
    photo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(photo)

    url = storage.get_file_url(photo.storage_key, is_public=photo.is_published)
    return {
        "id": photo.id,
        "title": photo.title,
        "caption": photo.caption,
        "url": url,
        "storage_key": photo.storage_key,
        "is_published": photo.is_published,
        "is_cover": photo.is_cover
    }

@router.delete("/photos/{photo_id}")
def delete_photo(
    photo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    photo = db.query(DayPhoto).filter(DayPhoto.id == photo_id, DayPhoto.organization_id == org_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    storage = get_storage_service()
    storage.delete_file(photo.storage_key)

    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted"}

# -------------------------------------------------------------
# 5. ANNOUNCEMENTS & SPONSORS
# -------------------------------------------------------------

@router.get("/announcements")
def get_admin_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Announcement).filter(Announcement.organization_id == current_user.organization_id).order_by(Announcement.created_at.desc()).all()

@router.post("/announcements")
def create_announcement(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    ann = Announcement(
        organization_id=org_id,
        title_telugu=payload["title_telugu"],
        content_telugu=payload["content_telugu"],
        is_published=bool(payload.get("is_published", True))
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

@router.put("/announcements/{ann_id}")
def update_announcement(
    ann_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    ann = db.query(Announcement).filter(Announcement.id == ann_id, Announcement.organization_id == org_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if "title_telugu" in payload:
        ann.title_telugu = payload["title_telugu"]
    if "content_telugu" in payload:
        ann.content_telugu = payload["content_telugu"]
    if "is_published" in payload:
        ann.is_published = bool(payload["is_published"])

    db.commit()
    return ann

@router.delete("/announcements/{ann_id}")
def delete_announcement(
    ann_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    ann = db.query(Announcement).filter(Announcement.id == ann_id, Announcement.organization_id == org_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted"}

@router.get("/sponsors")
def get_admin_sponsors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Sponsor).filter(Sponsor.organization_id == current_user.organization_id).order_by(Sponsor.created_at.desc()).all()

@router.post("/sponsors")
def create_sponsor(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    event = db.query(Event).filter(Event.organization_id == org_id, Event.status == "ACTIVE").first()
    
    sponsor = Sponsor(
        organization_id=org_id,
        event_id=event.id if event else "",
        name=payload["name"],
        category=payload.get("category", "ఆలయ అభివృద్ధి దాతలు"),
        amount=payload.get("amount"),
        is_confirmed=bool(payload.get("is_confirmed", True)),
        is_published=bool(payload.get("is_published", True))
    )
    db.add(sponsor)
    db.commit()
    db.refresh(sponsor)
    return sponsor

@router.delete("/sponsors/{sponsor_id}")
def delete_sponsor(
    sponsor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_operator)
):
    org_id = current_user.organization_id
    sponsor = db.query(Sponsor).filter(Sponsor.id == sponsor_id, Sponsor.organization_id == org_id).first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    db.delete(sponsor)
    db.commit()
    return {"message": "Sponsor deleted"}

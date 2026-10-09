import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.db_models import (
    Organization, Event, FestivalDay, ProgrammeActivity, 
    PoojaCouple, DayPhoto, Announcement, Sponsor, Receipt, Donor,
    MaterialContribution, DonationCategory, DayPujaMaterial
)
from app.models.schemas import (
    FestivalDaySchema, DayPhotoSchema, AnnouncementSchema, 
    PublicDonationsResponse, PublicContributionItemSchema, PublicCategoryPillSchema
)

router = APIRouter(prefix="/public", tags=["Public Festival Site"])

def get_garuvupalem_org_and_event(db: Session):
    # Fetch Garuvupalem Durga Bhavani Youth organization
    org = db.query(Organization).filter(
        (Organization.slug == "garuvupalem-durga-bhavani-youth") |
        (Organization.name.ilike("%Durga Bhavani Youth%")) |
        (Organization.name.ilike("%Garuvupalem%"))
    ).first()
    
    if not org:
        org = db.query(Organization).first()
        
    if not org:
        raise HTTPException(status_code=404, detail="Festival Organization not found")
        
    event = db.query(Event).filter(
        Event.organization_id == org.id,
        Event.status == "ACTIVE"
    ).first()
    
    if not event:
        event = db.query(Event).filter(Event.organization_id == org.id).order_by(Event.created_at.desc()).first()
        
    return org, event

@router.get("/info")
def get_public_festival_info(db: Session = Depends(get_db)):
    org, event = get_garuvupalem_org_and_event(db)
    
    return {
        "organization_id": org.id,
        "event_id": event.id if event else None,
        "village_name_telugu": "గరువుపాలెం",
        "village_name_english": "Garuvupalem",
        "committee_name_telugu": "దుర్గాభవాని యూత్",
        "committee_name_english": "Durga Bhavani Youth",
        "festival_title_telugu": "31వ దేవీ శరన్నవరాత్రి మహోత్సవములు",
        "festival_title_english": "31st Devi Sharannavaratri Mahotsavam",
        "festival_dates_telugu": "10 అక్టోబర్ - 21 అక్టోబర్ 2026",
        "year": event.financial_year if event else "2026",
        "location_address": "గరువుపాలెం, చేబ్రోలు మండలం, గుంటూరు జిల్లా",
        "contacts": [
            {"label": "కమిటీ సంప్రదింపు 1", "phone": "8897557545", "tel_link": "tel:+918897557545"},
            {"label": "కమిటీ సంప్రదింపు 2", "phone": "9912844424", "tel_link": "tel:+919912844424"},
            {"label": "కమిటీ సంప్రదింపు 3", "phone": "9963397056", "tel_link": "tel:+919963397056"},
        ],
        "logo_url": org.logo or "/committee-photo-logo.webp",
        "banner_image_url": org.banner_image_url or "/ammavaru-hero-green.webp"
    }

@router.get("/programme/today")
def get_today_programme(db: Session = Depends(get_db)):
    org, event = get_garuvupalem_org_and_event(db)
    
    # Calculate current date in Asia/Kolkata (UTC + 5:30)
    kolkata_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today_str = kolkata_now.strftime("%Y-%m-%d")
    
    # Query first and last published festival days
    first_day = db.query(FestivalDay).filter(
        FestivalDay.organization_id == org.id, 
        FestivalDay.event_id == event.id,
        FestivalDay.is_published == True
    ).order_by(FestivalDay.day_number.asc()).first()
    
    last_day = db.query(FestivalDay).filter(
        FestivalDay.organization_id == org.id, 
        FestivalDay.event_id == event.id,
        FestivalDay.is_published == True
    ).order_by(FestivalDay.day_number.desc()).first()

    status_phase = "DURING_FESTIVAL"
    if first_day and today_str < first_day.date:
        status_phase = "BEFORE_FESTIVAL"
    elif last_day and today_str > last_day.date:
        status_phase = "AFTER_FESTIVAL"

    target_day = None
    is_upcoming = False

    if status_phase == "BEFORE_FESTIVAL":
        # Before 10 Oct: Preview opening day (Day 0) as Upcoming Opening Programme
        target_day = first_day
        is_upcoming = True
    elif status_phase == "DURING_FESTIVAL":
        # Strictly query today's published day. Never show another day's programme as today's!
        target_day = db.query(FestivalDay).filter(
            FestivalDay.organization_id == org.id,
            FestivalDay.event_id == event.id,
            FestivalDay.date == today_str,
            FestivalDay.is_published == True
        ).first()
    else:  # AFTER_FESTIVAL
        target_day = None

    if not target_day:
        message = (
            "31వ దేవీ శరన్నవరాత్రి మహోత్సవములు వైభవంగా ముగిశాయి"
            if status_phase == "AFTER_FESTIVAL"
            else "కార్యక్రమ వివరాలు త్వరలో తెలియజేస్తాము"
        )
        return {
            "status_phase": status_phase,
            "today_date": today_str,
            "is_upcoming": is_upcoming,
            "message": message,
            "day": None
        }

    # Fetch activities & pooja couples
    activities = db.query(ProgrammeActivity).filter(
        ProgrammeActivity.festival_day_id == target_day.id,
        ProgrammeActivity.is_published == True
    ).order_by(ProgrammeActivity.display_order.asc()).all()

    pooja_couples = db.query(PoojaCouple).filter(
        PoojaCouple.festival_day_id == target_day.id,
        PoojaCouple.is_published == True
    ).order_by(PoojaCouple.display_order.asc()).all()

    puja_materials = db.query(DayPujaMaterial).filter(
        DayPujaMaterial.festival_day_id == target_day.id,
        DayPujaMaterial.is_published == True
    ).order_by(DayPujaMaterial.display_order.asc(), DayPujaMaterial.created_at.asc()).all()

    return {
        "status_phase": status_phase,
        "current_date": today_str,
        "is_upcoming": is_upcoming,
        "day": {
            "id": target_day.id,
            "date": target_day.date,
            "day_number": target_day.day_number,
            "alankaram_name_telugu": target_day.alankaram_name_telugu,
            "alankaram_name_english": target_day.alankaram_name_english,
            "description_telugu": target_day.description_telugu,
            "description_english": target_day.description_english,
            "is_completed": target_day.is_completed,
            "activities": [
                {
                    "id": a.id,
                    "title_telugu": a.title_telugu,
                    "title_english": a.title_english,
                    "time_str": a.time_str or "సమయం త్వరలో తెలియజేస్తాము",
                    "time_str_english": a.time_str_english or "Time to be announced",
                    "activity_type": a.activity_type,
                    "allowed_participation_types": a.allowed_participation_types,
                    "who_can_participate_telugu": a.who_can_participate_telugu,
                    "who_can_participate_english": a.who_can_participate_english,
                    "participation_instructions_telugu": a.participation_instructions_telugu,
                    "participation_instructions_english": a.participation_instructions_english,
                    "what_to_bring_telugu": a.what_to_bring_telugu,
                    "what_to_bring_english": a.what_to_bring_english,
                    "arrival_instructions_telugu": a.arrival_instructions_telugu,
                    "arrival_instructions_english": a.arrival_instructions_english,
                } for a in activities
            ],
            "pooja_couples": [
                {
                    "id": c.id,
                    "programme_activity_id": c.programme_activity_id,
                    "participant_type": c.participant_type or "COUPLE",
                    "person1_name": c.person1_name,
                    "person1_name_telugu": c.person1_name_telugu,
                    "person2_name": c.person2_name,
                    "person2_name_telugu": c.person2_name_telugu,
                    "family_display_name": c.family_display_name or (f"{c.person1_name} & {c.person2_name}" if c.person2_name else c.person1_name),
                    "family_display_name_telugu": c.family_display_name_telugu or (f"{c.person1_name_telugu or c.person1_name} మరియు {c.person2_name_telugu or c.person2_name}" if c.person2_name else c.person1_name_telugu)
                } for c in pooja_couples
            ],
            "puja_materials": [
                {
                    "id": m.id,
                    "festival_day_id": m.festival_day_id,
                    "programme_activity_id": m.programme_activity_id,
                    "item_name_telugu": m.item_name_telugu,
                    "item_name_english": m.item_name_english,
                    "quantity": m.quantity,
                    "unit": m.unit,
                    "unit_telugu": m.unit_telugu,
                    "instructions_telugu": m.instructions_telugu,
                    "instructions_english": m.instructions_english,
                    "provided_by": m.provided_by,
                    "display_order": m.display_order
                } for m in puja_materials
            ]
        }
    }

@router.get("/programme/all")
def get_all_festival_days(db: Session = Depends(get_db)):
    org, event = get_garuvupalem_org_and_event(db)
    
    if not event:
        return []
        
    days = db.query(FestivalDay).filter(
        FestivalDay.organization_id == org.id,
        FestivalDay.event_id == event.id,
        FestivalDay.is_published == True
    ).order_by(FestivalDay.day_number.asc()).all()

    if not days:
        return []

    day_ids = [d.id for d in days]

    # Batch fetch all related records in 3 queries instead of N*3 roundtrips
    from collections import defaultdict
    activities_by_day = defaultdict(list)
    couples_by_day = defaultdict(list)
    materials_by_day = defaultdict(list)

    all_activities = db.query(ProgrammeActivity).filter(
        ProgrammeActivity.festival_day_id.in_(day_ids),
        ProgrammeActivity.is_published == True
    ).order_by(ProgrammeActivity.display_order.asc()).all()
    for a in all_activities:
        activities_by_day[a.festival_day_id].append(a)

    all_couples = db.query(PoojaCouple).filter(
        PoojaCouple.festival_day_id.in_(day_ids),
        PoojaCouple.is_published == True
    ).order_by(PoojaCouple.display_order.asc()).all()
    for c in all_couples:
        couples_by_day[c.festival_day_id].append(c)

    all_materials = db.query(DayPujaMaterial).filter(
        DayPujaMaterial.festival_day_id.in_(day_ids),
        DayPujaMaterial.is_published == True
    ).order_by(DayPujaMaterial.display_order.asc(), DayPujaMaterial.created_at.asc()).all()
    for m in all_materials:
        materials_by_day[m.festival_day_id].append(m)

    output = []
    for d in days:
        activities = activities_by_day.get(d.id, [])
        couples = couples_by_day.get(d.id, [])
        materials = materials_by_day.get(d.id, [])

        output.append({
            "id": d.id,
            "date": d.date,
            "day_number": d.day_number,
            "alankaram_name_telugu": d.alankaram_name_telugu,
            "alankaram_name_english": d.alankaram_name_english,
            "description_telugu": d.description_telugu,
            "description_english": d.description_english,
            "is_completed": d.is_completed,
            "activities": [
                {
                    "id": a.id,
                    "title_telugu": a.title_telugu,
                    "title_english": a.title_english,
                    "time_str": a.time_str or "సమయం త్వరలో తెలియజేస్తాము",
                    "time_str_english": a.time_str_english or "Time to be announced",
                    "activity_type": a.activity_type,
                    "allowed_participation_types": a.allowed_participation_types,
                    "who_can_participate_telugu": a.who_can_participate_telugu,
                    "who_can_participate_english": a.who_can_participate_english,
                    "participation_instructions_telugu": a.participation_instructions_telugu,
                    "participation_instructions_english": a.participation_instructions_english,
                    "what_to_bring_telugu": a.what_to_bring_telugu,
                    "what_to_bring_english": a.what_to_bring_english,
                    "arrival_instructions_telugu": a.arrival_instructions_telugu,
                    "arrival_instructions_english": a.arrival_instructions_english,
                } for a in activities
            ],
            "pooja_couples": [
                {
                    "id": c.id,
                    "programme_activity_id": c.programme_activity_id,
                    "participant_type": c.participant_type or "COUPLE",
                    "person1_name": c.person1_name,
                    "person1_name_telugu": c.person1_name_telugu,
                    "person2_name": c.person2_name,
                    "person2_name_telugu": c.person2_name_telugu,
                    "family_display_name": c.family_display_name or (f"{c.person1_name} & {c.person2_name}" if c.person2_name else c.person1_name),
                    "family_display_name_telugu": c.family_display_name_telugu or (f"{c.person1_name_telugu or c.person1_name} మరియు {c.person2_name_telugu or c.person2_name}" if c.person2_name else c.person1_name_telugu)
                } for c in couples
            ],
            "puja_materials": [
                {
                    "id": m.id,
                    "festival_day_id": m.festival_day_id,
                    "programme_activity_id": m.programme_activity_id,
                    "item_name_telugu": m.item_name_telugu,
                    "item_name_english": m.item_name_english,
                    "quantity": m.quantity,
                    "unit": m.unit,
                    "unit_telugu": m.unit_telugu,
                    "instructions_telugu": m.instructions_telugu,
                    "instructions_english": m.instructions_english,
                    "provided_by": m.provided_by,
                    "display_order": m.display_order
                } for m in materials
            ]
        })

    return output

@router.get("/donations", response_model=PublicDonationsResponse)
def get_public_donations(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    contribution_type: Optional[str] = Query("MONEY", regex="^(ALL|MONEY|MATERIAL)$"),
    sort: Optional[str] = Query("highest", regex="^(highest|newest)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    org, event = get_garuvupalem_org_and_event(db)
    if not event:
        return {
            "total_received": 0,
            "donors_count": 0,
            "materials_count": 0,
            "filtered_received": None,
            "filtered_count": None,
            "is_filtered": False,
            "categories": [],
            "donations": [],
            "total_count": 0,
            "page": 1,
            "total_pages": 1,
            "last_updated": datetime.utcnow().isoformat()
        }

    # 1. Fetch Active Categories for Category Filter Pills
    cats = db.query(DonationCategory).filter(
        DonationCategory.organization_id == org.id,
        DonationCategory.is_active == True
    ).order_by(DonationCategory.display_order.asc(), DonationCategory.name.asc()).all()

    category_pills = [
        PublicCategoryPillSchema(
            id=c.id,
            name=c.name,
            name_telugu=c.name_telugu or c.name,
            name_english=c.name_english or c.name,
            display_order=c.display_order or 0
        ) for c in cats
    ]
    cat_map = {c.id: c for c in cats}

    # 2. Overall Festival-Wide Totals (Strictly ISSUED receipts and Published Materials, excluding test entries)
    from sqlalchemy import func
    total_money_received = db.query(func.coalesce(func.sum(Receipt.amount), 0)).filter(
        Receipt.organization_id == org.id,
        Receipt.event_id == event.id,
        Receipt.status == "ISSUED",
        (Receipt.is_test == False) | (Receipt.is_test.is_(None))
    ).scalar() or 0

    total_monetary_donors_count = db.query(func.count(func.distinct(Receipt.donor_id))).filter(
        Receipt.organization_id == org.id,
        Receipt.event_id == event.id,
        Receipt.status == "ISSUED",
        Receipt.donor_id.isnot(None),
        (Receipt.is_test == False) | (Receipt.is_test.is_(None))
    ).scalar() or 0

    total_materials_count = db.query(func.count(MaterialContribution.id)).filter(
        MaterialContribution.organization_id == org.id,
        MaterialContribution.event_id == event.id,
        MaterialContribution.is_published == True,
        (MaterialContribution.is_test == False) | (MaterialContribution.is_test.is_(None))
    ).scalar() or 0

    # 3. Build List of Items based on contribution_type ("MONEY", "MATERIAL", "ALL")
    items = []

    # A. Monetary Donations (Excluding test data)
    if contribution_type in ("ALL", "MONEY"):
        receipt_query = db.query(Receipt, Donor).outerjoin(Donor, Receipt.donor_id == Donor.id).filter(
            Receipt.organization_id == org.id,
            Receipt.event_id == event.id,
            Receipt.status == "ISSUED",
            (Receipt.is_test == False) | (Receipt.is_test.is_(None))
        )
        if category_id and category_id.strip():
            receipt_query = receipt_query.filter(Receipt.donation_category_id == category_id.strip())
        if search and search.strip():
            term = f"%{search.strip()}%"
            receipt_query = receipt_query.filter((Donor.name.ilike(term)) | (Receipt.public_display_name.ilike(term)))

        # Default ordering: Highest amount first, resolving ties by receipt date and id
        if sort == "highest":
            receipt_query = receipt_query.order_by(Receipt.amount.desc(), Receipt.receipt_date.desc(), Receipt.id.desc())
        else:
            receipt_query = receipt_query.order_by(Receipt.receipt_date.desc(), Receipt.id.desc())

        def _has_telugu(text: Optional[str]) -> bool:
            return bool(text and any('\u0c00' <= char <= '\u0c7f' for char in text))

        receipt_results = receipt_query.all()
        for r, d in receipt_results:
            if r.is_anonymous:
                disp_name_te = "అజ్ఞాత దాత"
                disp_name_en = "Anonymous Donor"
                disp_name = "అజ్ఞాత దాత"
            else:
                # 1. Resolve Telugu donor name
                raw_te = (r.donor_name_telugu or "").strip() or ((d.name_telugu if d else "") or "").strip()
                if not raw_te and r.public_display_name and _has_telugu(r.public_display_name):
                    raw_te = r.public_display_name.strip()
                if not raw_te and d and d.name and _has_telugu(d.name):
                    raw_te = d.name.strip()

                # 2. Resolve English donor name
                raw_en = (r.donor_name_english or "").strip() or ((d.name_english if d else "") or "").strip()
                if not raw_en and r.public_display_name and not _has_telugu(r.public_display_name):
                    raw_en = r.public_display_name.strip()
                if not raw_en and d and d.name and not _has_telugu(d.name) and d.name not in ("N/A", "undefined"):
                    raw_en = d.name.strip()

                # 3. Fallbacks between languages
                disp_name_te = raw_te or raw_en or (r.public_display_name.strip() if r.public_display_name else None) or "అజ్ఞాత దాత"
                disp_name_en = raw_en or (r.public_display_name.strip() if r.public_display_name and not _has_telugu(r.public_display_name) else None) or raw_te or "Anonymous Donor"
                disp_name = disp_name_te

            cat_obj = cat_map.get(r.donation_category_id)
            cat_telugu = cat_obj.name_telugu if cat_obj else "సాధారణ ఉత్సవ నిధి"
            cat_name = cat_obj.name if cat_obj else "General Donation"

            items.append({
                "id": r.id,
                "donor_display_name": disp_name,
                "donor_display_name_english": disp_name_en,
                "donor_display_name_telugu": disp_name_te,
                "type": "MONEY",
                "amount": r.amount,
                "item_description": None,
                "item_description_telugu": None,
                "quantity": None,
                "unit": None,
                "estimated_value": None,
                "date": r.receipt_date.strftime("%Y-%m-%d") if r.receipt_date else "",
                "category_name": cat_name,
                "category_name_telugu": cat_telugu
            })

    # B. Material Contributions (Excluding test data)
    if contribution_type in ("ALL", "MATERIAL"):
        mat_query = db.query(MaterialContribution).filter(
            MaterialContribution.organization_id == org.id,
            MaterialContribution.event_id == event.id,
            MaterialContribution.is_published == True,
            (MaterialContribution.is_test == False) | (MaterialContribution.is_test.is_(None))
        )
        if category_id and category_id.strip():
            mat_query = mat_query.filter(MaterialContribution.donation_category_id == category_id.strip())
        if search and search.strip():
            term = f"%{search.strip()}%"
            mat_query = mat_query.filter(
                (MaterialContribution.donor_name.ilike(term)) | 
                (MaterialContribution.item_description.ilike(term)) |
                (MaterialContribution.item_description_telugu.ilike(term))
            )

        if sort == "highest":
            mat_query = mat_query.order_by(MaterialContribution.estimated_value.desc(), MaterialContribution.received_date.desc(), MaterialContribution.id.desc())
        else:
            mat_query = mat_query.order_by(MaterialContribution.received_date.desc(), MaterialContribution.id.desc())

        mat_results = mat_query.all()
        mat_donor_ids = [m.donor_id for m in mat_results if m.donor_id]
        mat_donors = {don.id: don for don in db.query(Donor).filter(Donor.id.in_(mat_donor_ids)).all()} if mat_donor_ids else {}

        for m in mat_results:
            cat_obj = cat_map.get(m.donation_category_id)
            cat_telugu = cat_obj.name_telugu if cat_obj else "వస్తు రూప విరాళం"
            cat_name = cat_obj.name if cat_obj else "Material Contribution"

            m_don = mat_donors.get(m.donor_id)
            m_raw_te = (m_don.name_telugu if m_don else "").strip() if m_don else ""
            m_raw_en = (m_don.name_english if m_don else "").strip() if m_don else ""

            if not m_raw_te and _has_telugu(m.donor_name):
                m_raw_te = m.donor_name.strip()
            if not m_raw_en and not _has_telugu(m.donor_name) and m.donor_name not in ("N/A", "undefined"):
                m_raw_en = m.donor_name.strip()

            m_disp_te = m_raw_te or m_raw_en or m.donor_name or "అజ్ఞాత దాత"
            m_disp_en = m_raw_en or m_raw_te or m.donor_name or "Anonymous Donor"

            items.append({
                "id": m.id,
                "donor_display_name": m_disp_te,
                "donor_display_name_english": m_disp_en,
                "donor_display_name_telugu": m_disp_te,
                "type": "MATERIAL",
                "amount": None,
                "item_description": m.item_description,
                "item_description_telugu": m.item_description_telugu or m.item_description,
                "quantity": m.quantity,
                "unit": m.unit,
                "estimated_value": m.estimated_value,  # Never added to money total!
                "date": m.received_date.strftime("%Y-%m-%d") if m.received_date else "",
                "category_name": cat_name,
                "category_name_telugu": cat_telugu
            })

    # Filtered metrics
    is_filtered = bool(search and search.strip()) or bool(category_id and category_id.strip()) or (contribution_type != "MONEY")
    filtered_received = sum(item["amount"] for item in items if item["type"] == "MONEY" and item["amount"]) if is_filtered else None
    filtered_count = len(items) if is_filtered else None

    # Sorting if combined
    if contribution_type == "ALL":
        if sort == "highest":
            items.sort(key=lambda x: (float(x["amount"] or x["estimated_value"] or 0), x["date"], x["id"] or ""), reverse=True)
        else:
            items.sort(key=lambda x: (x["date"], x["id"] or ""), reverse=True)

    # Pagination
    total_count = len(items)
    total_pages = max(1, (total_count + limit - 1) // limit)
    offset = (page - 1) * limit
    paginated_items = items[offset:offset + limit]

    last_updated_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    return {
        "total_received": total_money_received,
        "donors_count": total_monetary_donors_count,
        "materials_count": total_materials_count,
        "filtered_received": filtered_received,
        "filtered_count": filtered_count,
        "is_filtered": is_filtered,
        "categories": category_pills,
        "donations": paginated_items,
        "total_count": total_count,
        "page": page,
        "total_pages": total_pages,
        "last_updated": last_updated_str
    }

@router.get("/gallery")
def get_public_gallery(db: Session = Depends(get_db)):
    org, event = get_garuvupalem_org_and_event(db)
    if not event:
        return []

    # Query published festival days and their published photos
    days = db.query(FestivalDay).filter(
        FestivalDay.organization_id == org.id,
        FestivalDay.event_id == event.id,
        FestivalDay.is_published == True
    ).order_by(FestivalDay.day_number.asc()).all()

    from app.services.storage import get_storage_service
    storage = get_storage_service()

    albums = []
    for day in days:
        photos = db.query(DayPhoto).filter(
            DayPhoto.festival_day_id == day.id,
            DayPhoto.is_published == True
        ).order_by(DayPhoto.display_order.asc(), DayPhoto.created_at.desc()).all()

        if not photos:
            continue

        photo_list = []
        cover_url = ""
        for p in photos:
            url = storage.get_file_url(p.storage_key, is_public=True)
            if p.is_cover or not cover_url:
                cover_url = url
            photo_list.append({
                "id": p.id,
                "title": p.title or f"{day.alankaram_name_telugu} ఫోటో",
                "caption": p.caption or "",
                "url": url,
                "is_cover": p.is_cover
            })

        albums.append({
            "day_id": day.id,
            "day_number": day.day_number,
            "date": day.date,
            "alankaram_name_telugu": day.alankaram_name_telugu,
            "cover_url": cover_url,
            "photo_count": len(photo_list),
            "photos": photo_list
        })

    return albums

@router.get("/announcements")
def get_public_announcements(db: Session = Depends(get_db)):
    org, event = get_garuvupalem_org_and_event(db)
    
    announcements = db.query(Announcement).filter(
        Announcement.organization_id == org.id,
        Announcement.is_published == True
    ).order_by(Announcement.created_at.desc()).all()

    sponsors = []
    if event:
        sponsors = db.query(Sponsor).filter(
            Sponsor.organization_id == org.id,
            Sponsor.event_id == event.id,
            Sponsor.is_confirmed == True,
            Sponsor.is_published == True
        ).all()

    return {
        "announcements": [
            {
                "id": a.id,
                "title_telugu": a.title_telugu,
                "title_english": a.title_english,
                "content_telugu": a.content_telugu,
                "content_english": a.content_english,
                "created_at": a.created_at.strftime("%Y-%m-%d")
            } for a in announcements
        ],
        "sponsors": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "amount": float(s.amount) if s.amount else None
            } for s in sponsors
        ]
    }

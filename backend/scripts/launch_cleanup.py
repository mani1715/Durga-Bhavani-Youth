import os
import json
import sys
from datetime import datetime
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.db_models import (
    Organization, Event, User, Donor, DonorGroup, DonorGroupMember, Receipt, 
    MaterialContribution, Expense, PoojaCouple, DayPhoto, 
    Announcement, Sponsor, DonationCategory, ExpenseCategory, AuditLog, 
    FestivalDay, ProgrammeActivity, DayPujaMaterial
)
from app.services.storage import get_storage_service
from app.services.audit import write_audit_log

def run_launch_cleanup():
    db = SessionLocal()

    # 1. Scope ONLY to Garuvupalem Organization
    org = db.query(Organization).filter(
        (Organization.slug == 'garuvupalem-durga-bhavani-youth') |
        (Organization.name.ilike('%Durga Bhavani Youth%')) |
        (Organization.name.ilike('%Garuvupalem%'))
    ).first()

    if not org:
        print("ERROR: Garuvupalem organization not found!")
        sys.exit(1)

    org_id = org.id
    print(f"Scoped to Organization: {org.name} (ID: {org_id})")

    # 2. CREATE COMPLETE PRE-CLEANUP BACKUP
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backup_dir = os.path.join(backend_root, "private_backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"launch_backup_{timestamp_str}.json"
    backup_filepath = os.path.join(backup_dir, backup_filename)

    tables = [
        "organizations", "events", "users", "donors", "donor_groups", "donor_group_members",
        "donation_categories", "receipt_templates", "receipt_sequences", "receipts",
        "material_contributions", "expense_categories", "expense_sequences", "expenses",
        "festival_days", "programme_activities", "pooja_couples", "day_photos",
        "day_puja_materials", "announcements", "sponsors", "audit_logs"
    ]

    backup_data = {}
    for t in tables:
        result = db.execute(text(f"SELECT * FROM {t}"))
        rows = [dict(row._mapping) for row in result]
        for row in rows:
            for k, v in row.items():
                if isinstance(v, datetime):
                    row[k] = v.isoformat()
                elif isinstance(v, Decimal):
                    row[k] = str(v)
        backup_data[t] = rows

    with open(backup_filepath, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)

    print(f"Full private backup created successfully at:\n{backup_filepath}")

    # 3. INVENTORY OPERATIONAL STORAGE OBJECTS TO REMOVE
    day_photos = db.query(DayPhoto).filter(DayPhoto.organization_id == org_id).all()
    storage_keys_to_clean = [p.storage_key for p in day_photos if p.storage_key]
    print(f"Inventoried {len(storage_keys_to_clean)} operational storage objects for day photos.")

    # 4. PERFORM CONTROLLED TRANSACTION CLEANUP
    day_ids = [d.id for d in db.query(FestivalDay).filter(FestivalDay.organization_id == org_id).all()]
    donor_ids = [d.id for d in db.query(Donor).filter(Donor.organization_id == org_id).all()]

    counts = {}

    # Clear Receipts
    receipts_q = db.query(Receipt).filter(Receipt.organization_id == org_id)
    counts["receipts"] = receipts_q.count()
    receipts_q.delete(synchronize_session=False)

    # Clear Material Contributions
    mat_contrib_q = db.query(MaterialContribution).filter(MaterialContribution.organization_id == org_id)
    counts["material_contributions"] = mat_contrib_q.count()
    mat_contrib_q.delete(synchronize_session=False)

    # Clear Donor Group Members & Donors
    if donor_ids:
        dgm_q = db.query(DonorGroupMember).filter(DonorGroupMember.donor_id.in_(donor_ids))
        counts["donor_group_members"] = dgm_q.count()
        dgm_q.delete(synchronize_session=False)
    else:
        counts["donor_group_members"] = 0

    donors_q = db.query(Donor).filter(Donor.organization_id == org_id)
    counts["donors"] = donors_q.count()
    donors_q.delete(synchronize_session=False)

    donor_groups_q = db.query(DonorGroup).filter(DonorGroup.organization_id == org_id)
    counts["donor_groups"] = donor_groups_q.count()
    donor_groups_q.delete(synchronize_session=False)

    # Clear Expenses
    expenses_q = db.query(Expense).filter(Expense.organization_id == org_id)
    counts["expenses"] = expenses_q.count()
    expenses_q.delete(synchronize_session=False)

    # Clear Pooja Couples / Participants
    if day_ids:
        couples_q = db.query(PoojaCouple).filter(PoojaCouple.festival_day_id.in_(day_ids))
        counts["pooja_couples"] = couples_q.count()
        couples_q.delete(synchronize_session=False)
    else:
        counts["pooja_couples"] = 0

    # Clear Day Photos
    photos_q = db.query(DayPhoto).filter(DayPhoto.organization_id == org_id)
    counts["day_photos"] = photos_q.count()
    photos_q.delete(synchronize_session=False)

    # Clear Announcements & Sponsors
    ann_q = db.query(Announcement).filter(Announcement.organization_id == org_id)
    counts["announcements"] = ann_q.count()
    ann_q.delete(synchronize_session=False)

    sponsors_q = db.query(Sponsor).filter(Sponsor.organization_id == org_id)
    counts["sponsors"] = sponsors_q.count()
    sponsors_q.delete(synchronize_session=False)

    # Write Launch Cleanup Audit Log
    write_audit_log(
        db,
        org_id=org_id,
        user_id="LAUNCH_CLEANUP_SYSTEM",
        action="LAUNCH_CLEANUP",
        entity_type="Organization",
        entity_id=org_id,
        new_value={"cleanup_counts": counts, "timestamp": datetime.utcnow().isoformat()}
    )

    db.commit()
    print("Database transaction committed successfully!")
    print("Cleanup Counts:", counts)

    # 5. REMOVE CLEARED STORAGE OBJECTS
    storage = get_storage_service()
    cleaned_storage_count = 0
    for sk in storage_keys_to_clean:
        try:
            storage.delete_file(sk)
            cleaned_storage_count += 1
        except Exception as e:
            print(f"Warning: failed to delete storage key {sk}: {e}")
    print(f"Cleaned {cleaned_storage_count} storage objects from Supabase Storage.")

    # 6. VERIFY PRESERVED INTEGRITY
    print("\nPreserved Entities Verification:")
    print("Committee Users:", db.query(User).filter(User.organization_id == org_id).count())
    print("Festival Days:", db.query(FestivalDay).filter(FestivalDay.organization_id == org_id).count())
    print("Programme Activities:", db.query(ProgrammeActivity).join(FestivalDay).filter(FestivalDay.organization_id == org_id).count())
    print("Donation Categories:", db.query(DonationCategory).filter(DonationCategory.organization_id == org_id).count())
    print("Expense Categories:", db.query(ExpenseCategory).filter(ExpenseCategory.organization_id == org_id).count())
    print("Audit Logs:", db.query(AuditLog).filter(AuditLog.organization_id == org_id).count())
    print("Organization Logo:", bool(org.logo))
    print("Organization Banner:", bool(org.banner_image_url))
    print("Puja Materials:", db.query(DayPujaMaterial).filter(DayPujaMaterial.organization_id == org_id).count())

if __name__ == "__main__":
    run_launch_cleanup()

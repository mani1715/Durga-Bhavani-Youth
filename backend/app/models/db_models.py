import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, DateTime, Boolean, ForeignKey, Numeric, Integer, 
    Text, UniqueConstraint, PrimaryKeyConstraint
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

# JSON mapping type safe fallbacks for SQLite vs PostgreSQL
# SQLite uses Text to represent JSON, and custom getters/setters or TypeDecorators.
# For simplicity and robust parsing, we store JSON as Text in SQLite and JSONB in PostgreSQL.
from sqlalchemy.types import TypeDecorator

class SafeJSON(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        import json
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        import json
        if value is None:
            return None
        try:
            return json.loads(value)
        except Exception:
            return {}

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    festival_name = Column(String(255), nullable=False)
    year = Column(String(4), nullable=False)
    address = Column(Text, nullable=True)
    contact_number = Column(String(50), nullable=True)
    logo = Column(String(255), nullable=True)
    banner_image_url = Column(String(255), nullable=True)
    signature = Column(String(255), nullable=True)
    upi_qr = Column(String(255), nullable=True)
    bank_details = Column(SafeJSON, nullable=True)  # { bank_name, acc_number, ifsc, etc. }
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    events = relationship("Event", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    donors = relationship("Donor", back_populates="organization", cascade="all, delete-orphan")
    donation_categories = relationship("DonationCategory", back_populates="organization", cascade="all, delete-orphan")
    donor_groups = relationship("DonorGroup", back_populates="organization", cascade="all, delete-orphan")
    receipt_templates = relationship("ReceiptTemplate", back_populates="organization", cascade="all, delete-orphan")
    receipts = relationship("Receipt", back_populates="organization", cascade="all, delete-orphan")
    expense_categories = relationship("ExpenseCategory", back_populates="organization", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="organization", cascade="all, delete-orphan")
    receipt_sequences = relationship("ReceiptSequence", back_populates="organization", cascade="all, delete-orphan")
    expense_sequences = relationship("ExpenseSequence", back_populates="organization", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    financial_year = Column(String(4), nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, COMPLETED, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="events")
    receipts = relationship("Receipt", back_populates="event", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="event", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)  # Nullable for SUPER_ADMIN
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # SUPER_ADMIN, ORG_ADMIN, OPERATOR, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")


class Donor(Base):
    __tablename__ = "donors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    name_english = Column(String(255), nullable=True)
    name_telugu = Column(String(255), nullable=True)
    village_english = Column(String(255), nullable=True)
    village_telugu = Column(String(255), nullable=True)
    mobile = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="donors")
    receipts = relationship("Receipt", back_populates="donor")
    groups = relationship("DonorGroup", secondary="donor_group_members", back_populates="donors")


class DonorGroup(Base):
    __tablename__ = "donor_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="donor_groups")
    donors = relationship("Donor", secondary="donor_group_members", back_populates="groups")


class DonorGroupMember(Base):
    __tablename__ = "donor_group_members"

    donor_id = Column(String(36), ForeignKey("donors.id", ondelete="CASCADE"), primary_key=True)
    group_id = Column(String(36), ForeignKey("donor_groups.id", ondelete="CASCADE"), primary_key=True)


class DonationCategory(Base):
    __tablename__ = "donation_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    name_telugu = Column(String(255), nullable=True)
    name_english = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="donation_categories")
    receipts = relationship("Receipt", back_populates="category")


class ReceiptTemplate(Base):
    __tablename__ = "receipt_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    background_key = Column(String(255), nullable=True)
    elements = Column(SafeJSON, nullable=True)  # JSON config mapping for relative field offsets
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="receipt_templates")


class ReceiptSequence(Base):
    __tablename__ = "receipt_sequences"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    financial_year = Column(String(4), primary_key=True)
    current_value = Column(Integer, default=0, nullable=False)

    organization = relationship("Organization", back_populates="receipt_sequences")


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(String(36), ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    receipt_number = Column(String(100), nullable=False)  # ORG-2026-000001
    receipt_sequence = Column(Integer, nullable=False)    # Raw counter integer
    receipt_date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Numeric(12, 2), nullable=False)
    donation_category_id = Column(String(36), ForeignKey("donation_categories.id"), nullable=False)
    payment_method = Column(String(50), nullable=False)  # CASH, UPI, BANK_TRANSFER, CHEQUE, OTHER
    status = Column(String(50), default="ISSUED")  # DRAFT, ISSUED, CANCELLED, VOID
    notes = Column(Text, nullable=True)
    custom_values = Column(SafeJSON, nullable=True)  # JSON for dynamic custom fields
    template_id = Column(String(36), ForeignKey("receipt_templates.id"), nullable=True)
    pdf_storage_key = Column(String(255), nullable=True)
    image_storage_key = Column(String(255), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    public_display_name = Column(String(255), nullable=True)
    donor_name_english = Column(String(255), nullable=True)
    donor_name_telugu = Column(String(255), nullable=True)
    village_english = Column(String(255), nullable=True)
    village_telugu = Column(String(255), nullable=True)
    idempotency_key = Column(String(100), nullable=True, index=True)
    is_test = Column(Boolean, default=False)
    
    created_by = Column(String(36), nullable=False)
    updated_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_by = Column(String(36), nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint('organization_id', 'receipt_number', name='uq_org_receipt_number'),
        UniqueConstraint('organization_id', 'event_id', 'receipt_sequence', name='uq_org_event_receipt_sequence'),
    )

    organization = relationship("Organization", back_populates="receipts")
    event = relationship("Event", back_populates="receipts")
    donor = relationship("Donor", back_populates="receipts")
    category = relationship("DonationCategory", back_populates="receipts")


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    organization = relationship("Organization", back_populates="expense_categories")
    expenses = relationship("Expense", back_populates="category")


class ExpenseSequence(Base):
    __tablename__ = "expense_sequences"
    
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True)
    financial_year = Column(String(4), primary_key=True)
    current_value = Column(Integer, default=0, nullable=False)

    organization = relationship("Organization", back_populates="expense_sequences")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    expense_number = Column(String(100), nullable=False)
    expense_sequence = Column(Integer, nullable=False)
    date = Column(DateTime, nullable=False)
    category_id = Column(String(36), ForeignKey("expense_categories.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    vendor_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    payment_method = Column(String(50), nullable=False)  # CASH, UPI, BANK_TRANSFER, CHEQUE, OTHER
    status = Column(String(50), default="RECORDED")  # DRAFT, RECORDED, CANCELLED
    bill_storage_key = Column(String(255), nullable=True)
    
    created_by = Column(String(36), nullable=False)
    updated_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('organization_id', 'expense_number', name='uq_org_expense_number'),
    )

    organization = relationship("Organization", back_populates="expenses")
    event = relationship("Event", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(36), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, CANCEL, VOID, LOGIN, SHARE, etc.
    entity_type = Column(String(50), nullable=True)  # Receipt, Expense, Settings, User
    entity_id = Column(String(36), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    previous_value = Column(SafeJSON, nullable=True)
    new_value = Column(SafeJSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)


# ==========================================
# DASARA VILLAGE FESTIVAL DOMAIN ENTITIES
# ==========================================

class FestivalDay(Base):
    __tablename__ = "festival_days"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    day_number = Column(Integer, nullable=False)  # 1 to 11
    alankaram_name_telugu = Column(String(255), nullable=False)
    alankaram_name_english = Column(String(255), nullable=True)
    description_telugu = Column(Text, nullable=True)
    description_english = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    activities = relationship("ProgrammeActivity", back_populates="festival_day", cascade="all, delete-orphan", order_by="ProgrammeActivity.display_order.asc()")
    pooja_couples = relationship("PoojaCouple", back_populates="festival_day", cascade="all, delete-orphan", order_by="PoojaCouple.display_order.asc()")
    puja_materials = relationship("DayPujaMaterial", back_populates="festival_day", cascade="all, delete-orphan", order_by="DayPujaMaterial.display_order.asc()")
    photos = relationship("DayPhoto", back_populates="festival_day")


class ProgrammeActivity(Base):
    __tablename__ = "programme_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    festival_day_id = Column(String(36), ForeignKey("festival_days.id", ondelete="CASCADE"), nullable=False)
    title_telugu = Column(String(255), nullable=False)
    title_english = Column(String(255), nullable=True)
    time_str = Column(String(100), nullable=True)  # e.g., "ఉదయం 10-00 గంటలకు" or empty
    time_str_english = Column(String(100), nullable=True)  # e.g., "10:00 AM" or empty
    activity_type = Column(String(50), default="RITUAL")  # RITUAL, SPECIAL, COMPETITION, CULTURAL, PROCESSION
    display_order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)

    # Special Pujas & Extended Participation fields
    allowed_participation_types = Column(String(255), nullable=True)  # e.g. "COUPLE,INDIVIDUAL,FAMILY,OPEN_TO_ALL"
    who_can_participate_telugu = Column(Text, nullable=True)
    who_can_participate_english = Column(Text, nullable=True)
    participation_instructions_telugu = Column(Text, nullable=True)
    participation_instructions_english = Column(Text, nullable=True)
    what_to_bring_telugu = Column(Text, nullable=True)
    what_to_bring_english = Column(Text, nullable=True)
    arrival_instructions_telugu = Column(Text, nullable=True)
    arrival_instructions_english = Column(Text, nullable=True)

    festival_day = relationship("FestivalDay", back_populates="activities")
    puja_materials = relationship("DayPujaMaterial", back_populates="activity")
    participants = relationship("PoojaCouple", back_populates="activity")


class PoojaCouple(Base):
    __tablename__ = "pooja_couples"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    festival_day_id = Column(String(36), ForeignKey("festival_days.id", ondelete="CASCADE"), nullable=False)
    programme_activity_id = Column(String(36), ForeignKey("programme_activities.id", ondelete="SET NULL"), nullable=True)
    participant_type = Column(String(50), default="COUPLE", nullable=False)  # COUPLE, INDIVIDUAL, FAMILY, OPEN_TO_ALL
    person1_name = Column(String(255), nullable=False)
    person1_name_telugu = Column(String(255), nullable=True)
    person2_name = Column(String(255), nullable=True)
    person2_name_telugu = Column(String(255), nullable=True)
    family_display_name = Column(String(255), nullable=True)
    family_display_name_telugu = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    festival_day = relationship("FestivalDay", back_populates="pooja_couples")
    activity = relationship("ProgrammeActivity", back_populates="participants")


class DayPujaMaterial(Base):
    __tablename__ = "day_puja_materials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    festival_day_id = Column(String(36), ForeignKey("festival_days.id", ondelete="CASCADE"), nullable=False)
    programme_activity_id = Column(String(36), ForeignKey("programme_activities.id", ondelete="SET NULL"), nullable=True)

    item_name_telugu = Column(String(255), nullable=False)
    item_name_english = Column(String(255), nullable=True)
    quantity = Column(String(50), nullable=True)
    unit = Column(String(50), nullable=True)
    unit_telugu = Column(String(50), nullable=True)
    instructions_telugu = Column(Text, nullable=True)
    instructions_english = Column(Text, nullable=True)

    provided_by = Column(String(50), default="DEVOTEES", nullable=False)  # DEVOTEES or COMMITTEE
    display_order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    festival_day = relationship("FestivalDay", back_populates="puja_materials")
    activity = relationship("ProgrammeActivity", back_populates="puja_materials")



class DayPhoto(Base):
    __tablename__ = "day_photos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    festival_day_id = Column(String(36), ForeignKey("festival_days.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=True)
    caption = Column(Text, nullable=True)
    storage_key = Column(String(255), nullable=False)
    thumbnail_key = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)
    is_cover = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    festival_day = relationship("FestivalDay", back_populates="photos")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    title_telugu = Column(String(255), nullable=False)
    content_telugu = Column(Text, nullable=False)
    title_english = Column(String(255), nullable=True)
    content_english = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)  # e.g., "అన్నదానం దాతలు", "అలంకారం దాతలు"
    amount = Column(Numeric(12, 2), nullable=True)
    is_confirmed = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MaterialContribution(Base):
    __tablename__ = "material_contributions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(String(36), ForeignKey("donors.id", ondelete="SET NULL"), nullable=True)
    donor_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    donation_category_id = Column(String(36), ForeignKey("donation_categories.id", ondelete="SET NULL"), nullable=True)
    item_description = Column(String(255), nullable=False)
    item_description_telugu = Column(String(255), nullable=True)
    quantity = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=True)
    estimated_value = Column(Numeric(12, 2), nullable=True)  # Informational only, never added to cash money received
    received_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True)
    is_test = Column(Boolean, default=False)
    created_by = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization")
    event = relationship("Event")
    donor = relationship("Donor")
    category = relationship("DonationCategory")



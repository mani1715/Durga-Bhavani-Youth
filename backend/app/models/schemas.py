from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal

# Token & Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    organization_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str = Field(..., description="Email address or mobile phone number")
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    organization_name: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class OTPLoginRequest(BaseModel):
    phone: str
    otp: str

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str
    festival_name: str
    year: str
    address: Optional[str] = None
    contact_number: Optional[str] = None
    bank_details: Optional[Dict[str, Any]] = None

class OrganizationCreate(OrganizationBase):
    slug: str

class OrganizationResponse(OrganizationBase):
    id: str
    slug: str
    logo: Optional[str] = None
    signature: Optional[str] = None
    upi_qr: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    organization_id: Optional[str] = None

class UserResponse(UserBase):
    id: str
    organization_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Event Schemas
class EventBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    financial_year: str
    status: str = "ACTIVE"

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Donor Schemas
class DonorBase(BaseModel):
    name: str
    name_english: Optional[str] = None
    name_telugu: Optional[str] = None
    village_english: Optional[str] = None
    village_telugu: Optional[str] = None
    mobile: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class DonorCreate(DonorBase):
    pass

class DonorResponse(DonorBase):
    id: str
    organization_id: str
    created_at: datetime
    total_contribution: Optional[Decimal] = Decimal("0.00")

    class Config:
        from_attributes = True

# Donation Category Schemas
class DonationCategoryBase(BaseModel):
    name: str
    name_telugu: Optional[str] = None
    name_english: Optional[str] = None
    display_order: Optional[int] = 0
    description: Optional[str] = None
    is_active: bool = True

class DonationCategoryCreate(DonationCategoryBase):
    pass

class DonationCategoryUpdate(BaseModel):
    name: Optional[str] = None
    name_telugu: Optional[str] = None
    name_english: Optional[str] = None
    display_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DonationCategoryResponse(DonationCategoryBase):
    id: str
    organization_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Receipt Custom Fields
class CustomFieldConfig(BaseModel):
    name: str
    field_type: str  # text, number, date, dropdown, checkbox
    options: Optional[List[str]] = None

# Receipt Schemas
class ReceiptCreate(BaseModel):
    event_id: str
    donor_id: Optional[str] = None  # If not provided, donor_info MUST be provided
    donor_name: Optional[str] = None
    donor_name_english: Optional[str] = None
    donor_name_telugu: Optional[str] = None
    village_english: Optional[str] = None
    village_telugu: Optional[str] = None
    donor_mobile: Optional[str] = None
    donor_email: Optional[EmailStr] = None
    donor_address: Optional[str] = None
    amount: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    donation_category_id: str
    payment_method: str  # CASH, UPI, BANK_TRANSFER, CHEQUE, OTHER
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    is_anonymous: Optional[bool] = False
    is_test: Optional[bool] = False
    custom_values: Optional[Dict[str, Any]] = None
    template_id: Optional[str] = None
    template_elements: Optional[Dict[str, Any]] = None
    template_background: Optional[str] = None
    logo_text: Optional[str] = None
    org_name: Optional[str] = None
    org_address: Optional[str] = None
    contact_number: Optional[str] = None
    email_address: Optional[str] = None
    thank_you_message: Optional[str] = None

class ReceiptUpdate(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    donation_category_id: str
    payment_method: str
    donor_name: Optional[str] = None
    donor_mobile: Optional[str] = None
    notes: Optional[str] = None
    custom_values: Optional[Dict[str, Any]] = None

class ReceiptCancelRequest(BaseModel):
    reason: str

class ReceiptDownloadRequest(BaseModel):
    template_elements: Optional[Dict[str, Any]] = None
    template_background: Optional[str] = None
    logo_text: Optional[str] = None
    org_name: Optional[str] = None
    org_address: Optional[str] = None
    contact_number: Optional[str] = None
    email_address: Optional[str] = None
    thank_you_message: Optional[str] = None

class ReceiptResponse(BaseModel):
    id: str
    organization_id: str
    event_id: str
    donor_id: str
    donor_name: Optional[str] = None
    donor_name_english: Optional[str] = None
    donor_name_telugu: Optional[str] = None
    village_english: Optional[str] = None
    village_telugu: Optional[str] = None
    donor_mobile: Optional[str] = None
    receipt_number: str
    receipt_sequence: int
    receipt_date: datetime
    amount: Decimal
    donation_category_id: str
    payment_method: str
    status: str
    notes: Optional[str] = None
    custom_values: Optional[Dict[str, Any]] = None
    template_id: Optional[str] = None
    pdf_storage_key: Optional[str] = None
    image_storage_key: Optional[str] = None
    is_anonymous: Optional[bool] = False
    is_test: Optional[bool] = False
    created_by: str
    created_at: datetime
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None

    class Config:
        from_attributes = True

# Expense Category Schemas
class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: str
    organization_id: str

    class Config:
        from_attributes = True

# Expense Schemas
class ExpenseCreate(BaseModel):
    event_id: str
    category_id: str
    amount: Decimal = Field(..., gt=Decimal("0.00"), max_digits=12, decimal_places=2)
    date: datetime
    vendor_name: Optional[str] = None
    description: Optional[str] = None
    payment_method: str  # CASH, UPI, BANK_TRANSFER, CHEQUE, OTHER
    receipt_image: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    organization_id: str
    event_id: str
    expense_number: str
    expense_sequence: int
    date: datetime
    category_id: str
    amount: Decimal
    vendor_name: Optional[str] = None
    description: Optional[str] = None
    payment_method: str
    status: str
    bill_storage_key: Optional[str] = None
    receipt_image: Optional[str] = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: str
    organization_id: Optional[str] = None
    user_id: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    timestamp: datetime
    previous_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True

# Public & Festival Schemas
class ProgrammeActivitySchema(BaseModel):
    id: str
    title_telugu: str
    title_english: Optional[str] = None
    time_str: Optional[str] = None
    activity_type: str
    display_order: int
    is_published: bool

    class Config:
        from_attributes = True

class PoojaCoupleSchema(BaseModel):
    id: str
    person1_name: str
    person2_name: Optional[str] = None
    family_display_name: Optional[str] = None
    display_order: int
    is_published: bool

    class Config:
        from_attributes = True

class FestivalDaySchema(BaseModel):
    id: str
    date: str
    day_number: int
    alankaram_name_telugu: str
    alankaram_name_english: Optional[str] = None
    description_telugu: Optional[str] = None
    description_english: Optional[str] = None
    is_completed: bool
    is_published: bool
    activities: List[ProgrammeActivitySchema] = []
    pooja_couples: List[PoojaCoupleSchema] = []

    class Config:
        from_attributes = True

class DayPhotoSchema(BaseModel):
    id: str
    festival_day_id: Optional[str] = None
    title: Optional[str] = None
    caption: Optional[str] = None
    storage_key: str
    thumbnail_key: Optional[str] = None
    url: Optional[str] = None
    display_order: int
    is_published: bool
    is_cover: bool

    class Config:
        from_attributes = True

class AnnouncementSchema(BaseModel):
    id: str
    title_telugu: str
    content_telugu: str
    title_english: Optional[str] = None
    content_english: Optional[str] = None
    is_published: bool
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Material Contribution Schemas
class MaterialContributionBase(BaseModel):
    donor_name: str
    phone: Optional[str] = None
    donation_category_id: Optional[str] = None
    item_description: str
    item_description_telugu: Optional[str] = None
    quantity: str
    unit: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    received_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_published: bool = True

class MaterialContributionCreate(MaterialContributionBase):
    event_id: Optional[str] = None

class MaterialContributionUpdate(BaseModel):
    donor_name: Optional[str] = None
    phone: Optional[str] = None
    donation_category_id: Optional[str] = None
    item_description: Optional[str] = None
    item_description_telugu: Optional[str] = None
    quantity: Optional[str] = None
    unit: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    received_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_published: Optional[bool] = None

class MaterialContributionResponse(MaterialContributionBase):
    id: str
    organization_id: str
    event_id: str
    category_name: Optional[str] = None
    category_name_telugu: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Public Donation / Contribution Schemas
class PublicContributionItemSchema(BaseModel):
    id: Optional[str] = None
    donor_display_name: str
    donor_display_name_english: Optional[str] = None
    donor_display_name_telugu: Optional[str] = None
    type: str  # "MONEY" | "MATERIAL"
    amount: Optional[Decimal] = None
    item_description: Optional[str] = None
    item_description_telugu: Optional[str] = None
    quantity: Optional[str] = None
    unit: Optional[str] = None
    estimated_value: Optional[Decimal] = None
    date: str
    category_name: Optional[str] = None
    category_name_telugu: Optional[str] = None

class PublicCategoryPillSchema(BaseModel):
    id: str
    name: str
    name_telugu: Optional[str] = None
    name_english: Optional[str] = None
    display_order: int = 0

class PublicDonationsResponse(BaseModel):
    total_received: Decimal
    donors_count: int
    materials_count: int
    filtered_received: Optional[Decimal] = None
    filtered_count: Optional[int] = None
    is_filtered: bool = False
    categories: List[PublicCategoryPillSchema] = []
    donations: List[PublicContributionItemSchema] = []
    total_count: int = 0
    page: int = 1
    total_pages: int = 1
    last_updated: str



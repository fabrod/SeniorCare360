from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.user import DeliveryStatus, MedicationStatus, VitalType


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    first_name: str


# ─── User ─────────────────────────────────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    medicare_id: Optional[str] = None
    medicaid_id: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_member_id: Optional[str] = None
    preferred_language: Optional[str] = None
    large_text_mode: Optional[bool] = None
    push_token: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    medicare_id: Optional[str] = None
    medicaid_id: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_member_id: Optional[str] = None
    preferred_language: str = "en"
    large_text_mode: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Medication ───────────────────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    prescriber: Optional[str] = None
    pharmacy_name: Optional[str] = None
    pharmacy_rx_number: Optional[str] = None
    refills_remaining: Optional[int] = 0
    next_refill_date: Optional[datetime] = None
    schedule_times: Optional[List[str]] = None
    reminder_enabled: bool = True


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    refills_remaining: Optional[int] = None
    next_refill_date: Optional[datetime] = None
    status: Optional[MedicationStatus] = None
    schedule_times: Optional[List[str]] = None
    reminder_enabled: Optional[bool] = None


class MedicationResponse(BaseModel):
    id: int
    name: str
    generic_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    prescriber: Optional[str] = None
    pharmacy_name: Optional[str] = None
    pharmacy_rx_number: Optional[str] = None
    refills_remaining: int = 0
    next_refill_date: Optional[datetime] = None
    status: MedicationStatus
    schedule_times: Optional[List[str]] = None
    reminder_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Delivery ─────────────────────────────────────────────────────────────────

class DeliveryRequest(BaseModel):
    medication_id: int
    special_instructions: Optional[str] = None
    use_saved_address: bool = True
    custom_address: Optional[str] = None


class DeliveryResponse(BaseModel):
    id: int
    medication_id: Optional[int] = None
    delivery_address: str
    status: DeliveryStatus
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    special_instructions: Optional[str] = None
    pharmacy_order_id: Optional[str] = None
    requested_at: datetime

    class Config:
        from_attributes = True


# ─── Vitals ───────────────────────────────────────────────────────────────────

class VitalCreate(BaseModel):
    vital_type: VitalType
    value_primary: float
    value_secondary: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None


class VitalResponse(BaseModel):
    id: int
    vital_type: VitalType
    value_primary: float
    value_secondary: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


# ─── Appointments ─────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    appointment_date: datetime
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    doctor_name: str
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    appointment_date: datetime
    notes: Optional[str] = None
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Emergency Contacts ───────────────────────────────────────────────────────

class EmergencyContactCreate(BaseModel):
    name: str
    contact_relationship: Optional[str] = None
    phone: str
    email: Optional[str] = None
    is_primary: bool = False
    notify_on_sos: bool = True


class EmergencyContactResponse(BaseModel):
    id: int
    name: str
    contact_relationship: Optional[str] = None
    phone: str
    email: Optional[str] = None
    is_primary: bool
    notify_on_sos: bool

    class Config:
        from_attributes = True


# ─── SOS ──────────────────────────────────────────────────────────────────────

class SOSRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: Optional[str] = "SOS - I need help!"


class SOSResponse(BaseModel):
    success: bool
    contacts_notified: int
    message: str


# ─── Benefits ─────────────────────────────────────────────────────────────────

class BenefitItem(BaseModel):
    name: str
    description: str
    category: str
    eligibility: str
    how_to_apply: str
    phone: Optional[str] = None
    website: Optional[str] = None


class BenefitsResponse(BaseModel):
    benefits: List[BenefitItem]
    total: int

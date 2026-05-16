from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class DeliveryStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class MedicationStatus(str, enum.Enum):
    active = "active"
    discontinued = "discontinued"
    refill_needed = "refill_needed"
    ready_for_pickup = "ready_for_pickup"
    ready_for_delivery = "ready_for_delivery"


class VitalType(str, enum.Enum):
    blood_pressure = "blood_pressure"
    glucose = "glucose"
    heart_rate = "heart_rate"
    weight = "weight"
    oxygen_saturation = "oxygen_saturation"
    temperature = "temperature"


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    profile_photo_url = Column(String(500), nullable=True)

    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    country = Column(String(50), default="US")

    medicare_id = Column(String(100), nullable=True)
    medicaid_id = Column(String(100), nullable=True)
    insurance_provider = Column(String(100), nullable=True)
    insurance_member_id = Column(String(100), nullable=True)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    preferred_language = Column(String(10), default="en")
    large_text_mode = Column(Boolean, default=True)
    push_token = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    medications = relationship("Medication", back_populates="user", cascade="all, delete")
    deliveries = relationship("Delivery", back_populates="user", cascade="all, delete")
    vitals = relationship("Vital", back_populates="user", cascade="all, delete")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete")
    emergency_contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete")
    family_members = relationship("FamilyMember", back_populates="user", cascade="all, delete", foreign_keys="FamilyMember.user_id")


# ─── Medication ───────────────────────────────────────────────────────────────

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String(200), nullable=False)
    generic_name = Column(String(200), nullable=True)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(200), nullable=True)
    instructions = Column(Text, nullable=True)
    prescriber = Column(String(200), nullable=True)
    pharmacy_name = Column(String(200), nullable=True)
    pharmacy_rx_number = Column(String(100), nullable=True)
    refills_remaining = Column(Integer, default=0)
    next_refill_date = Column(DateTime, nullable=True)
    status = Column(Enum(MedicationStatus), default=MedicationStatus.active)
    schedule_times = Column(JSON, nullable=True)
    reminder_enabled = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="medications")
    deliveries = relationship("Delivery", back_populates="medication")


# ─── Delivery ─────────────────────────────────────────────────────────────────

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=True)

    delivery_address = Column(Text, nullable=False)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.pending)
    tracking_number = Column(String(200), nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    special_instructions = Column(Text, nullable=True)
    pharmacy_order_id = Column(String(200), nullable=True)
    pharmacy_confirmation = Column(JSON, nullable=True)

    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="deliveries")
    medication = relationship("Medication", back_populates="deliveries")


# ─── Vital Signs ──────────────────────────────────────────────────────────────

class Vital(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    vital_type = Column(Enum(VitalType), nullable=False)
    value_primary = Column(Float, nullable=False)
    value_secondary = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="vitals")


# ─── Appointments ─────────────────────────────────────────────────────────────

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    doctor_name = Column(String(200), nullable=False)
    specialty = Column(String(100), nullable=True)
    clinic_name = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    appointment_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    reminder_sent = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="appointments")


# ─── Emergency Contacts ───────────────────────────────────────────────────────

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String(200), nullable=False)
    contact_relationship = Column(String(100), nullable=True)   # renamed: was 'relationship'
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    is_primary = Column(Boolean, default=False)
    notify_on_sos = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="emergency_contacts")


# ─── Family Members ───────────────────────────────────────────────────────────

class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    family_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    name = Column(String(200), nullable=False)
    member_relationship = Column(String(100), nullable=True)    # renamed: was 'relationship'
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    can_view_medications = Column(Boolean, default=True)
    can_view_vitals = Column(Boolean, default=True)
    can_receive_sos = Column(Boolean, default=True)
    invite_accepted = Column(Boolean, default=False)
    invite_token = Column(String(200), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="family_members", foreign_keys=[user_id])

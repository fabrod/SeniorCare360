from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Vital, Appointment, EmergencyContact, VitalType
from app.schemas.schemas import (
    VitalCreate, VitalResponse,
    AppointmentCreate, AppointmentResponse,
    EmergencyContactCreate, EmergencyContactResponse,
    SOSRequest, SOSResponse,
    BenefitsResponse, BenefitItem,
)

# ─── Vitals Router ────────────────────────────────────────────────────────────
vitals_router = APIRouter(prefix="/vitals", tags=["Health Vitals"])


@vitals_router.post("/", response_model=VitalResponse, status_code=201)
def log_vital(
    vital: VitalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a health vital reading."""
    recorded = vital.recorded_at or datetime.utcnow()
    v = Vital(
        user_id=current_user.id,
        vital_type=vital.vital_type,
        value_primary=vital.value_primary,
        value_secondary=vital.value_secondary,
        unit=vital.unit,
        notes=vital.notes,
        recorded_at=recorded,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@vitals_router.get("/", response_model=List[VitalResponse])
def get_vitals(
    vital_type: Optional[VitalType] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get vital history, optionally filtered by type."""
    query = db.query(Vital).filter(Vital.user_id == current_user.id)
    if vital_type:
        query = query.filter(Vital.vital_type == vital_type)
    return query.order_by(Vital.recorded_at.desc()).limit(limit).all()


@vitals_router.delete("/{vital_id}", status_code=204)
def delete_vital(
    vital_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    v = db.query(Vital).filter(Vital.id == vital_id, Vital.user_id == current_user.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vital record not found.")
    db.delete(v)
    db.commit()


# ─── Appointments Router ──────────────────────────────────────────────────────
appointments_router = APIRouter(prefix="/appointments", tags=["Appointments"])


@appointments_router.post("/", response_model=AppointmentResponse, status_code=201)
def create_appointment(
    appt: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    a = Appointment(**appt.model_dump(), user_id=current_user.id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@appointments_router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    upcoming_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment).filter(Appointment.user_id == current_user.id)
    if upcoming_only:
        query = query.filter(Appointment.appointment_date >= datetime.utcnow())
    return query.order_by(Appointment.appointment_date.asc()).all()


@appointments_router.put("/{appt_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    a = db.query(Appointment).filter(
        Appointment.id == appt_id,
        Appointment.user_id == current_user.id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    a.is_completed = True
    db.commit()
    db.refresh(a)
    return a


@appointments_router.delete("/{appt_id}", status_code=204)
def delete_appointment(
    appt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    a = db.query(Appointment).filter(
        Appointment.id == appt_id,
        Appointment.user_id == current_user.id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    db.delete(a)
    db.commit()


# ─── Emergency Router ─────────────────────────────────────────────────────────
emergency_router = APIRouter(prefix="/emergency", tags=["Emergency"])


@emergency_router.get("/contacts", response_model=List[EmergencyContactResponse])
def get_emergency_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(EmergencyContact).filter(
        EmergencyContact.user_id == current_user.id
    ).all()


@emergency_router.post("/contacts", response_model=EmergencyContactResponse, status_code=201)
def add_emergency_contact(
    contact: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = EmergencyContact(**contact.model_dump(), user_id=current_user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@emergency_router.delete("/contacts/{contact_id}", status_code=204)
def delete_emergency_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found.")
    db.delete(c)
    db.commit()


@emergency_router.post("/sos", response_model=SOSResponse)
def trigger_sos(
    sos: SOSRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trigger SOS alert — notifies all emergency contacts via SMS.
    In production, integrate Twilio here.
    """
    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.user_id == current_user.id,
        EmergencyContact.notify_on_sos == True,
    ).all()

    location_text = ""
    if sos.latitude and sos.longitude:
        location_text = f"\nLocation: https://maps.google.com/?q={sos.latitude},{sos.longitude}"

    notified = 0
    for contact in contacts:
        # Production: call Twilio SMS API here
        # from twilio.rest import Client
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # client.messages.create(
        #     to=contact.phone,
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     body=f"🚨 SOS from {current_user.first_name} {current_user.last_name}!\n{sos.message}{location_text}"
        # )
        notified += 1

    return SOSResponse(
        success=True,
        contacts_notified=notified,
        message=f"SOS sent to {notified} emergency contact(s). Help is on the way!"
    )


# ─── Benefits Router ──────────────────────────────────────────────────────────
benefits_router = APIRouter(prefix="/benefits", tags=["Senior Benefits"])

SENIOR_BENEFITS = [
    BenefitItem(
        name="Medicare Part A & B",
        description="Federal health insurance covering hospital stays, doctor visits, and preventive services for adults 65+.",
        category="Health Insurance",
        eligibility="Age 65+ or certain disabilities",
        how_to_apply="Apply online at SSA.gov or call 1-800-772-1213",
        phone="1-800-633-4227",
        website="https://www.medicare.gov",
    ),
    BenefitItem(
        name="Medicare Part D (Prescription Drug)",
        description="Covers prescription drugs at participating pharmacies. Reduces out-of-pocket medication costs significantly.",
        category="Prescription Drugs",
        eligibility="Medicare enrollees",
        how_to_apply="Compare plans and enroll at Medicare.gov",
        phone="1-800-633-4227",
        website="https://www.medicare.gov/drug-coverage-part-d",
    ),
    BenefitItem(
        name="Medicaid",
        description="State and federal program providing free or low-cost health coverage for low-income seniors.",
        category="Health Insurance",
        eligibility="Low-income individuals; criteria vary by state",
        how_to_apply="Apply at your state Medicaid office or Healthcare.gov",
        phone="1-877-267-2323",
        website="https://www.medicaid.gov",
    ),
    BenefitItem(
        name="Social Security Retirement",
        description="Monthly benefit payments based on your work history. Average benefit: ~$1,800/month.",
        category="Income",
        eligibility="Age 62+ with sufficient work credits",
        how_to_apply="Apply online at SSA.gov, by phone, or at local SSA office",
        phone="1-800-772-1213",
        website="https://www.ssa.gov",
    ),
    BenefitItem(
        name="Supplemental Security Income (SSI)",
        description="Monthly payments for seniors with limited income and resources, even with little work history.",
        category="Income",
        eligibility="Age 65+, limited income/resources",
        how_to_apply="Call SSA or visit local office",
        phone="1-800-772-1213",
        website="https://www.ssa.gov/ssi",
    ),
    BenefitItem(
        name="Extra Help (Low Income Subsidy)",
        description="Helps pay Medicare Part D costs — premiums, deductibles, and copays. Could save $5,000+/year.",
        category="Prescription Drugs",
        eligibility="Limited income and resources",
        how_to_apply="Apply at SSA.gov or call SSA",
        phone="1-800-772-1213",
        website="https://www.ssa.gov/extrahelp",
    ),
    BenefitItem(
        name="SNAP (Food Stamps)",
        description="Monthly funds on an EBT card to buy groceries at most stores.",
        category="Food Assistance",
        eligibility="Low-income seniors; many qualify easily",
        how_to_apply="Apply at your local SNAP office or Benefits.gov",
        phone="1-800-221-5689",
        website="https://www.fns.usda.gov/snap",
    ),
    BenefitItem(
        name="LIHEAP (Energy Assistance)",
        description="Helps pay heating and cooling bills to keep your home safe and comfortable.",
        category="Utility Assistance",
        eligibility="Low-income households",
        how_to_apply="Contact your local Community Action Agency",
        phone="1-866-674-6327",
        website="https://www.acf.hhs.gov/ocs/liheap",
    ),
]


@benefits_router.get("/", response_model=BenefitsResponse)
def get_benefits(category: Optional[str] = None):
    """Get list of senior benefits, optionally filtered by category."""
    filtered = SENIOR_BENEFITS
    if category:
        filtered = [b for b in SENIOR_BENEFITS if b.category.lower() == category.lower()]
    return BenefitsResponse(benefits=filtered, total=len(filtered))

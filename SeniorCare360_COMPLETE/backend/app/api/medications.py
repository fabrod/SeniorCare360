from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Medication, Delivery, DeliveryStatus, MedicationStatus
from app.schemas.schemas import (
    MedicationCreate, MedicationUpdate, MedicationResponse,
    DeliveryRequest, DeliveryResponse
)
from datetime import datetime, timedelta

router = APIRouter(prefix="/medications", tags=["Medications"])


@router.get("/", response_model=List[MedicationResponse])
def list_medications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all medications for current user."""
    return db.query(Medication).filter(Medication.user_id == current_user.id).all()


@router.post("/", response_model=MedicationResponse, status_code=201)
def add_medication(
    med_data: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new medication to the user's list."""
    med = Medication(**med_data.model_dump(), user_id=current_user.id)
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.get("/{med_id}", response_model=MedicationResponse)
def get_medication(
    med_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = db.query(Medication).filter(
        Medication.id == med_id,
        Medication.user_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")
    return med


@router.put("/{med_id}", response_model=MedicationResponse)
def update_medication(
    med_id: int,
    updates: MedicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = db.query(Medication).filter(
        Medication.id == med_id,
        Medication.user_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(med, field, value)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/{med_id}", status_code=204)
def delete_medication(
    med_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = db.query(Medication).filter(
        Medication.id == med_id,
        Medication.user_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")
    db.delete(med)
    db.commit()


@router.post("/request-delivery", response_model=DeliveryResponse, status_code=201)
def request_delivery(
    request: DeliveryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    ONE-TAP DELIVERY: Request prescription delivery to home address.
    Creates a delivery record and (in production) calls the pharmacy API.
    """
    # Validate medication belongs to user
    med = db.query(Medication).filter(
        Medication.id == request.medication_id,
        Medication.user_id == current_user.id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found.")

    # Determine delivery address
    if request.use_saved_address:
        if not current_user.address_line1:
            raise HTTPException(
                status_code=400,
                detail="No home address saved. Please update your profile with a delivery address."
            )
        address_parts = filter(None, [
            current_user.address_line1,
            current_user.address_line2,
            current_user.city,
            current_user.state,
            current_user.zip_code,
        ])
        delivery_address = ", ".join(address_parts)
    else:
        if not request.custom_address:
            raise HTTPException(status_code=400, detail="Custom address required.")
        delivery_address = request.custom_address

    # Create delivery record
    delivery = Delivery(
        user_id=current_user.id,
        medication_id=med.id,
        delivery_address=delivery_address,
        status=DeliveryStatus.pending,
        special_instructions=request.special_instructions,
        estimated_delivery=datetime.utcnow() + timedelta(days=2),
        # In production: call pharmacy API here and store pharmacy_order_id
        pharmacy_order_id=f"RX-{med.pharmacy_rx_number}-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
    )
    db.add(delivery)

    # Update medication status
    med.status = MedicationStatus.ready_for_delivery
    db.commit()
    db.refresh(delivery)
    return delivery


@router.get("/deliveries/history", response_model=List[DeliveryResponse])
def delivery_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all delivery history for the user."""
    return db.query(Delivery).filter(
        Delivery.user_id == current_user.id
    ).order_by(Delivery.requested_at.desc()).all()


@router.get("/deliveries/{delivery_id}", response_model=DeliveryResponse)
def track_delivery(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Track a specific delivery."""
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.user_id == current_user.id
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found.")
    return delivery
